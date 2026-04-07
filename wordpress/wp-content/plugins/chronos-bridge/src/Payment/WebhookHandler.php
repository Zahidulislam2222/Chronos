<?php
/**
 * REST endpoint: POST /chronos/v1/stripe/webhook
 *
 * Handles Stripe webhook events with signature verification.
 *
 * @package ChronosBridge\Payment
 */

declare(strict_types=1);

namespace ChronosBridge\Payment;

use ChronosBridge\Api\RestController;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Exception\UnexpectedValueException;

/**
 * Handles incoming Stripe webhook events.
 */
final class WebhookHandler extends RestController {

	/**
	 * Register routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/stripe/webhook',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'handle_webhook' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Handle incoming webhook event.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_webhook( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$payload    = $request->get_body();
		$sig_header = $request->get_header( 'stripe-signature' );
		$secret     = StripeClient::get_webhook_secret();

		if ( empty( $secret ) ) {
			return $this->error(
				__( 'Webhook secret not configured.', 'chronos-bridge' ),
				'webhook_not_configured',
				500
			);
		}

		try {
			$event = Webhook::constructEvent( $payload, $sig_header ?? '', $secret );
		} catch ( UnexpectedValueException $e ) {
			return $this->error(
				__( 'Invalid payload.', 'chronos-bridge' ),
				'invalid_payload',
				400
			);
		} catch ( SignatureVerificationException $e ) {
			return $this->error(
				__( 'Invalid signature.', 'chronos-bridge' ),
				'invalid_signature',
				400
			);
		}

		$result = match ( $event->type ) {
			'checkout.session.completed'  => $this->handle_checkout_completed( $event->data->object ),
			'payment_intent.succeeded'    => $this->handle_payment_succeeded( $event->data->object ),
			'payment_intent.payment_failed' => $this->handle_payment_failed( $event->data->object ),
			default                       => true,
		};

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return $this->success( array( 'received' => true ) );
	}

	/**
	 * Handle checkout.session.completed event.
	 *
	 * Creates or updates a WooCommerce order when Stripe checkout completes.
	 *
	 * @param object $session The Stripe session object.
	 * @return bool|WP_Error
	 */
	private function handle_checkout_completed( object $session ): bool|WP_Error {
		$order_id = $session->metadata->order_id ?? null;

		if ( $order_id && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( (int) $order_id );
			if ( $order ) {
				$order->payment_complete( $session->payment_intent );
				$order->add_order_note(
					sprintf(
						/* translators: 1: Stripe session ID, 2: Payment intent ID */
						__( 'Stripe payment completed. Session: %1$s, Payment Intent: %2$s', 'chronos-bridge' ),
						$session->id,
						$session->payment_intent
					)
				);
				return true;
			}
		}

		// Log the event even without an order — useful for debugging.
		do_action( 'chronos_stripe_checkout_completed', $session );

		return true;
	}

	/**
	 * Handle payment_intent.succeeded event.
	 *
	 * @param object $payment_intent The Stripe PaymentIntent object.
	 * @return bool
	 */
	private function handle_payment_succeeded( object $payment_intent ): bool {
		$order_id = $payment_intent->metadata->order_id ?? null;

		if ( $order_id && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( (int) $order_id );
			if ( $order && ! $order->is_paid() ) {
				$order->payment_complete( $payment_intent->id );
				$order->add_order_note(
					sprintf(
						/* translators: %s: Stripe payment intent ID */
						__( 'Stripe payment intent succeeded: %s', 'chronos-bridge' ),
						$payment_intent->id
					)
				);
			}
		}

		do_action( 'chronos_stripe_payment_succeeded', $payment_intent );

		return true;
	}

	/**
	 * Handle payment_intent.payment_failed event.
	 *
	 * @param object $payment_intent The Stripe PaymentIntent object.
	 * @return bool
	 */
	private function handle_payment_failed( object $payment_intent ): bool {
		$order_id = $payment_intent->metadata->order_id ?? null;

		if ( $order_id && function_exists( 'wc_get_order' ) ) {
			$order = wc_get_order( (int) $order_id );
			if ( $order ) {
				$order->update_status(
					'failed',
					sprintf(
						/* translators: %s: Failure reason from Stripe */
						__( 'Stripe payment failed: %s', 'chronos-bridge' ),
						$payment_intent->last_payment_error->message ?? __( 'Unknown error', 'chronos-bridge' )
					)
				);
			}
		}

		do_action( 'chronos_stripe_payment_failed', $payment_intent );

		return true;
	}
}
