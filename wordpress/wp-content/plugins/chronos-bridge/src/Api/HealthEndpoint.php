<?php
/**
 * Public liveness and readiness report with non-sensitive facts only.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Api;

/** `GET /chronos/v1/health`. */
final class HealthEndpoint {

	/** Register the route. */
	public function register_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/health',
			array(
				'methods'             => 'GET',
				'callback'            => array( self::class, 'report' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Check the database, commerce and GraphQL dependencies.
	 *
	 * @return array{status: string, checks: array{database: bool, commerce: bool, graphql: bool}}
	 */
	public static function checks(): array {
		global $wpdb;
		$database = false;
		if ( is_object( $wpdb ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- A cached answer would defeat the readiness check.
			$database = '1' === (string) $wpdb->get_var( 'SELECT 1' );
		}
		$checks = array(
			'database' => $database,
			'commerce' => class_exists( 'WooCommerce' ),
			'graphql'  => function_exists( 'graphql' ),
		);
		return array(
			'status' => in_array( false, $checks, true ) ? 'degraded' : 'ok',
			'checks' => $checks,
		);
	}

	/** REST callback. */
	public static function report(): \WP_REST_Response {
		$body     = self::checks();
		$response = new \WP_REST_Response( $body, 'ok' === $body['status'] ? 200 : 503 );
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
