#!/bin/bash
#
# Import sample watch data for local development.
#
# Usage: bash sample-data.sh
#

set -e

CONTAINER="wordpress-wordpress-1"

echo "🕐 Creating sample watch data..."

# Create brands taxonomy terms.
for brand in "Rolex" "Omega" "Patek Philippe" "Audemars Piguet" "Cartier"; do
  docker exec "$CONTAINER" wp term create chronos_brand "$brand" --allow-root 2>/dev/null || true
done

# Create movement taxonomy terms.
for movement in "Automatic" "Manual" "Quartz"; do
  docker exec "$CONTAINER" wp term create chronos_movement "$movement" --allow-root 2>/dev/null || true
done

# Create sample watches.
create_watch() {
  local title="$1"
  local brand="$2"
  local movement="$3"
  local price="$4"
  local ref="$5"
  local diameter="$6"
  local material="$7"
  local resistance="$8"

  local post_id
  post_id=$(docker exec "$CONTAINER" wp post create \
    --post_type=chronos_watch \
    --post_title="$title" \
    --post_status=publish \
    --post_content="A stunning $title featuring exceptional craftsmanship and precision engineering." \
    --post_excerpt="$brand $title — $material case, $movement movement." \
    --porcelain \
    --allow-root 2>/dev/null)

  if [ -n "$post_id" ]; then
    docker exec "$CONTAINER" wp post term set "$post_id" chronos_brand "$brand" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post term set "$post_id" chronos_movement "$movement" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_price "$price" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_reference "$ref" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_case_diameter "$diameter" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_case_material "$material" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_water_resistance "$resistance" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_stock_status "in_stock" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_condition "New" --allow-root 2>/dev/null
    docker exec "$CONTAINER" wp post meta update "$post_id" _chronos_year "2026" --allow-root 2>/dev/null
    echo "  ✅ $title (ID: $post_id)"
  fi
}

create_watch "Submariner Date" "Rolex" "Automatic" "14500" "126610LN" "41" "Oystersteel" "300"
create_watch "Speedmaster Moonwatch" "Omega" "Manual" "7100" "310.30.42.50.01.002" "42" "Stainless Steel" "50"
create_watch "Nautilus" "Patek Philippe" "Automatic" "35900" "5711/1A-010" "40" "Stainless Steel" "120"
create_watch "Royal Oak" "Audemars Piguet" "Automatic" "29500" "15500ST.OO.1220ST.01" "41" "Stainless Steel" "50"
create_watch "Santos de Cartier" "Cartier" "Automatic" "7650" "WSSA0018" "40" "Stainless Steel" "100"
create_watch "Daytona Cosmograph" "Rolex" "Automatic" "29900" "126500LN" "40" "Oystersteel" "100"
create_watch "Seamaster Aqua Terra" "Omega" "Automatic" "5800" "220.10.41.21.01.001" "41" "Stainless Steel" "150"
create_watch "Calatrava" "Patek Philippe" "Automatic" "28700" "5227G-010" "39" "White Gold" "30"

echo ""
echo "✅ Sample data imported! Check /wp-json/chronos/v1/watches"
echo ""
