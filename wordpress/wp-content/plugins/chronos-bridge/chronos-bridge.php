<?php
/**
 * Plugin Name: Chronos Bridge
 * Plugin URI:  https://github.com/Zahidulislam2222/Chronos
 * Description: Custom bridge plugin for Chronos luxury watch e-commerce — REST API, CPT, GraphQL mutations, admin settings, caching, and cron.
 * Version:     2.0.0
 * Author:      Zahidul Islam
 * Author URI:  https://github.com/Zahidulislam2222
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: chronos-bridge
 * Domain Path: /languages
 * Requires PHP: 8.1
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Check PHP version before loading anything.
if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
	add_action( 'admin_notices', static function (): void {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html__( 'Chronos Bridge requires PHP 8.1 or higher. Please upgrade your PHP version.', 'chronos-bridge' )
		);
	} );
	return;
}

// Plugin constants.
define( 'CHRONOS_BRIDGE_VERSION', '2.0.0' );
define( 'CHRONOS_BRIDGE_FILE', __FILE__ );
define( 'CHRONOS_BRIDGE_DIR', plugin_dir_path( __FILE__ ) );
define( 'CHRONOS_BRIDGE_URL', plugin_dir_url( __FILE__ ) );
define( 'CHRONOS_BRIDGE_BASENAME', plugin_basename( __FILE__ ) );

// Composer autoloader.
$autoloader = CHRONOS_BRIDGE_DIR . 'vendor/autoload.php';

if ( ! file_exists( $autoloader ) ) {
	add_action( 'admin_notices', static function (): void {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html__( 'Chronos Bridge: Composer dependencies not installed. Run "composer install" in the plugin directory.', 'chronos-bridge' )
		);
	} );
	return;
}

require_once $autoloader;

// Boot the plugin.
ChronosBridge\Plugin::init();

// Activation / deactivation hooks (must be in main file).
register_activation_hook( __FILE__, [ ChronosBridge\Plugin::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ ChronosBridge\Plugin::class, 'deactivate' ] );
