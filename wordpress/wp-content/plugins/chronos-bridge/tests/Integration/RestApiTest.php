<?php
/**
 * Integration-level tests for REST API endpoint logic.
 *
 * These test the endpoint classes' validation logic without a full WP bootstrap.
 *
 * @package ChronosBridge\Tests\Integration
 */

declare(strict_types=1);

namespace ChronosBridge\Tests\Integration;

use ChronosBridge\Api\ContactEndpoint;
use ChronosBridge\Api\WatchEndpoint;
use PHPUnit\Framework\TestCase;

class RestApiTest extends TestCase {

	public function test_contact_endpoint_is_instantiable(): void {
		$endpoint = new ContactEndpoint();
		$this->assertInstanceOf( ContactEndpoint::class, $endpoint );
	}

	public function test_watch_endpoint_is_instantiable(): void {
		$endpoint = new WatchEndpoint();
		$this->assertInstanceOf( WatchEndpoint::class, $endpoint );
	}

	public function test_contact_endpoint_extends_base_controller(): void {
		$endpoint = new ContactEndpoint();
		$this->assertInstanceOf( \ChronosBridge\Api\RestController::class, $endpoint );
	}

	public function test_watch_endpoint_extends_base_controller(): void {
		$endpoint = new WatchEndpoint();
		$this->assertInstanceOf( \ChronosBridge\Api\RestController::class, $endpoint );
	}
}
