#!/bin/sh
# Nightly off-host pull of the encrypted Chronos backup (runs on the separate
# frontend VPS as an unprivileged user). It stores ciphertext only, keeps
# RETENTION_DAYS of copies and acknowledges a verified copy to the backend.
# Settings: $HOME/chronos-backup/pull.env (see pull.env.example).
set -eu
umask 077
base="$HOME/chronos-backup"
. "$base/pull.env"
: "${BACKUP_HOST:?}" "${BACKUP_USER:?}" "${SSH_KEY:?}" "${KNOWN_HOSTS:?}" "${RETENTION_DAYS:?}"

archive="$base/archive"
mkdir -p "$archive"
# One run at a time; a stuck run must not stack up behind the next cron start.
exec 9>"$base/.pull.lock"
flock -n 9 || { echo 'previous backup pull still running' >&2; exit 4; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
partial="$archive/.chronos-$stamp.partial"
trap 'rm -f "$partial"' EXIT INT TERM

remote() {
  # A dead link ends after about two minutes; a stalled backend after PULL_TIMEOUT.
  timeout "${PULL_TIMEOUT:-2h}" ssh -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=30 \
    -o ServerAliveInterval=30 -o ServerAliveCountMax=4 \
    -o UserKnownHostsFile="$KNOWN_HOSTS" -o StrictHostKeyChecking=yes \
    "$BACKUP_USER@$BACKUP_HOST" "$@"
}

remote stream > "$partial"
size=$(stat -c %s "$partial")
test "$size" -gt 4096
# An OpenPGP message encrypted to a public key starts with a PKESK packet (tag 1).
first=$(od -An -N1 -tx1 "$partial" | tr -d ' ')
case "$first" in 84|85|c1) ;; *) echo "unexpected backup format ($first)" >&2; exit 3 ;; esac

# The backend accepts the ack only if this digest matches the archive it produced,
# so a corrupted or incomplete copy is never marked fresh (and is not kept).
digest=$(sha256sum "$partial" | cut -d' ' -f1)
remote "ack $digest"
final="$archive/chronos-$stamp.tar.gpg"
mv "$partial" "$final"
find "$archive" -name 'chronos-*.tar.gpg' -type f -mtime "+$RETENTION_DAYS" -delete
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) stored $(basename "$final") bytes=$size sha256=$digest"
