"""
Chronos CI/CD — Deploy backend plugins + frontend to production via cPanel API.

1. Backend: Triggers cPanel Git pull → .cpanel.yml → deploy.sh copies plugins
2. Frontend: Uploads dist/ files to chronos.healthcodeanalysis.com via Fileman API

Required environment variables (set as GitHub Secrets):
  CPANEL_URL       — https://bdix.aridserver.com:2083
  CPANEL_USERNAME  — cPanel username
  CPANEL_API_TOKEN — cPanel API token
"""

import os
import sys

import requests

CPANEL_URL = os.environ["CPANEL_URL"]
CPANEL_USERNAME = os.environ["CPANEL_USERNAME"]
CPANEL_API_TOKEN = os.environ["CPANEL_API_TOKEN"]

HEADERS = {"Authorization": f"cpanel {CPANEL_USERNAME}:{CPANEL_API_TOKEN}"}
REPO_ROOT = f"/home/{CPANEL_USERNAME}/repositories/Chronos"
FRONTEND_DIR = f"/home/{CPANEL_USERNAME}/chronos.healthcodeanalysis.com"


def api_call(endpoint: str, timeout: int = 60) -> dict:
    """Call cPanel UAPI and return parsed response."""
    url = f"{CPANEL_URL}/execute/{endpoint}"
    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def upload_file(local_path: str, remote_dir: str, filename: str) -> bool:
    """Upload a text file to cPanel via Fileman API."""
    try:
        with open(local_path, "r", encoding="utf-8") as f:
            content = f.read()
    except (UnicodeDecodeError, IsADirectoryError):
        return True  # Skip binary files

    resp = requests.post(
        f"{CPANEL_URL}/execute/Fileman/save_file_content",
        headers=HEADERS,
        params={"dir": remote_dir, "file": filename},
        data={"content": content},
        timeout=30,
    )
    return resp.json().get("status") == 1


def deploy_backend():
    """Deploy backend plugins via cPanel Git pull + deploy."""
    print("1. Backend: Pulling latest from GitHub...")
    result = api_call(
        f"VersionControl/update?repository_root={REPO_ROOT}&branch=main"
    )
    if result["status"] != 1:
        print(f"   PULL FAILED: {result.get('errors')}")
        return False

    last = result.get("data", {}).get("last_update", {})
    sha = last.get("identifier", "?")[:8]
    msg = last.get("message", "").strip().split("\n")[0]
    print(f"   Pulled: {sha} — {msg}")

    print("\n2. Backend: Triggering deployment...")
    result = api_call(
        f"VersionControlDeployment/create?repository_root={REPO_ROOT}"
    )
    if result["status"] != 1:
        print(f"   DEPLOY FAILED: {result.get('errors')}")
        return False

    deploy_id = result["data"].get("deploy_id", "?")
    print(f"   Deploy #{deploy_id} triggered")

    # Read deploy log
    log_path = result["data"].get("log_path", "")
    if log_path:
        try:
            log_file = os.path.basename(log_path)
            log_dir = os.path.dirname(log_path)
            log_result = api_call(
                f"Fileman/get_file_content?dir={log_dir}&file={log_file}", timeout=15
            )
            if log_result["status"] == 1:
                for line in log_result["data"]["content"].strip().split("\n"):
                    print(f"   {line}")
        except Exception:
            pass

    return True


def deploy_frontend():
    """Deploy frontend dist/ files to cPanel."""
    dist_dir = "dist"
    if not os.path.isdir(dist_dir):
        print("   dist/ not found — skipping frontend deploy")
        return False

    print("\n3. Frontend: Deploying build files...")
    success = 0
    failed = 0

    for root, dirs, files in os.walk(dist_dir):
        for filename in files:
            local_path = os.path.join(root, filename)
            rel_dir = os.path.relpath(root, dist_dir)

            if rel_dir == ".":
                remote_dir = FRONTEND_DIR
            else:
                remote_dir = f"{FRONTEND_DIR}/{rel_dir}".replace("\\", "/")

            if upload_file(local_path, remote_dir, filename):
                success += 1
            else:
                failed += 1

    print(f"   {success} files deployed, {failed} failed")
    return failed == 0


def main():
    print("=" * 50)
    print("  Chronos — Production Deployment")
    print("=" * 50)
    print()

    backend_ok = deploy_backend()
    frontend_ok = deploy_frontend()

    print("\n" + "=" * 50)
    print(f"  Backend:  {'OK' if backend_ok else 'FAILED'}")
    print(f"  Frontend: {'OK' if frontend_ok else 'FAILED'}")
    print("=" * 50)

    if not backend_ok or not frontend_ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
