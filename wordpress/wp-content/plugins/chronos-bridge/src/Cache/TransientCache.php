<?php
/**
 * Transients API wrapper for caching expensive queries.
 *
 * @package ChronosBridge\Cache
 */

declare(strict_types=1);

namespace ChronosBridge\Cache;

/**
 * Provides transient-based caching with automatic key prefixing.
 */
final class TransientCache {

	private const PREFIX = 'chronos_';

	/**
	 * Get a cached value.
	 *
	 * @param string $key Cache key.
	 * @return mixed Cached value or null if not found.
	 */
	public static function get( string $key ): mixed {
		$value = get_transient( self::PREFIX . $key );
		return false === $value ? null : $value;
	}

	/**
	 * Set a cached value.
	 *
	 * @param string $key   Cache key.
	 * @param mixed  $value Value to cache.
	 * @param int    $ttl   Time to live in seconds (default: 1 hour).
	 * @return bool
	 */
	public static function set( string $key, mixed $value, int $ttl = HOUR_IN_SECONDS ): bool {
		return set_transient( self::PREFIX . $key, $value, $ttl );
	}

	/**
	 * Delete a cached value.
	 *
	 * @param string $key Cache key.
	 * @return bool
	 */
	public static function delete( string $key ): bool {
		return delete_transient( self::PREFIX . $key );
	}

	/**
	 * Get or set a cached value using a callback.
	 *
	 * @param string   $key      Cache key.
	 * @param callable $callback Callback to generate the value if not cached.
	 * @param int      $ttl      Time to live in seconds.
	 * @return mixed
	 */
	public static function remember( string $key, callable $callback, int $ttl = HOUR_IN_SECONDS ): mixed {
		$value = self::get( $key );

		if ( null !== $value ) {
			return $value;
		}

		$value = $callback();
		self::set( $key, $value, $ttl );

		return $value;
	}

	/**
	 * Flush all chronos transients.
	 */
	public static function flush(): int {
		global $wpdb;

		$count = 0;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$transients = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
				$wpdb->esc_like( '_transient_' . self::PREFIX ) . '%'
			)
		);

		foreach ( $transients as $transient ) {
			$key = str_replace( '_transient_', '', $transient );
			if ( delete_transient( $key ) ) {
				++$count;
			}
		}

		return $count;
	}

	/**
	 * Invalidate cache on post save/update.
	 */
	public static function register_invalidation_hooks(): void {
		$invalidate = static function ( int $post_id ): void {
			$post_type = get_post_type( $post_id );
			if ( 'chronos_watch' === $post_type || 'product' === $post_type ) {
				self::delete( 'watches_list' );
				self::delete( 'watches_count' );
			}
		};

		add_action( 'save_post', $invalidate );
		add_action( 'delete_post', $invalidate );
	}
}
