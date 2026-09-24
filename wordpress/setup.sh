#!/bin/bash
#
# Chronos Local Development Setup
# Run this after `docker-compose up -d` to configure WordPress automatically.
#
# Usage: bash setup.sh
#

set -e

CONTAINER="${CHRONOS_WP_CONTAINER:-wordpress-wordpress-1}"
SITE_URL="${CHRONOS_SITE_URL:-http://localhost:8888}"
ADMIN_USER="admin"
ADMIN_PASS="admin"
ADMIN_EMAIL="admin@chronos.local"
WP_CLI_URL="${CHRONOS_WP_CLI_URL:-https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar}"
WAIT_ATTEMPTS="${CHRONOS_WAIT_ATTEMPTS:-90}" # × 2 s

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
  echo "❌ Container $CONTAINER is not running. Start it with: docker-compose up -d" >&2
  exit 1
fi

# The official wordpress image ships without WP-CLI. Verify the download
# against the SHA-512 checksum published next to the phar.
if ! docker exec "$CONTAINER" sh -c 'command -v wp' >/dev/null 2>&1; then
  echo "📥 Installing WP-CLI in $CONTAINER..."
  docker exec "$CONTAINER" sh -c "
    curl -sSfLo /tmp/wp-cli.phar '$WP_CLI_URL' &&
    curl -sSfLo /tmp/wp-cli.phar.sha512 '$WP_CLI_URL.sha512' &&
    echo \"\$(cat /tmp/wp-cli.phar.sha512)  /tmp/wp-cli.phar\" | sha512sum -c - &&
    mv /tmp/wp-cli.phar /usr/local/bin/wp && chmod +x /usr/local/bin/wp"
fi

# Wait for wp-config.php (written by the image entrypoint) and the database,
# not for an installed site: a fresh clone has no site yet, so waiting on
# `wp core is-installed` would never finish.
echo "⏳ Waiting for wp-config.php and the database..."
attempt=0
# shellcheck disable=SC2016 # expanded by PHP inside the container
until docker exec "$CONTAINER" php -r '
  if (!is_file("/var/www/html/wp-config.php")) { exit(1); }
  [$h, $p] = array_pad(explode(":", getenv("WORDPRESS_DB_HOST")), 2, "3306");
  try { new mysqli($h, getenv("WORDPRESS_DB_USER"), getenv("WORDPRESS_DB_PASSWORD"), getenv("WORDPRESS_DB_NAME"), (int) $p); }
  catch (Throwable $e) { exit(1); }' 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$WAIT_ATTEMPTS" ]; then
    echo "❌ Database not reachable after $((WAIT_ATTEMPTS * 2)) s. Check the db container and the WORDPRESS_DB_* settings." >&2
    exit 1
  fi
  sleep 2
done
echo "✅ WordPress and database are reachable."

# Install WordPress if not configured.
if ! docker exec "$CONTAINER" wp option get siteurl --allow-root 2>/dev/null | grep -q "$SITE_URL"; then
  echo "🔧 Installing WordPress..."
  docker exec "$CONTAINER" wp core install \
    --url="$SITE_URL" \
    --title="Chronos Luxury Watches" \
    --admin_user="$ADMIN_USER" \
    --admin_password="$ADMIN_PASS" \
    --admin_email="$ADMIN_EMAIL" \
    --skip-email \
    --allow-root
fi

# Install required plugins.
echo "📦 Installing plugins..."
PLUGINS=(
  "woocommerce"
  "advanced-custom-fields"
  "wp-graphql"
  "wp-mail-smtp"
)

for plugin in "${PLUGINS[@]}"; do
  if ! docker exec "$CONTAINER" wp plugin is-installed "$plugin" --allow-root 2>/dev/null; then
    echo "  Installing $plugin..."
    docker exec "$CONTAINER" wp plugin install "$plugin" --activate --allow-root
  else
    docker exec "$CONTAINER" wp plugin activate "$plugin" --allow-root 2>/dev/null || true
  fi
done

# Activate custom plugins.
echo "🔌 Activating custom plugins..."
docker exec "$CONTAINER" wp plugin activate chronos-bridge --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp plugin activate chronos-blocks --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp plugin activate wp-graphql-cors-master --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp plugin activate wp-graphql-jwt-authentication-0.7.0 --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp plugin activate wp-graphql-woocommerce-v0.19.0 --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp plugin activate wpgraphql-acf --allow-root 2>/dev/null || true

# Configure WooCommerce basics.
echo "🛒 Configuring WooCommerce..."
docker exec "$CONTAINER" wp option update woocommerce_currency "USD" --allow-root
docker exec "$CONTAINER" wp option update woocommerce_store_address "123 Watch Street" --allow-root
docker exec "$CONTAINER" wp option update woocommerce_store_city "New York" --allow-root
docker exec "$CONTAINER" wp option update woocommerce_default_country "US:NY" --allow-root

# Enable pretty permalinks (needed for REST API and GraphQL).
docker exec "$CONTAINER" wp rewrite structure '/%postname%/' --allow-root
docker exec "$CONTAINER" wp rewrite flush --allow-root

# Enable WP_DEBUG.
docker exec "$CONTAINER" wp config set WP_DEBUG true --raw --allow-root 2>/dev/null || true
docker exec "$CONTAINER" wp config set WP_DEBUG_LOG true --raw --allow-root 2>/dev/null || true

echo ""
echo "✅ Chronos local development is ready!"
echo ""
echo "   WordPress:  $SITE_URL"
echo "   Admin:      $SITE_URL/wp-admin"
echo "   GraphQL:    $SITE_URL/graphql"
echo "   REST API:   $SITE_URL/wp-json/chronos/v1/"
echo "   phpMyAdmin: http://localhost:8081"
echo ""
echo "   Admin login: $ADMIN_USER / $ADMIN_PASS"
echo ""
