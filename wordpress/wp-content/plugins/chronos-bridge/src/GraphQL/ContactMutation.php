<?php
/**
 * GraphQL mutation for contact form submissions.
 *
 * Migrated from the original procedural plugin — now stores in DB + sends email.
 *
 * @package ChronosBridge\GraphQL
 */

declare(strict_types=1);

namespace ChronosBridge\GraphQL;

use ChronosBridge\Database\ContactTable;
use ChronosBridge\Security\Sanitizer;

/**
 * Registers and handles the GraphQL contact form mutation.
 */
final class ContactMutation {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'graphql_register_types', array( self::class, 'register_mutation' ) );
	}

	/**
	 * Register the submitChronosContact mutation.
	 */
	public static function register_mutation(): void {
		if ( ! function_exists( 'register_graphql_mutation' ) ) {
			return;
		}

		register_graphql_mutation(
			'submitChronosContact',
			array(
				'inputFields'         => array(
					'name'    => array(
						'type'        => 'String',
						'description' => __( 'Sender name', 'chronos-bridge' ),
					),
					'email'   => array(
						'type'        => 'String',
						'description' => __( 'Sender email', 'chronos-bridge' ),
					),
					'subject' => array(
						'type'        => 'String',
						'description' => __( 'Message subject', 'chronos-bridge' ),
					),
					'message' => array(
						'type'        => 'String',
						'description' => __( 'Message body', 'chronos-bridge' ),
					),
				),
				'outputFields'        => array(
					'success' => array(
						'type'        => 'Boolean',
						'description' => __( 'Whether the submission succeeded', 'chronos-bridge' ),
					),
					'message' => array(
						'type'        => 'String',
						'description' => __( 'Response message', 'chronos-bridge' ),
					),
				),
				'mutateAndGetPayload' => array( self::class, 'handle_submission' ),
			)
		);
	}

	/**
	 * Handle the contact form submission.
	 *
	 * @param array{name?: string, email?: string, subject?: string, message?: string} $input Mutation input fields.
	 * @return array{success: bool, message: string}
	 */
	public static function handle_submission( array $input ): array {
		// Validate required fields.
		$name    = Sanitizer::text( $input['name'] ?? '' );
		$email   = Sanitizer::email( $input['email'] ?? '' );
		$subject = Sanitizer::text( $input['subject'] ?? '' );
		$message = Sanitizer::textarea( $input['message'] ?? '' );

		if ( empty( $name ) || empty( $email ) || empty( $message ) ) {
			return array(
				'success' => false,
				'message' => __( 'Name, email, and message are required.', 'chronos-bridge' ),
			);
		}

		if ( ! Sanitizer::is_valid_email( $email ) ) {
			return array(
				'success' => false,
				'message' => __( 'Please provide a valid email address.', 'chronos-bridge' ),
			);
		}

		// Rate limiting.
		$rate_limit_enabled = get_option( 'chronos_enable_rate_limiting', '1' );
		if ( '1' === $rate_limit_enabled && ContactTable::is_rate_limited() ) {
			return array(
				'success' => false,
				'message' => __( 'Too many submissions. Please try again later.', 'chronos-bridge' ),
			);
		}

		// Store in database.
		$submission_id = ContactTable::insert(
			array(
				'name'    => $name,
				'email'   => $email,
				'subject' => $subject,
				'message' => $message,
			)
		);

		if ( false === $submission_id ) {
			return array(
				'success' => false,
				'message' => __( 'Failed to save submission. Please try again.', 'chronos-bridge' ),
			);
		}

		// Increment rate limiter.
		ContactTable::increment_rate_limit();

		// Send email notification.
		$email_enabled = get_option( 'chronos_enable_email_notifications', '1' );
		if ( '1' === $email_enabled ) {
			self::send_notification_email( $name, $email, $subject, $message );
		}

		return array(
			'success' => true,
			'message' => __( 'Thank you for your message. We will get back to you soon.', 'chronos-bridge' ),
		);
	}

	/**
	 * Send email notification to the site admin.
	 *
	 * @param string $name    Sender name.
	 * @param string $email   Sender email address.
	 * @param string $subject Message subject.
	 * @param string $message Message body.
	 */
	private static function send_notification_email(
		string $name,
		string $email,
		string $subject,
		string $message,
	): void {
		$to      = get_option( 'chronos_contact_email', get_option( 'admin_email' ) );
		$headers = array(
			'Content-Type: text/html; charset=UTF-8',
			sprintf( 'Reply-To: %s <%s>', $name, $email ),
		);

		$email_subject = sprintf(
			/* translators: %s: message subject */
			__( 'New Chronos Contact: %s', 'chronos-bridge' ),
			$subject
		);

		$email_body = sprintf(
			'<h3>%s</h3><p><strong>%s:</strong> %s</p><p><strong>%s:</strong> %s</p><p><strong>%s:</strong> %s</p><p><strong>%s:</strong><br/>%s</p>',
			esc_html__( 'New Contact Submission', 'chronos-bridge' ),
			esc_html__( 'Name', 'chronos-bridge' ),
			esc_html( $name ),
			esc_html__( 'Email', 'chronos-bridge' ),
			esc_html( $email ),
			esc_html__( 'Subject', 'chronos-bridge' ),
			esc_html( $subject ),
			esc_html__( 'Message', 'chronos-bridge' ),
			nl2br( esc_html( $message ) )
		);

		wp_mail( $to, $email_subject, $email_body, $headers );
	}
}
