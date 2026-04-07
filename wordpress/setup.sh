#!/bin/bash
#
# Chronos Local Development Setup
# Run this after `docker-compose up -d` to configure WordPress automatically.
#
# Usage: bash setup.sh
#

set -e

CONTAINER="wordpress-wordpress-1"
SITE_URL="http://localhost:8888"
ADMIN_USER="admin"
ADMIN_PASS="admin"
ADMIN_EMAIL="admin@chronos.local"

echo "⏳ Waiting for WordPress container..."
until docker exec "$CONTAINER" wp core is-installed --allow-root 2>/dev/null; do
  sleep 2
done
echo "✅ WordPress is running."

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
