<?php
/**
 * Idempotent WP-CLI import of initial editorial pages and storefront navigation.
 * Existing content is never overwritten. Pass the maintained JSON file as argv.
 *
 * @package ChronosBridge
 */

$data = json_decode( file_get_contents( $args[0] ), true, 512, JSON_THROW_ON_ERROR );
$result = array( 'created_pages' => array(), 'existing_pages' => array() );
foreach ( $data['pages'] as $page ) {
	$existing = get_page_by_path( $page['slug'], OBJECT, 'page' );
	if ( $existing ) {
		$result['existing_pages'][] = $existing->ID;
		continue;
	}
	$html = implode( "\n", array_map( static fn( $text ) => '<!-- wp:paragraph --><p>' . esc_html( $text ) . '</p><!-- /wp:paragraph -->', $page['paragraphs'] ) );
	$id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_name' => sanitize_title( $page['slug'] ), 'post_title' => sanitize_text_field( $page['title'] ), 'post_content' => $html ), true );
	if ( is_wp_error( $id ) ) {
		throw new RuntimeException( 'Editorial page creation failed.' );
	}
	$result['created_pages'][] = $id;
}
$locations = get_nav_menu_locations();
if ( empty( $locations['chronos_primary'] ) ) {
	$menu = wp_get_nav_menu_object( 'Chronos storefront' );
	$id = $menu ? $menu->term_id : wp_create_nav_menu( 'Chronos storefront' );
	if ( is_wp_error( $id ) ) {
		throw new RuntimeException( 'Navigation creation failed.' );
	}
	if ( ! wp_get_nav_menu_items( $id ) ) {
		foreach ( $data['menu'] as $item ) {
			wp_update_nav_menu_item( $id, 0, array( 'menu-item-title' => $item['title'], 'menu-item-url' => untrailingslashit( get_option( 'chronos_frontend_url' ) ) . $item['path'], 'menu-item-status' => 'publish' ) );
		}
	}
	$locations['chronos_primary'] = $id;
	set_theme_mod( 'nav_menu_locations', $locations );
	$result['menu'] = $id;
}
echo wp_json_encode( $result );
