<?php
/**
 * Unit tests for the TransientCache class.
 *
 * @package ChronosBridge\Tests\Unit
 */

declare(strict_types=1);

namespace ChronosBridge\Tests\Unit;

use ChronosBridge\Cache\TransientCache;
use PHPUnit\Framework\TestCase;

class TransientCacheTest extends TestCase {

	/** @var array<string, mixed> In-memory transient store for testing. */
	public static array $transients = [];

	/**
	 * Stub WordPress transient functions.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		if ( ! function_exists( 'get_transient' ) ) {
			eval( 'function get_transient( string $key ) {
				return \ChronosBridge\Tests\Unit\TransientCacheTest::$transients[$key] ?? false;
			}' );
		}
		if ( ! function_exists( 'set_transient' ) ) {
			eval( 'function set_transient( string $key, $value, int $ttl = 0 ): bool {
				\ChronosBridge\Tests\Unit\TransientCacheTest::$transients[$key] = $value;
				return true;
			}' );
		}
		if ( ! function_exists( 'delete_transient' ) ) {
			eval( 'function delete_transient( string $key ): bool {
				unset( \ChronosBridge\Tests\Unit\TransientCacheTest::$transients[$key] );
				return true;
			}' );
		}
	}

	protected function setUp(): void {
		parent::setUp();
		self::$transients = [];
	}

	public function test_get_returns_null_when_empty(): void {
		$this->assertNull( TransientCache::get( 'nonexistent' ) );
	}

	public function test_set_and_get(): void {
		TransientCache::set( 'test_key', 'test_value' );
		$this->assertSame( 'test_value', TransientCache::get( 'test_key' ) );
	}

	public function test_delete_removes_value(): void {
		TransientCache::set( 'del_key', 'value' );
		TransientCache::delete( 'del_key' );
		$this->assertNull( TransientCache::get( 'del_key' ) );
	}

	public function test_remember_caches_callback_result(): void {
		$called = 0;
		$callback = function () use ( &$called ): string {
			++$called;
			return 'computed_value';
		};

		$result1 = TransientCache::remember( 'remember_key', $callback );
		$result2 = TransientCache::remember( 'remember_key', $callback );

		$this->assertSame( 'computed_value', $result1 );
		$this->assertSame( 'computed_value', $result2 );
		$this->assertSame( 1, $called, 'Callback should only be called once' );
	}

	public function test_set_overwrites_existing(): void {
		TransientCache::set( 'overwrite', 'first' );
		TransientCache::set( 'overwrite', 'second' );
		$this->assertSame( 'second', TransientCache::get( 'overwrite' ) );
	}
}
