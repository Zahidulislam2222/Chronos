<?php
/**
 * Unit tests for the Plugin class.
 *
 * @package ChronosBridge\Tests\Unit
 */

declare(strict_types=1);

namespace ChronosBridge\Tests\Unit;

use ChronosBridge\Plugin;
use PHPUnit\Framework\TestCase;

class PluginTest extends TestCase {

	public function test_plugin_class_exists(): void {
		$this->assertTrue( class_exists( Plugin::class ) );
	}

	public function test_plugin_class_is_final(): void {
		$reflection = new \ReflectionClass( Plugin::class );
		$this->assertTrue( $reflection->isFinal() );
	}

	public function test_plugin_constructor_is_private(): void {
		$reflection  = new \ReflectionClass( Plugin::class );
		$constructor = $reflection->getConstructor();

		$this->assertNotNull( $constructor );
		$this->assertTrue( $constructor->isPrivate() );
	}

	public function test_plugin_has_init_method(): void {
		$this->assertTrue( method_exists( Plugin::class, 'init' ) );
	}

	public function test_plugin_has_activate_method(): void {
		$this->assertTrue( method_exists( Plugin::class, 'activate' ) );
	}

	public function test_plugin_has_deactivate_method(): void {
		$this->assertTrue( method_exists( Plugin::class, 'deactivate' ) );
	}

	public function test_plugin_version_constant(): void {
		$this->assertSame( '2.0.0', CHRONOS_BRIDGE_VERSION );
	}
}
