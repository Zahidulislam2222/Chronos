#!/bin/bash
# Encrypted Chronos backend backup, run as root through one sudoers rule.
#
#   (no command) | stream   write an OpenPGP-encrypted tar to stdout:
#                           database dump, uploads, wp-config.php, nginx site
#   ack <sha256>            record that the off-host copy with this digest was
#                           stored; /chronos/v1/health/backup reads the marker's age
#
# The server holds only the public key, so it cannot decrypt its own backups.
# Plaintext never touches disk: the dump and small files are staged in RAM
# (/dev/shm) and uploads are streamed straight from the site directory.
# Any failure (dump, version check, tar, gpg) exits non-zero, so the puller
# never acknowledges a truncated archive.
# Settings: /etc/chronos-backup/backup.conf (see backup.conf.example).
set -euo pipefail
umask 077
# shellcheck source=/dev/null
. /etc/chronos-backup/backup.conf
: "${WP_PATH:?}" "${WP_USER:?}" "${RECIPIENT_FILE:?}" "${MARKER_FILE:?}" "${NGINX_SITE:?}"

request=${SSH_ORIGINAL_COMMAND:-stream}
case "$request" in
  stream) ;;
  "ack "*)
    digest=${request#ack }
    # Exactly 64 lowercase hex characters: no newlines, spaces or extra text.
    case "$digest" in *[!0-9a-f]*) echo 'invalid digest' >&2; exit 2 ;; esac
    [ "${#digest}" -eq 64 ] || { echo 'invalid digest' >&2; exit 2; }
    install -d -m 0755 "$(dirname "$MARKER_FILE")"
    tmp="$MARKER_FILE.tmp"
    printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$digest" > "$tmp"
    chmod 0644 "$tmp"
    mv -f "$tmp" "$MARKER_FILE"
    exit 0 ;;
  *) echo 'unsupported request' >&2; exit 2 ;;
esac

work=$(mktemp -d /dev/shm/chronos-backup.XXXXXX)
trap 'rm -rf "$work"' EXIT INT TERM
mkdir "$work/chronos" "$work/gnupg"
uploads_parent="$WP_PATH/wp-content"
test -d "$uploads_parent/uploads"

wp_cli() { runuser -u "$WP_USER" -- wp --path="$WP_PATH" "$@"; }

# Consistent InnoDB snapshot without blocking the storefront.
wp_cli db export - --single-transaction --quick --lock-tables=false --quiet > "$work/chronos/database.sql"
test -s "$work/chronos/database.sql"
version=$(wp_cli core version)
test -n "$version"

cp -p "$WP_PATH/wp-config.php" "$work/chronos/wp-config.php"
cp -p "$NGINX_SITE" "$work/chronos/nginx-site.conf"
{
  echo "created $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "wordpress $version"
  (cd "$work/chronos" && find . -type f ! -name MANIFEST -exec sha256sum {} + | sort -k2)
  # Upload hashes are taken from the live directory just before it is streamed.
  (cd "$uploads_parent" && find uploads -type f -exec sha256sum {} + | sort -k2 | sed 's,  uploads/,  ./uploads/,')
} > "$work/chronos/MANIFEST"

tar -cf - -C "$work" chronos \
  -C "$uploads_parent" --transform='s,^uploads\(/\|$\),chronos/uploads\1,' uploads \
  | gpg --batch --no-tty --quiet --homedir "$work/gnupg" \
      --trust-model always --recipient-file "$RECIPIENT_FILE" --encrypt
