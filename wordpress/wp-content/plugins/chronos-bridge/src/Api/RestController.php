<?php
/**
 * Base REST API controller for the chronos/v1 namespace.
 *
 * @package ChronosBridge\Api
 */

declare(strict_types=1);

namespace ChronosBridge\Api;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Base REST API controller providing shared helpers.
 */
abstract class RestController {

	protected const NAMESPACE = 'chronos/v1';

	/**
	 * Register routes — implemented by subclasses.
	 */
	abstract public function register_routes(): void;

	/**
	 * Permission check: public (anyone can access).
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return bool
	 */
	public function permission_public( WP_REST_Request $request ): bool { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by WordPress REST API.
		return true;
	}

	/**
	 * Permission check: admin only.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return bool
	 */
	public function permission_admin( WP_REST_Request $request ): bool { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by WordPress REST API.
		return current_user_can( 'manage_options' );
	}

	/**
	 * Build a success response.
	 *
	 * @param array<string, mixed> $data   Response data.
	 * @param int                  $status HTTP status code.
	 * @return WP_REST_Response
	 */
	protected function success( array $data, int $status = 200 ): WP_REST_Response {
		return new WP_REST_Response(
			array(
				'success' => true,
				'data'    => $data,
			),
			$status
		);
	}

	/**
	 * Build an error response.
	 *
	 * @param string $message Error message.
	 * @param string $code    Error code.
	 * @param int    $status  HTTP status code.
	 * @return WP_Error
	 */
	protected function error( string $message, string $code = 'error', int $status = 400 ): WP_Error {
		return new WP_Error( $code, $message, array( 'status' => $status ) );
	}
}
