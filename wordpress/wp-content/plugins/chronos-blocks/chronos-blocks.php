<?php
/**
 * Plugin Name: Chronos Blocks
 * Plugin URI:  https://github.com/Zahidulislam2222/Chronos
 * Description: Custom Gutenberg blocks for Chronos luxury watch e-commerce — Watch Showcase, Collection Grid, and Contact Form.
 * Version:     1.0.0
 * Author:      Zahidul Islam
 * Author URI:  https://github.com/Zahidulislam2222
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: chronos-blocks
 * Domain Path: /languages
 * Requires PHP: 8.1
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CHRONOS_BLOCKS_VERSION', '1.0.0' );
define( 'CHRONOS_BLOCKS_DIR', plugin_dir_path( __FILE__ ) );
define( 'CHRONOS_BLOCKS_URL', plugin_dir_url( __FILE__ ) );

/**
 * Register all custom blocks.
 */
function chronos_blocks_init(): void {
	$blocks = array(
		'watch-showcase',
		'watch-collection-grid',
		'contact-form',
	);

	foreach ( $blocks as $block ) {
		$block_dir = CHRONOS_BLOCKS_DIR . "build/{$block}";
		if ( file_exists( $block_dir ) ) {
			register_block_type( $block_dir );
		}
	}
}
add_action( 'init', 'chronos_blocks_init' );

/**
 * Enqueue frontend script for the contact form block.
 */
function chronos_blocks_enqueue_frontend(): void {
	if ( has_block( 'chronos/contact-form' ) ) {
		$asset_file = CHRONOS_BLOCKS_DIR . 'build/contact-form/frontend.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array(
			'dependencies' => array(),
			'version'      => CHRONOS_BLOCKS_VERSION,
		);

		wp_enqueue_script(
			'chronos-contact-form-frontend',
			CHRONOS_BLOCKS_URL . 'build/contact-form/frontend.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_localize_script(
			'chronos-contact-form-frontend',
			'chronosContactForm',
			array(
				'apiUrl' => esc_url_raw( rest_url( 'chronos/v1/contact' ) ),
				'nonce'  => wp_create_nonce( 'wp_rest' ),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'chronos_blocks_enqueue_frontend' );

/**
 * Add a custom block category for Chronos.
 *
 * @param array<array<string,string>> $categories Existing block categories.
 * @return array<array<string,string>>
 */
function chronos_blocks_category( array $categories ): array {
	array_unshift(
		$categories,
		array(
			'slug'  => 'chronos',
			'title' => __( 'Chronos', 'chronos-blocks' ),
			'icon'  => 'clock',
		)
	);
	return $categories;
}
add_filter( 'block_categories_all', 'chronos_blocks_category' );
