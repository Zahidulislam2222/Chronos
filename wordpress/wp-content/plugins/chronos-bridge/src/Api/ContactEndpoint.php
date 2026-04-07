<?php
/**
 * REST endpoint: POST /wp-json/chronos/v1/contact
 *
 * @package ChronosBridge\Api
 */

declare(strict_types=1);

namespace ChronosBridge\Api;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use ChronosBridge\Database\ContactTable;
use ChronosBridge\Database\ContactStatus;
use ChronosBridge\Security\Sanitizer;

/**
 * REST endpoint for contact form submissions.
 */
final class ContactEndpoint extends RestController {

	/**
	 * Register routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/contact',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'create_submission' ),
					'permission_callback' => array( $this, 'permission_public' ),
					'args'                => $this->get_create_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/contact',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'list_submissions' ),
					'permission_callback' => array( $this, 'permission_admin' ),
					'args'                => array(
						'page'     => array(
							'type'              => 'integer',
							'default'           => 1,
							'minimum'           => 1,
							'sanitize_callback' => 'absint',
						),
						'per_page' => array(
							'type'              => 'integer',
							'default'           => 20,
							'minimum'           => 1,
							'maximum'           => 100,
							'sanitize_callback' => 'absint',
						),
						'status'   => array(
							'type' => 'string',
							'enum' => array( 'new', 'read', 'replied' ),
						),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/contact/(?P<id>\d+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_submission' ),
					'permission_callback' => array( $this, 'permission_admin' ),
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
				array(
					'methods'             => 'PATCH',
					'callback'            => array( $this, 'update_submission' ),
					'permission_callback' => array( $this, 'permission_admin' ),
					'args'                => array(
						'id'     => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
						'status' => array(
							'type'     => 'string',
							'required' => true,
							'enum'     => array( 'new', 'read', 'replied' ),
						),
					),
				),
				array(
					'methods'             => 'DELETE',
					'callback'            => array( $this, 'delete_submission' ),
					'permission_callback' => array( $this, 'permission_admin' ),
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * POST /contact — create a new submission.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_submission( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$name    = Sanitizer::text( $request->get_param( 'name' ) ?? '' );
		$email   = Sanitizer::email( $request->get_param( 'email' ) ?? '' );
		$subject = Sanitizer::text( $request->get_param( 'subject' ) ?? '' );
		$message = Sanitizer::textarea( $request->get_param( 'message' ) ?? '' );

		if ( empty( $name ) || empty( $email ) || empty( $message ) ) {
			return $this->error(
				__( 'Name, email, and message are required.', 'chronos-bridge' ),
				'missing_fields',
				422
			);
		}

		if ( ! Sanitizer::is_valid_email( $email ) ) {
			return $this->error(
				__( 'Please provide a valid email address.', 'chronos-bridge' ),
				'invalid_email',
				422
			);
		}

		// Rate limiting.
		$rate_limit_enabled = get_option( 'chronos_enable_rate_limiting', '1' );
		if ( '1' === $rate_limit_enabled && ContactTable::is_rate_limited() ) {
			return $this->error(
				__( 'Too many submissions. Please try again later.', 'chronos-bridge' ),
				'rate_limited',
				429
			);
		}

		$id = ContactTable::insert( compact( 'name', 'email', 'subject', 'message' ) );

		if ( false === $id ) {
			return $this->error(
				__( 'Failed to save submission.', 'chronos-bridge' ),
				'db_error',
				500
			);
		}

		ContactTable::increment_rate_limit();

		return $this->success(
			array(
				'id'      => $id,
				'message' => __( 'Thank you for your message.', 'chronos-bridge' ),
			),
			201
		);
	}

	/**
	 * GET /contact — list submissions (admin only).
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response
	 */
	public function list_submissions( WP_REST_Request $request ): WP_REST_Response {
		$status_value = $request->get_param( 'status' );
		$status       = $status_value ? ContactStatus::from( $status_value ) : null;

		$result = ContactTable::paginate(
			page: (int) $request->get_param( 'page' ),
			per_page: (int) $request->get_param( 'per_page' ),
			status: $status,
		);

		return $this->success( $result );
	}

	/**
	 * GET /contact/{id} — get a single submission (admin only).
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_submission( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$submission = ContactTable::find( (int) $request->get_param( 'id' ) );

		if ( null === $submission ) {
			return $this->error(
				__( 'Submission not found.', 'chronos-bridge' ),
				'not_found',
				404
			);
		}

		return $this->success( (array) $submission );
	}

	/**
	 * PATCH /contact/{id} — update submission status (admin only).
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_submission( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$id     = (int) $request->get_param( 'id' );
		$status = ContactStatus::from( $request->get_param( 'status' ) );

		$updated = ContactTable::update_status( $id, $status );

		if ( ! $updated ) {
			return $this->error(
				__( 'Failed to update submission.', 'chronos-bridge' ),
				'update_failed',
				500
			);
		}

		return $this->success(
			array(
				'id'     => $id,
				'status' => $status->value,
			)
		);
	}

	/**
	 * DELETE /contact/{id} — delete a submission (admin only).
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_submission( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$id      = (int) $request->get_param( 'id' );
		$deleted = ContactTable::delete( $id );

		if ( ! $deleted ) {
			return $this->error(
				__( 'Failed to delete submission.', 'chronos-bridge' ),
				'delete_failed',
				500
			);
		}

		return $this->success( array( 'deleted' => true ) );
	}

	/**
	 * Argument schema for the create endpoint.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_create_args(): array {
		return array(
			'name'    => array(
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
			),
			'email'   => array(
				'type'              => 'string',
				'required'          => true,
				'format'            => 'email',
				'sanitize_callback' => 'sanitize_email',
			),
			'subject' => array(
				'type'              => 'string',
				'required'          => false,
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'message' => array(
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_textarea_field',
			),
		);
	}
}
