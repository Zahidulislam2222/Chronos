<?php
/**
 * PHPUnit bootstrap file.
 *
 * Loads Composer autoloader and any test dependencies.
 *
 * @package ChronosBridge\Tests
 */

declare(strict_types=1);

// Composer autoloader.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Define constants that WordPress normally provides.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '/tmp/wordpress/' );
}

if ( ! defined( 'CHRONOS_BRIDGE_VERSION' ) ) {
	define( 'CHRONOS_BRIDGE_VERSION', '2.0.0' );
}

if ( ! defined( 'CHRONOS_BRIDGE_FILE' ) ) {
	define( 'CHRONOS_BRIDGE_FILE', dirname( __DIR__ ) . '/chronos-bridge.php' );
}

if ( ! defined( 'CHRONOS_BRIDGE_DIR' ) ) {
	define( 'CHRONOS_BRIDGE_DIR', dirname( __DIR__ ) . '/' );
}

if ( ! defined( 'CHRONOS_BRIDGE_URL' ) ) {
	define( 'CHRONOS_BRIDGE_URL', 'https://example.com/wp-content/plugins/chronos-bridge/' );
}

if ( ! defined( 'CHRONOS_BRIDGE_BASENAME' ) ) {
	define( 'CHRONOS_BRIDGE_BASENAME', 'chronos-bridge/chronos-bridge.php' );
}

if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	define( 'HOUR_IN_SECONDS', 3600 );
}

if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
	define( 'MINUTE_IN_SECONDS', 60 );
}
