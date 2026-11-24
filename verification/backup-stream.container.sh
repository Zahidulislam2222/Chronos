#!/bin/bash
# Functional test of deploy/backup/chronos-backup-stream.sh in a disposable Ubuntu 22.04
# container with a fake wp-cli and a throwaway key (no real data or keys):
#   docker run --rm -v "$PWD/deploy/backup:/src:ro" -v "$PWD/verification:/t:ro" ubuntu:22.04 bash /t/backup-stream.container.sh
set -euo pipefail
apt-get update -qq >/dev/null && apt-get install -y -qq gnupg >/dev/null
pass=0; fail=0
ok() { echo "PASS $1"; pass=$((pass+1)); }
bad() { echo "FAIL $1"; fail=$((fail+1)); }

useradd -r www-data 2>/dev/null || true
mkdir -p /var/www/chronos/wp-content/uploads/2026/11 /etc/chronos-backup /etc/nginx/sites-available
echo 'define("DB_PASSWORD","synthetic");' > /var/www/chronos/wp-config.php
echo 'server {}' > /etc/nginx/sites-available/chronos
head -c 20000 /dev/urandom > /var/www/chronos/wp-content/uploads/2026/11/watch.jpg
echo hello > "/var/www/chronos/wp-content/uploads/uploads note.txt"

cat > /usr/local/bin/wp <<'EOF'
#!/bin/bash
case "$*" in
  *"db export"*) [ -f /tmp/fail-db ] && exit 1; echo "-- synthetic dump"; echo "INSERT INTO t VALUES (1);" ;;
  *"core version"*) [ -f /tmp/fail-version ] && exit 1; echo "7.1.5" ;;
  *) exit 1 ;;
esac
EOF
chmod +x /usr/local/bin/wp

export GNUPGHOME=/root/testkey; mkdir -p -m 700 $GNUPGHOME
gpg --batch --quiet --passphrase '' --quick-gen-key 'Backup Test <test@example.invalid>' rsa3072 encr never 2>/dev/null
gpg --batch --armor --export > /etc/chronos-backup/recipient.asc
cat > /etc/chronos-backup/backup.conf <<'EOF'
WP_PATH=/var/www/chronos
WP_USER=www-data
RECIPIENT_FILE=/etc/chronos-backup/recipient.asc
MARKER_FILE=/var/lib/chronos-backup/last-offhost-copy
NGINX_SITE=/etc/nginx/sites-available/chronos
EOF
cp /src/chronos-backup-stream.sh /usr/local/sbin/chronos-backup-stream && chmod 0755 /usr/local/sbin/chronos-backup-stream
S=/usr/local/sbin/chronos-backup-stream

# 1. round trip
$S > /tmp/out.gpg && ok "stream exits 0" || bad "stream exit"
mkdir /tmp/restore && gpg --batch --quiet --decrypt /tmp/out.gpg 2>/dev/null | tar -xf - -C /tmp/restore
[ -f /tmp/restore/chronos/database.sql ] && ok "dump present" || bad "dump"
cmp -s /tmp/restore/chronos/uploads/2026/11/watch.jpg /var/www/chronos/wp-content/uploads/2026/11/watch.jpg && ok "upload bytes identical" || bad "upload bytes"
[ -f "/tmp/restore/chronos/uploads/uploads note.txt" ] && ok "name with space and 'uploads' prefix kept" || bad "space name"
(cd /tmp/restore/chronos && grep -v '^created\|^wordpress' MANIFEST | sha256sum -c --quiet -) && ok "manifest verifies all files" || bad "manifest"
grep -q '^wordpress 7.1.5$' /tmp/restore/chronos/MANIFEST && ok "version recorded" || bad "version"
[ -z "$(ls /dev/shm | grep chronos-backup || true)" ] && ok "RAM staging cleaned" || bad "shm cleanup"
[ "$(cat /var/lib/chronos-backup/pending-digest)" = "$(sha256sum /tmp/out.gpg | cut -d' ' -f1)" ] && ok "pending digest recorded" || bad "pending after stream"
[ -z "$(ls /var/tmp | grep chronos || true)" ] && ok "nothing in /var/tmp" || bad "var/tmp"

# 2. failures exit non-zero
touch /tmp/fail-db; if $S > /tmp/f1 2>/dev/null; then bad "db failure detected"; else ok "db failure -> non-zero"; fi; rm /tmp/fail-db
touch /tmp/fail-version; if $S > /tmp/f2 2>/dev/null; then bad "version failure detected"; else ok "version failure -> non-zero"; fi; rm /tmp/fail-version
cp /etc/chronos-backup/recipient.asc /tmp/r.asc; echo garbage > /etc/chronos-backup/recipient.asc
if $S > /tmp/f3 2>/dev/null; then bad "gpg failure detected"; else ok "gpg failure -> non-zero"; fi; cp /tmp/r.asc /etc/chronos-backup/recipient.asc
chmod 000 /var/www/chronos/wp-content/uploads/2026/11/watch.jpg
# root can still read 000 files; simulate tar failure with a vanished uploads dir instead
mv /var/www/chronos/wp-content/uploads /var/www/chronos/wp-content/uploads.x
if $S > /tmp/f4 2>/dev/null; then bad "missing uploads detected"; else ok "missing uploads -> non-zero"; fi
mv /var/www/chronos/wp-content/uploads.x /var/www/chronos/wp-content/uploads

# 3. ack validation
good=$(sha256sum /tmp/out.gpg | cut -d' ' -f1)
forged=$(printf 'not the archive' | sha256sum | cut -d' ' -f1)
if SSH_ORIGINAL_COMMAND="ack $forged" $S 2>/dev/null; then bad "forged digest accepted"; else ok "well-formed digest of another file refused"; fi
[ ! -e /var/lib/chronos-backup/last-offhost-copy ] && ok "no marker after refused ack" || bad "marker written early"
[ "$(cat /var/lib/chronos-backup/pending-digest)" = "$good" ] && ok "pending digest equals bytes sent" || bad "pending digest"
SSH_ORIGINAL_COMMAND="ack $good" $S && grep -q "$good" /var/lib/chronos-backup/last-offhost-copy && ok "valid ack recorded" || bad "valid ack"
if SSH_ORIGINAL_COMMAND="ack $good" $S 2>/dev/null; then bad "replayed ack accepted"; else ok "replayed ack refused"; fi
for d in "$good
x" "${good}0" "${good:0:63}" "$(echo "$good" | tr a-f A-F)" "$good x" ""; do
  if SSH_ORIGINAL_COMMAND="ack $d" $S 2>/dev/null; then bad "bad digest accepted: [$d]"; else ok "bad digest refused"; fi
done
if SSH_ORIGINAL_COMMAND="rm -rf /" $S 2>/dev/null; then bad "arbitrary command"; else ok "arbitrary command refused"; fi

echo "RESULT pass=$pass fail=$fail"
[ "$fail" -eq 0 ]
