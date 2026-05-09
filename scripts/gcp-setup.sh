#!/bin/bash
# Chronos GCP Server Setup Script
# Runs on the GCP e2-micro instance to configure WordPress backend
set -e

DOMAIN="chronosbackend.healthcodeanalysis.com"
DB_NAME="chronos_wp"
DB_USER="chronos_user"
DB_PASS="$(openssl rand -base64 24)"
WP_DIR="/var/www/chronos"
JWT_SECRET="$(openssl rand -base64 48)"

echo "============================================"
echo "  Chronos Backend Server Setup"
echo "============================================"

# ── 1. Configure MariaDB ─────────────────────────────────────────
echo "[1/8] Configuring MariaDB..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

# ── 2. Create web directory ──────────────────────────────────────
echo "[2/8] Creating web directory..."
mkdir -p ${WP_DIR}
chown -R www-data:www-data ${WP_DIR}

# ── 3. Install WordPress core ────────────────────────────────────
echo "[3/8] Installing WordPress..."
cd ${WP_DIR}
wp core download --allow-root
wp config create \
  --dbname=${DB_NAME} \
  --dbuser=${DB_USER} \
  --dbpass="${DB_PASS}" \
  --dbhost=localhost \
  --dbprefix=wphs_ \
  --allow-root

# Extra config for headless + JWT
wp config set WP_DEBUG false --raw --allow-root
wp config set WP_SITEURL "https://${DOMAIN}" --allow-root
wp config set WP_HOME "https://${DOMAIN}" --allow-root
wp config set GRAPHQL_JWT_AUTH_SECRET_KEY "${JWT_SECRET}" --allow-root
wp config set WP_MEMORY_LIMIT "256M" --allow-root
wp config set DISALLOW_FILE_EDIT true --raw --allow-root

echo "[DB_PASS] ${DB_PASS}" >> /root/chronos-credentials.txt
echo "[JWT_SECRET] ${JWT_SECRET}" >> /root/chronos-credentials.txt

# ── 4. Configure Nginx ───────────────────────────────────────────
echo "[4/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/chronos <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};
    root ${WP_DIR};
    index index.php;

    # WordPress GraphQL endpoint
    location /graphql {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\.ht {
        deny all;
    }

    client_max_body_size 64M;
}
NGINX

ln -sf /etc/nginx/sites-available/chronos /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 5. PHP-FPM tuning for e2-micro (1GB RAM) ────────────────────
echo "[5/8] Tuning PHP-FPM..."
cat > /etc/php/8.1/fpm/pool.d/chronos.conf <<PHPFPM
[chronos]
user = www-data
group = www-data
listen = /var/run/php/php8.1-fpm.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 64M
php_admin_value[post_max_size] = 64M
php_admin_value[max_execution_time] = 300
PHPFPM
systemctl restart php8.1-fpm

# ── 6. Set up swap (safety net for 1GB RAM) ──────────────────────
echo "[6/8] Setting up 2GB swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── 7. Set permissions ───────────────────────────────────────────
echo "[7/8] Setting permissions..."
chown -R www-data:www-data ${WP_DIR}
find ${WP_DIR} -type d -exec chmod 755 {} \;
find ${WP_DIR} -type f -exec chmod 644 {} \;

# Add ubuntu user to www-data for deploy access
usermod -aG www-data ubuntu

echo "[8/8] Base setup complete."
echo "Credentials saved to: /root/chronos-credentials.txt"
echo "Next: import database, copy plugins, run certbot"
