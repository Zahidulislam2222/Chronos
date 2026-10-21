<?php
/**
 * Validated Composer runtime selection for immutable dependency releases.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Configuration;

/** Keep old dependency directories available to already admitted requests. */
final class Runtime {

	/** Bounded configuration-file format, independent of request content. */
	private const MAX_CONFIG_BYTES = 4096;

	/**
	 * Resolve the selected Composer autoloader beneath this plugin.
	 *
	 * @param string $plugin_directory Absolute owning plugin directory.
	 * @return string
	 * @throws \UnexpectedValueException If configuration is absent or invalid.
	 */
	public static function autoloader( string $plugin_directory ): string {
		$root = rtrim( $plugin_directory, '/\\' ) . DIRECTORY_SEPARATOR;
		$file = $root . 'content/runtime.php';
		if ( ! is_file( $file ) || ! is_readable( $file ) || filesize( $file ) > self::MAX_CONFIG_BYTES ) {
			throw new \UnexpectedValueException( 'Invalid Chronos runtime configuration.' );
		}
		try {
			// This is trusted application configuration, never uploaded or request data.
			$data = require $file;
		} catch ( \Throwable ) {
			$data = null;
		}
		if ( ! is_array( $data ) || array_keys( $data ) !== array( 'vendorDirectory' )
			|| ! is_string( $data['vendorDirectory'] ) ) {
			throw new \UnexpectedValueException( 'Invalid Chronos runtime configuration.' );
		}
		$directory = $data['vendorDirectory'];
		$relative  = preg_match( '/^vendor(?:-[a-z0-9.-]+)?$/D', $directory ) === 1;
		$absolute  = preg_match( '#^/(?:[a-z0-9._-]+/)*vendor$#iD', $directory ) === 1
			&& ! in_array( '..', explode( '/', $directory ), true )
			&& ! in_array( '.', explode( '/', $directory ), true );
		if ( ! $relative && ! $absolute ) {
			throw new \UnexpectedValueException( 'Invalid Chronos runtime configuration.' );
		}
		$vendor = $relative ? $root . $directory : $directory;
		if ( is_link( $vendor ) ) {
			throw new \UnexpectedValueException( 'Invalid Chronos runtime configuration.' );
		}
		return $vendor . DIRECTORY_SEPARATOR . 'autoload.php';
	}
}
