"""
Chronos CI/CD — Deploy to production via cPanel Git API.

Triggers a git pull on the cPanel server, then runs .cpanel.yml
which calls scripts/deploy.sh to copy plugins to WordPress.

Required environment variables (set as GitHub Secrets):
  CPANEL_URL       — https://bdix.aridserver.com:2083
  CPANEL_USERNAME  — cPanel username
  CPANEL_API_TOKEN — cPanel API token
"""

import os
import sys
import json

import requests

CPANEL_URL = os.environ["CPANEL_URL"]
CPANEL_USERNAME = os.environ["CPANEL_USERNAME"]
CPANEL_API_TOKEN = os.environ["CPANEL_API_TOKEN"]

HEADERS = {"Authorization": f"cpanel {CPANEL_USERNAME}:{CPANEL_API_TOKEN}"}
REPO_ROOT = f"/home/{CPANEL_USERNAME}/repositories/Chronos"


def api_call(endpoint: str, timeout: int = 60) -> dict:
    """Call cPanel UAPI and return parsed response."""
    url = f"{CPANEL_URL}/execute/{endpoint}"
    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def main():
    print("=" * 50)
    print("  Chronos — cPanel Git Deployment")
    print("=" * 50)

    # Step 1: Pull latest code
    print("\n1. Pulling latest from GitHub...")
    result = api_call(
        f"VersionControl/update?repository_root={REPO_ROOT}&branch=main"
    )
    if result["status"] != 1:
        print(f"PULL FAILED: {result.get('errors', 'Unknown error')}")
        sys.exit(1)

    last_update = result.get("data", {}).get("last_update", {})
    sha = last_update.get("identifier", "unknown")[:8]
    msg = last_update.get("message", "").strip().split("\n")[0]
    print(f"   Pulled: {sha} — {msg}")

    # Step 2: Trigger deployment (.cpanel.yml)
    print("\n2. Triggering deployment...")
    result = api_call(
        f"VersionControlDeployment/create?repository_root={REPO_ROOT}"
    )
    if result["status"] != 1:
        print(f"DEPLOY FAILED: {result.get('errors', 'Unknown error')}")
        sys.exit(1)

    deploy_id = result["data"].get("deploy_id", "?")
    log_path = result["data"].get("log_path", "")
    print(f"   Deploy #{deploy_id} triggered")

    # Step 3: Read deploy log
    if log_path:
        log_file = os.path.basename(log_path)
        log_dir = os.path.dirname(log_path)
        try:
            log_result = api_call(
                f"Fileman/get_file_content?dir={log_dir}&file={log_file}",
                timeout=15,
            )
            if log_result["status"] == 1:
                print(f"\n   Deploy log:")
                for line in log_result["data"]["content"].strip().split("\n"):
                    print(f"   {line}")
        except Exception:
            print("   (could not read deploy log)")

    print("\n" + "=" * 50)
    print("  DEPLOYMENT COMPLETE")
    print("=" * 50)


if __name__ == "__main__":
    main()
