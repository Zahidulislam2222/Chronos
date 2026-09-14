<?php
/**
 * Signed Stripe events may fulfill only verified Chronos test sessions.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);
namespace ChronosBridge\Payment;

use ChronosBridge\Api\RestController;

/** Owns the WebhookHandler integration boundary. */
final class WebhookHandler extends RestController {
	/**
	 * Register the signed webhook receiver.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/stripe/webhook',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_webhook' ),
				'permission_callback' => array( $this, 'permission_public' ),
			)
		);
	}
	/**
	 * Verify signature and test mode before applying payment.
	 *
	 * @param \WP_REST_Request $request Validated REST request.
	 */
	public function handle_webhook( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! StripeClient::is_test_mode() || ! StripeClient::get_webhook_secret() ) {
			return $this->error( __( 'Test webhook unavailable.', 'chronos-bridge' ), 'unavailable', 503 );
		}
		try {
			$event = \Stripe\Webhook::constructEvent( $request->get_body(), $request->get_header( 'stripe-signature' ) ?? '', StripeClient::get_webhook_secret() );
		} catch ( \UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $error ) {
			return $this->error( __( 'Invalid webhook signature or payload.', 'chronos-bridge' ), 'invalid_webhook', 400 );
		}
		if ( $event->livemode ) {
			return $this->error( __( 'Live events are not accepted.', 'chronos-bridge' ), 'live_event', 400 );
		}
		if ( 'checkout.session.completed' === $event->type && ! CheckoutEndpoint::fulfill( $event->data->object ) ) {
			return $this->error( __( 'Order verification failed.', 'chronos-bridge' ), 'order_mismatch', 409 );
		}
		return $this->success( array( 'received' => true ) );
	}
}
