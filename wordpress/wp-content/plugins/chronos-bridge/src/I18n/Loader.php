<?php
/**
 * Internationalization loader — loads plugin text domain.
 *
 * @package ChronosBridge\I18n
 */

declare(strict_types=1);

namespace ChronosBridge\I18n;

/**
 * Registers the plugin text domain for translations.
 */
final class Loader {

	/**
	 * Register the text domain loading hook.
	 */
	public static function register(): void {
		add_action( 'init', array( self::class, 'load_textdomain' ) );
	}

	/**
	 * Load the plugin text domain for translations.
	 */
	public static function load_textdomain(): void {
		load_plugin_textdomain(
			'chronos-bridge',
			false,
			dirname( CHRONOS_BRIDGE_BASENAME ) . '/languages'
		);
	}
}
