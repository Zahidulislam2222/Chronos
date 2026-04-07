<?php
/**
 * AI-powered contact form auto-responder using WP 7.0 AI Client.
 *
 * Analyzes incoming contact messages and suggests admin replies.
 * Requires WordPress 7.0+ with an AI provider plugin configured.
 *
 * @package ChronosBridge\AI
 */

declare(strict_types=1);

namespace ChronosBridge\AI;

use ChronosBridge\Database\ContactTable;

/**
 * Generates suggested replies for contact form submissions.
 */
final class ContactResponder {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		// REST API endpoint.
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );

		// Register as a WordPress Ability (WP 6.9+).
		add_action( 'wp_abilities_api_categories_init', array( self::class, 'register_ability_category' ) );
		add_action( 'wp_abilities_api_init', array( self::class, 'register_ability' ) );

		// Add AJAX action for admin contacts page.
		add_action( 'wp_ajax_chronos_ai_suggest_reply', array( self::class, 'ajax_suggest_reply' ) );
	}

	/**
	 * Check if AI features are available.
	 */
	public static function is_available(): bool {
		return DescriptionGenerator::is_available();
	}

	/**
	 * Analyze a contact submission and suggest a reply.
	 *
	 * @param int $submission_id The contact submission ID.
	 * @return array{reply: string, sentiment: string, intent: string, priority: string}|\WP_Error
	 */
	public static function suggest_reply( int $submission_id ): array|\WP_Error {
		if ( ! self::is_available() ) {
			return new \WP_Error(
				'ai_not_available',
				__( 'AI features are not available.', 'chronos-bridge' ),
				array( 'status' => 503 )
			);
		}

		$submission = ContactTable::find( $submission_id );

		if ( ! $submission ) {
			return new \WP_Error( 'not_found', __( 'Submission not found.', 'chronos-bridge' ), array( 'status' => 404 ) );
		}

		$message_context = sprintf(
			"From: %s (%s)\nSubject: %s\nMessage:\n%s",
			$submission->name,
			$submission->email,
			$submission->subject,
			$submission->message
		);

		$schema = array(
			'type'       => 'object',
			'properties' => array(
				'reply'     => array(
					'type'        => 'string',
					'description' => 'A professional reply email to send to the customer.',
				),
				'sentiment' => array(
					'type'        => 'string',
					'enum'        => array( 'positive', 'neutral', 'negative', 'urgent' ),
					'description' => 'The overall sentiment of the message.',
				),
				'intent'    => array(
					'type'        => 'string',
					'description' => 'The primary intent (e.g., product inquiry, support request, complaint, general question).',
				),
				'priority'  => array(
					'type'        => 'string',
					'enum'        => array( 'low', 'medium', 'high' ),
					'description' => 'Suggested priority level for this inquiry.',
				),
			),
			'required'   => array( 'reply', 'sentiment', 'intent', 'priority' ),
		);

		$result = wp_ai_client_prompt(
			"Analyze this customer contact form submission and draft a professional reply:\n\n{$message_context}"
		)
			->using_system_instruction(
				'You are a customer service representative for Chronos, a luxury watch retailer. '
				. 'Analyze the customer message for sentiment and intent, then draft a helpful, '
				. 'professional reply. Be warm but formal. If they ask about a specific watch, '
				. 'acknowledge their interest. If it is a complaint, empathize and offer to help. '
				. 'Sign the reply as "The Chronos Team".'
			)
			->using_temperature( 0.5 )
			->as_json_response( $schema )
			->generate_text();

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$parsed = json_decode( $result, true );

		if ( ! is_array( $parsed ) || empty( $parsed['reply'] ) ) {
			return new \WP_Error( 'parse_error', __( 'Failed to parse AI response.', 'chronos-bridge' ), array( 'status' => 500 ) );
		}

		return array(
			'reply'     => wp_kses_post( $parsed['reply'] ),
			'sentiment' => sanitize_text_field( $parsed['sentiment'] ?? 'neutral' ),
			'intent'    => sanitize_text_field( $parsed['intent'] ?? 'general' ),
			'priority'  => sanitize_text_field( $parsed['priority'] ?? 'medium' ),
		);
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/ai/suggest-reply',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( self::class, 'rest_suggest_reply' ),
					'permission_callback' => static function (): bool {
						return current_user_can( 'manage_options' );
					},
					'args'                => array(
						'submissionId' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);

		register_rest_route(
			'chronos/v1',
			'/ai/status',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( self::class, 'rest_ai_status' ),
					'permission_callback' => static function (): bool {
						return current_user_can( 'manage_options' );
					},
				),
			)
		);
	}

	/**
	 * REST callback: Suggest reply.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_suggest_reply( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$submission_id = (int) $request->get_param( 'submissionId' );
		$result        = self::suggest_reply( $submission_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => $result,
			),
			200
		);
	}

	/**
	 * REST callback: AI feature status.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response
	 */
	public static function rest_ai_status( \WP_REST_Request $request ): \WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by REST API.
		return new \WP_REST_Response(
			array(
				'available'            => self::is_available(),
				'wp7'                  => function_exists( 'wp_ai_client_prompt' ),
				'ai_enabled'           => function_exists( 'wp_supports_ai' ) && wp_supports_ai(),
				'text_generation'      => self::is_available(),
				'abilities_registered' => function_exists( 'wp_has_ability' ) && wp_has_ability( 'chronos/generate-watch-description' ),
			),
			200
		);
	}

	/**
	 * AJAX handler for suggesting reply from admin contacts page.
	 */
	public static function ajax_suggest_reply(): void {
		check_ajax_referer( 'chronos_ai_suggest', 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( __( 'Permission denied.', 'chronos-bridge' ), 403 );
		}

		$submission_id = absint( $_POST['submission_id'] ?? 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above via check_ajax_referer.

		if ( 0 === $submission_id ) {
			wp_send_json_error( __( 'Invalid submission ID.', 'chronos-bridge' ), 400 );
		}

		$result = self::suggest_reply( $submission_id );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error( $result->get_error_message(), 500 );
		}

		wp_send_json_success( $result );
	}

	/**
	 * Register as a WordPress Ability.
	 */
	/**
	 * Register the "communication" ability category.
	 */
	public static function register_ability_category(): void {
		if ( ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}
		if ( ! wp_has_ability_category( 'communication' ) ) {
			wp_register_ability_category(
				'communication',
				array(
					'label'       => __( 'Communication', 'chronos-bridge' ),
					'description' => __( 'Customer communication and response abilities.', 'chronos-bridge' ),
				)
			);
		}
	}

	/**
	 * Register as a WordPress Ability.
	 */
	public static function register_ability(): void {
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		wp_register_ability(
			'chronos/suggest-contact-reply',
			array(
				'label'               => __( 'Suggest Contact Reply', 'chronos-bridge' ),
				'description'         => __( 'Analyze a contact form submission and suggest a professional reply.', 'chronos-bridge' ),
				'category'            => 'communication',
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'submissionId' => array(
							'type'        => 'integer',
							'description' => __( 'The contact submission ID.', 'chronos-bridge' ),
						),
					),
					'required'   => array( 'submissionId' ),
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'reply'     => array( 'type' => 'string' ),
						'sentiment' => array( 'type' => 'string' ),
						'intent'    => array( 'type' => 'string' ),
						'priority'  => array( 'type' => 'string' ),
					),
				),
				'execute_callback'    => array( self::class, 'suggest_reply' ),
				'permission_callback' => static function (): bool {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}
}
