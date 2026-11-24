#!/bin/sh
# Encrypted Chronos backend backup, run as root through one sudoers rule.
#
#   (no command) | stream   write an OpenPGP-encrypted tar to stdout:
#                           database dump, uploads, wp-config.php, nginx site
#   ack <sha256>            record that the off-host copy with this digest was
#                           stored; the health endpoint reads the marker's age
#
# The server holds only the public key, so it cannot decrypt its own backups.
# Settings: /etc/chronos-backup/backup.conf (see backup.conf.example).
set -eu
umask 077
. /etc/chronos-backup/backup.conf
: "${WP_PATH:?}" "${WP_USER:?}" "${RECIPIENT_FILE:?}" "${MARKER_FILE:?}" "${NGINX_SITE:?}"

request=${SSH_ORIGINAL_COMMAND:-stream}
case "$request" in
  stream) ;;
  "ack "*)
    digest=${request#ack }
    printf '%s' "$digest" | grep -Eq '^[0-9a-f]{64}$' || { echo 'invalid digest' >&2; exit 2; }
    install -d -m 0755 "$(dirname "$MARKER_FILE")"
    tmp="$MARKER_FILE.tmp"
    printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$digest" > "$tmp"
    chmod 0644 "$tmp"
    mv -f "$tmp" "$MARKER_FILE"
    exit 0 ;;
  *) echo 'unsupported request' >&2; exit 2 ;;
esac

work=$(mktemp -d /var/tmp/chronos-backup.XXXXXX)
trap 'rm -rf "$work"' EXIT INT TERM
mkdir "$work/chronos" "$work/gnupg"

# Consistent InnoDB snapshot without blocking the storefront.
runuser -u "$WP_USER" -- wp --path="$WP_PATH" db export - \
  --single-transaction --quick --lock-tables=false --quiet > "$work/chronos/database.sql"
test -s "$work/chronos/database.sql"

cp -p "$WP_PATH/wp-config.php" "$work/chronos/wp-config.php"
cp -p "$NGINX_SITE" "$work/chronos/nginx-site.conf"
cp -a "$WP_PATH/wp-content/uploads" "$work/chronos/uploads"
{
  echo "created $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "wordpress $(runuser -u "$WP_USER" -- wp --path="$WP_PATH" core version)"
  (cd "$work/chronos" && find . -type f ! -name MANIFEST -exec sha256sum {} + | sort -k2)
} > "$work/chronos/MANIFEST"

tar -C "$work" -cf - chronos | gpg --batch --no-tty --quiet --homedir "$work/gnupg" \
  --trust-model always --recipient-file "$RECIPIENT_FILE" --encrypt
