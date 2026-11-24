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
stamp=$(date -u +%Y%m%dT%H%M%SZ)
partial="$archive/.chronos-$stamp.partial"
trap 'rm -f "$partial"' EXIT INT TERM

remote() {
  ssh -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes -o ConnectTimeout=30 \
    -o UserKnownHostsFile="$KNOWN_HOSTS" -o StrictHostKeyChecking=yes \
    "$BACKUP_USER@$BACKUP_HOST" "$@"
}

remote stream > "$partial"
size=$(stat -c %s "$partial")
test "$size" -gt 4096
# An OpenPGP message encrypted to a public key starts with a PKESK packet (tag 1).
first=$(od -An -N1 -tx1 "$partial" | tr -d ' ')
case "$first" in 84|85|c1) ;; *) echo "unexpected backup format ($first)" >&2; exit 3 ;; esac

final="$archive/chronos-$stamp.tar.gpg"
mv "$partial" "$final"
digest=$(sha256sum "$final" | cut -d' ' -f1)
remote "ack $digest"
find "$archive" -name 'chronos-*.tar.gpg' -type f -mtime "+$RETENTION_DAYS" -delete
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) stored $(basename "$final") bytes=$size sha256=$digest"
