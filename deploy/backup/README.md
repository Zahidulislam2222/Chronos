# Encrypted off-host backups

Nightly, the separate frontend server pulls an encrypted copy of the backend's
database, uploads, `wp-config.php` and nginx site configuration. The backend
encrypts with a public OpenPGP key, so neither server can decrypt a backup; the
private key stays with the owner.

| File | Runs on | Purpose |
|---|---|---|
| `chronos-backup-stream.sh` | backend, as root through one sudoers rule | `stream`: dump (`--single-transaction`), write `MANIFEST`, stream a tar through `gpg` to stdout. Plaintext is staged only in RAM (`/dev/shm`); uploads stream from the site directory. Any failure exits non-zero (`pipefail`), so a truncated archive is never acknowledged. `ack <sha256>`: record the confirmed off-host copy (exactly 64 lowercase hex characters) |
| `pull-backup.sh` | off-host server, unprivileged user, cron | Pull, check size and OpenPGP format, keep `RETENTION_DAYS`, acknowledge |
| `backup.conf.example`, `pull.env.example` | both | Settings (no secrets) |

## Access model

- Backend user `chronos-backup` has no password and one `authorized_keys` entry:
  `restrict,command="sudo -n /usr/local/sbin/chronos-backup-stream"`.
- `/etc/sudoers.d/chronos-backup` allows exactly that script, keeping only
  `SSH_ORIGINAL_COMMAND` (`stream` or `ack <digest>`).
- The off-host server pins the backend host key in its own `known_hosts`.

## Alerting

When the WordPress option `chronos_backup_marker_file` names the marker file,
`GET /wp-json/chronos/v1/health/backup` returns `{"status":"ok"}` (200) or
`{"status":"stale"}` (503) once the last acknowledged copy is older than
`chronos_backup_max_age_hours` (default 30); without the option it returns
`{"status":"off"}`. The site health endpoint does not include it, so a stale
backup is never counted as storefront downtime. The scheduled Availability
workflow checks it as a separate, non-SLO path and fails to notify the owner.

## Restore

```bash
export GNUPGHOME=<private keyring>          # see the private credentials record
gpg --decrypt chronos-<stamp>.tar.gpg | tar -x
(cd chronos && sha256sum -c <(tail -n +3 MANIFEST))   # covers uploads too
# Import chronos/database.sql into an isolated MariaDB 10.6, restore uploads
# and configuration, then verify the application (see docs/OPERATIONS.md).
```

Measured recovery point and time are recorded in the private dossier and
`docs/AVAILABILITY-AND-DR.md`.
