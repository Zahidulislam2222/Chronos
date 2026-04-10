"""
Chronos CI/CD — Deploy plugins to production via cPanel Fileman API.

Walks each plugin directory, uploads every file to the corresponding
server path. Uses cPanel UAPI (Fileman/save_file_content) so no
FTP/SSH passwords are needed — only the API token.

Required environment variables (set as GitHub Secrets):
  CPANEL_URL       — https://new.aridserver.com:2083
  CPANEL_USERNAME  — cPanel username
  CPANEL_API_TOKEN — cPanel API token
"""

import os
import sys
from pathlib import Path

import requests

# ── Configuration ────────────────────────────────────────────────
CPANEL_URL = os.environ["CPANEL_URL"]
CPANEL_USERNAME = os.environ["CPANEL_USERNAME"]
CPANEL_API_TOKEN = os.environ["CPANEL_API_TOKEN"]

HEADERS = {"Authorization": f"cpanel {CPANEL_USERNAME}:{CPANEL_API_TOKEN}"}
WP_PLUGINS = f"/home/{CPANEL_USERNAME}/chronosbackend.healthcodeanalysis.com/wp-content/plugins"

# Plugins to deploy: (local_dir, remote_dir_name)
PLUGINS = [
    ("wordpress/wp-content/plugins/chronos-bridge", "chronos-bridge"),
    ("wordpress/wp-content/plugins/chronos-blocks", "chronos-blocks"),
    ("wordpress/wp-content/plugins/wp-graphql-cors-master", "wp-graphql-cors-master"),
]

# File extensions to deploy (skip binaries, lockfiles, dev files)
DEPLOY_EXTENSIONS = {
    ".php", ".js", ".css", ".json", ".xml", ".pot", ".txt", ".md",
    ".scss", ".yaml", ".yml", ".html", ".svg",
}

SKIP_DIRS = {"vendor", "node_modules", ".git", "__pycache__", "tests"}


def upload_file(local_path: str, remote_dir: str, filename: str) -> bool:
    """Upload a single file to cPanel via Fileman API."""
    try:
        with open(local_path, "r", encoding="utf-8") as f:
            content = f.read()
    except (UnicodeDecodeError, IsADirectoryError):
        return True  # Skip binary files silently

    resp = requests.post(
        f"{CPANEL_URL}/execute/Fileman/save_file_content",
        headers=HEADERS,
        data={"dir": remote_dir, "file": filename, "content": content},
        timeout=30,
    )
    result = resp.json()
    status = result.get("status", 0)

    if status != 1:
        errors = result.get("errors", "Unknown error")
        print(f"  FAILED: {filename} — {errors}")
        return False

    return True


def ensure_dir(remote_dir: str) -> bool:
    """Create a remote directory if it doesn't exist."""
    parent = str(Path(remote_dir).parent)
    dirname = Path(remote_dir).name

    resp = requests.post(
        f"{CPANEL_URL}/execute/Fileman/mkdir",
        headers=HEADERS,
        data={"dir": parent, "name": dirname},
        timeout=15,
    )
    # mkdir returns error if dir already exists — that's fine
    return True


def deploy_plugin(local_dir: str, plugin_name: str) -> tuple[int, int]:
    """Deploy all files from a local plugin directory to the server."""
    remote_base = f"{WP_PLUGINS}/{plugin_name}"
    success = 0
    failed = 0

    for root, dirs, files in os.walk(local_dir):
        # Skip dev directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for filename in files:
            ext = Path(filename).suffix.lower()
            if ext not in DEPLOY_EXTENSIONS:
                continue

            local_path = os.path.join(root, filename)
            rel_dir = os.path.relpath(root, local_dir)

            if rel_dir == ".":
                remote_dir = remote_base
            else:
                remote_dir = f"{remote_base}/{rel_dir}".replace("\\", "/")
                ensure_dir(remote_dir)

            if upload_file(local_path, remote_dir, filename):
                success += 1
            else:
                failed += 1

    return success, failed


def main():
    print("=" * 50)
    print("  Chronos Plugin Deployment")
    print("=" * 50)
    print()

    total_success = 0
    total_failed = 0

    for local_dir, plugin_name in PLUGINS:
        if not os.path.isdir(local_dir):
            print(f"SKIP: {local_dir} not found")
            continue

        print(f"Deploying: {plugin_name}")
        success, failed = deploy_plugin(local_dir, plugin_name)
        total_success += success
        total_failed += failed
        print(f"  {success} files deployed, {failed} failed")
        print()

    print("=" * 50)
    print(f"  Total: {total_success} deployed, {total_failed} failed")
    print("=" * 50)

    if total_failed > 0:
        print("DEPLOYMENT HAD FAILURES")
        sys.exit(1)

    print("ALL PLUGINS DEPLOYED SUCCESSFULLY")


if __name__ == "__main__":
    main()
