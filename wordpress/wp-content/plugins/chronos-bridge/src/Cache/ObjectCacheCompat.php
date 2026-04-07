<?php
/**
 * Object cache compatibility layer — uses wp_cache when available (Redis/Memcached),
 * falls back to transients.
 *
 * @package ChronosBridge\Cache
 */

declare(strict_types=1);

namespace ChronosBridge\Cache;

/**
 * Redis-ready caching wrapper.
 *
 * When a persistent object cache (Redis, Memcached) is active, uses wp_cache_*
 * functions for in-memory speed. Otherwise falls back to the Transients API.
 */
final class ObjectCacheCompat {

	private const GROUP = 'chronos';

	/**
	 * Whether a persistent object cache is available.
	 */
	public static function has_persistent_cache(): bool {
		return (bool) wp_using_ext_object_cache();
	}

	/**
	 * Get a cached value.
	 *
	 * @param string $key Cache key.
	 * @return mixed Cached value or null.
	 */
	public static function get( string $key ): mixed {
		if ( self::has_persistent_cache() ) {
			$found = false;
			$value = wp_cache_get( $key, self::GROUP, false, $found );
			return $found ? $value : null;
		}

		return TransientCache::get( $key );
	}

	/**
	 * Set a cached value.
	 *
	 * @param string $key   Cache key.
	 * @param mixed  $value Value to cache.
	 * @param int    $ttl   Time to live in seconds.
	 * @return bool
	 */
	public static function set( string $key, mixed $value, int $ttl = HOUR_IN_SECONDS ): bool {
		if ( self::has_persistent_cache() ) {
			return wp_cache_set( $key, $value, self::GROUP, $ttl );
		}

		return TransientCache::set( $key, $value, $ttl );
	}

	/**
	 * Delete a cached value.
	 *
	 * @param string $key Cache key.
	 * @return bool
	 */
	public static function delete( string $key ): bool {
		if ( self::has_persistent_cache() ) {
			return wp_cache_delete( $key, self::GROUP );
		}

		return TransientCache::delete( $key );
	}

	/**
	 * Get or set using a callback.
	 *
	 * @param string   $key      Cache key.
	 * @param callable $callback Callback to generate value.
	 * @param int      $ttl      TTL in seconds.
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
}
