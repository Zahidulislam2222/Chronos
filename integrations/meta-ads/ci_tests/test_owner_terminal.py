"""Exercise the actual interactive owner CLI across separate processes."""

import json
import os
import select
import subprocess
import sys
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.skipif(os.name != "posix", reason="POSIX PTY harness; CLI itself is cross-platform")
def test_owner_approval_execution_and_rejection_survive_restart(tmp_path):
    import pty

    env = {k: v for k, v in os.environ.items() if not k.startswith("CHRONOS_ADS_")}
    env["PYTHONPATH"] = str(ROOT / "src") + os.pathsep + env.get("PYTHONPATH", "")
    env["CHRONOS_ADS_STATE_DB"] = str(tmp_path / "owner.sqlite3")
    command = [sys.executable, "-m", "chronos_ads.cli"]

    def cli(*args):
        result = subprocess.run([*command, *args], env=env, text=True,
                                capture_output=True, check=True, timeout=15)
        return json.loads(result.stdout)

    def owner(action, proposal_id):
        master, slave = pty.openpty()
        process = subprocess.Popen([*command, action, proposal_id], env=env,
                                   stdin=slave, stdout=slave, stderr=slave)
        os.close(slave)
        output = b""
        deadline = time.monotonic() + 15
        confirmed = False
        try:
            while time.monotonic() < deadline:
                ready, _, _ = select.select([master], [], [], 0.1)
                if ready:
                    try:
                        output += os.read(master, 65536)
                    except OSError:
                        break
                if b"after reviewing the exact account" in output and not confirmed:
                    os.write(master, f"{action.upper()} {proposal_id}\n".encode())
                    confirmed = True
                if process.poll() is not None:
                    break
            assert confirmed, output.decode(errors="replace")
            assert process.wait(timeout=5) == 0, output.decode(errors="replace")
        finally:
            os.close(master)
            if process.poll() is None:
                process.terminate()
                process.wait(timeout=5)

    proposal = cli("propose-create", "Chronos owner flow")["proposal"]
    owner("approve", proposal["id"])
    assert cli("review", proposal["id"])["proposal"]["state"] == "approved"
    assert cli("execute", proposal["id"])["proposal"]["state"] == "applied"
    assert cli("campaigns")["campaigns"][-1]["name"] == "Chronos owner flow"
    pause = cli("propose-pause", "100000001")["proposal"]
    owner("reject", pause["id"])
    assert cli("review", pause["id"])["proposal"]["state"] == "rejected"
