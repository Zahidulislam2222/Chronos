#!/bin/bash
# Chronos GCP Deploy Script
# Called by GitHub Actions to sync plugins to GCP server
set -e

WP_DIR="/var/www/chronos/wp-content/plugins"

echo "=== Chronos GCP Deploy ==="
echo "Syncing custom plugins..."

# chronos-bridge
rsync -az --delete \
  ./wordpress/wp-content/plugins/chronos-bridge/ \
  ${WP_DIR}/chronos-bridge/

# chronos-blocks
rsync -az --delete \
  ./wordpress/wp-content/plugins/chronos-blocks/ \
  ${WP_DIR}/chronos-blocks/

# wp-graphql-cors
rsync -az --delete \
  ./wordpress/wp-content/plugins/wp-graphql-cors-master/ \
  ${WP_DIR}/wp-graphql-cors-master/

# Fix permissions
sudo chown -R www-data:www-data ${WP_DIR}

echo "Plugins synced successfully."

# Flush caches
cd /var/www/chronos
wp cache flush --allow-root 2>/dev/null || true
wp rewrite flush --allow-root 2>/dev/null || true

echo "Deploy complete."
