<?php
/**
 * Authenticated, server-priced, test-only Stripe checkout.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);
namespace ChronosBridge\Payment;

use ChronosBridge\Api\RestController;

/** Owns the CheckoutEndpoint integration boundary. */
final class CheckoutEndpoint extends RestController {
	/**
	 * Register authenticated checkout operations.
	 */
	public function register_routes(): void {
		foreach ( array(
			'/stripe/config'         => array( 'GET', 'get_config' ),
			'/stripe/create-session' => array( 'POST', 'create_session' ),
			'/stripe/verify-session' => array( 'POST', 'verify_session' ),
		) as $route => $handler ) {
			register_rest_route(
				self::NAMESPACE,
				$route,
				array(
					'methods'             => $handler[0],
					'callback'            => array( $this, $handler[1] ),
					'permission_callback' => '/stripe/config' === $route ? array( $this, 'permission_public' ) : static fn() => is_user_logged_in(),
				)
			);
		}
	}

	/**
	 * Check that only a configured test provider can be used.
	 */
	private function ready(): bool {
		$origin = CheckoutSettings::values()['frontend'];
		return StripeClient::is_configured() && StripeClient::is_test_mode() && str_starts_with( StripeClient::get_publishable_key(), 'pk_test_' ) && 'https' === wp_parse_url( $origin, PHP_URL_SCHEME );
	}

	/**
	 * Expose checkout availability without exposing credentials.
	 */
	public function get_config(): \WP_REST_Response {
		return $this->success(
			array(
				'available' => $this->ready(),
				'testMode'  => true,
			)
		);
	}

	/**
	 * Create or reuse a server-priced test order and checkout session.
	 *
	 * @param \WP_REST_Request $request Validated REST request.
	 */
	public function create_session( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		if ( ! $this->ready() ) {
			return $this->error( __( 'Test checkout is not configured.', 'chronos-bridge' ), 'test_checkout_unavailable', 503 );
		}
		$config       = CheckoutSettings::values();
		$items        = $request->get_param( 'items' );
		$request_id   = $request->get_param( 'requestId' );
		$instructions = $request->get_param( 'deliveryInstructions' ) ?? '';
		if ( ! is_string( $request_id ) || ! preg_match( '/^[a-f0-9-]{36}$/D', $request_id ) || ! is_array( $items ) || ! count( $items ) || count( $items ) > $config['max_items'] || ! is_string( $instructions ) || mb_strlen( $instructions ) > $config['max_instructions'] ) {
			return $this->error( __( 'Invalid checkout request.', 'chronos-bridge' ), 'invalid_checkout', 400 );
		}
		$products = array();
		$seen     = array();
		foreach ( $items as $item ) {
			if ( ! is_array( $item ) || ! is_int( $item['productId'] ?? null ) || ! is_int( $item['quantity'] ?? null ) || $item['quantity'] < 1 || $item['quantity'] > $config['max_quantity'] || isset( $seen[ $item['productId'] ] ) ) {
				return $this->error( __( 'Invalid product or quantity.', 'chronos-bridge' ), 'invalid_items', 400 );
			}
			$product = wc_get_product( $item['productId'] );
			if ( ! $product || 'publish' !== $product->get_status() || ! $product->is_type( 'simple' ) || ! $product->is_purchasable() || ! $product->is_in_stock() || ! $product->has_enough_stock( $item['quantity'] ) || (float) $product->get_price() <= 0 ) {
				return $this->error( __( 'A selected product is unavailable.', 'chronos-bridge' ), 'unavailable_product', 409 );
			}
			$seen[ $item['productId'] ] = true;
			$products[]                 = array( $product, $item['quantity'] );
		}
		$user_id     = get_current_user_id();
		$key         = '_chronos_checkout_' . hash( 'sha256', $user_id . ':' . $request_id );
		$fingerprint = hash( 'sha256', wp_json_encode( array( $items, (bool) $request->get_param( 'giftWrapping' ), $instructions ) ) );
		global $wpdb;
		// A connection-scoped database lock is released even if the PHP worker exits.
		$lock = substr( $key, 0, 64 );
		if ( '1' !== (string) $wpdb->get_var( $wpdb->prepare( 'SELECT GET_LOCK(%s, 0)', $lock ) ) ) {
			return $this->error( __( 'This checkout is being processed. Please retry.', 'chronos-bridge' ), 'checkout_busy', 409 );
		}
		try {
			$order_id = (int) get_user_meta( $user_id, $key, true );
			$order    = $order_id ? wc_get_order( $order_id ) : null;
			if ( $order && ( $order->get_customer_id() !== $user_id || $order->get_meta( '_chronos_fingerprint' ) !== $fingerprint ) ) {
				return $this->error( __( 'The selection changed. Start a new checkout.', 'chronos-bridge' ), 'checkout_changed', 409 );
			}
			if ( ! $order ) {
				$order = wc_create_order(
					array(
						'customer_id' => $user_id,
						'status'      => 'pending',
					)
				);
				if ( is_wp_error( $order ) ) {
					return $this->error( __( 'Could not create the test order.', 'chronos-bridge' ), 'order_failed', 503 );
				}
				$order->update_meta_data( '_chronos_demo', 'yes' );
				$order->update_meta_data( '_chronos_fingerprint', $fingerprint );
				$order->update_meta_data( '_chronos_gift_wrapping', $request->get_param( 'giftWrapping' ) ? 'yes' : 'no' );
				$order->update_meta_data( '_chronos_delivery_instructions', sanitize_textarea_field( $instructions ) );
				$order->set_billing_email( wp_get_current_user()->user_email );
				foreach ( $products as $line ) {
					$order->add_product( $line[0], $line[1] );
				}
				$order->set_payment_method( 'chronos_stripe_test' );
				$order->calculate_totals();
				$order->save();
				update_user_meta( $user_id, $key, $order->get_id() );
			}
			if ( $order->is_paid() ) {
				return $this->error( __( 'This test order is already paid.', 'chronos-bridge' ), 'already_paid', 409 );
			}
			$session_id = $order->get_meta( '_chronos_stripe_session' );
			$stripe     = StripeClient::get();
			if ( $session_id ) {
				$session = $stripe->checkout->sessions->retrieve( $session_id );
			} else {
				$session = $stripe->checkout->sessions->create(
					array(
						'mode'                 => 'payment',
						'payment_method_types' => array( 'card' ),
						'line_items'           => array(
							array(
								'price_data' => array(
									'currency'     => strtolower( $order->get_currency() ),
									'unit_amount'  => (int) round( (float) $order->get_total() * ( 10 ** wc_get_price_decimals() ) ),
									'product_data' => array( 'name' => $config['order_label'] . ' #' . $order->get_order_number() ),
								),
								'quantity'   => 1,
							),
						),
						'success_url'          => $config['frontend'] . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
						'cancel_url'           => $config['frontend'] . '/checkout',
						'customer_email'       => $order->get_billing_email(),
						'metadata'             => array(
							'order_id' => (string) $order->get_id(),
							'user_id'  => (string) $user_id,
						),
					),
					array( 'idempotency_key' => $key )
				);
				$order->update_meta_data( '_chronos_stripe_session', $session->id );
				$order->save();
			}
			if ( $session->livemode || 'open' !== $session->status || empty( $session->url ) ) {
				return $this->error( __( 'This session is no longer open. Start a new checkout.', 'chronos-bridge' ), 'session_closed', 409 );
			}
			return $this->success(
				array(
					'url'      => $session->url,
					'orderId'  => $order->get_id(),
					'testMode' => true,
				)
			);
		} catch ( \Throwable $error ) {
			return $this->error( __( 'Test checkout could not be started. Retry with the same selection.', 'chronos-bridge' ), 'checkout_failed', 502 );
		} finally {
			$wpdb->get_var( $wpdb->prepare( 'SELECT RELEASE_LOCK(%s)', $lock ) );
		}
	}

	/**
	 * Apply payment only when the provider session matches the stored order.
	 *
	 * @param object $session Verified Stripe session.
	 */
	public static function fulfill( object $session ): bool {
		$order = wc_get_order( (int) ( $session->metadata->order_id ?? 0 ) );
		if ( ! $order || $order->get_customer_id() !== (int) ( $session->metadata->user_id ?? 0 ) ) {
			return false;
		}
		if ( ! $order || $session->livemode || 'paid' !== $session->payment_status || 'yes' !== $order->get_meta( '_chronos_demo' ) || $order->get_meta( '_chronos_stripe_session' ) !== $session->id || (int) round( (float) $order->get_total() * ( 10 ** wc_get_price_decimals() ) ) !== (int) $session->amount_total || strtolower( $order->get_currency() ) !== $session->currency ) {
			return false;
		}
		if ( ! $order->is_paid() && ! $order->payment_complete( $session->payment_intent ) ) {
			return false;
		}
		$saved = wc_get_order( $order->get_id() );
		return $saved && $saved->is_paid() && $saved->get_transaction_id() === $session->payment_intent;
	}

	/**
	 * Verify the signed-in customer owns the requested test payment.
	 *
	 * @param \WP_REST_Request $request Validated REST request.
	 */
	public function verify_session( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id = $request->get_param( 'sessionId' );
		if ( ! $this->ready() || ! is_string( $id ) || ! preg_match( '/^cs_test_[a-zA-Z0-9]+$/D', $id ) ) {
			return $this->error( __( 'Invalid test session.', 'chronos-bridge' ), 'invalid_session', 400 );
		}
		try {
			$session = StripeClient::get()->checkout->sessions->retrieve( $id );
			if ( (int) ( $session->metadata->user_id ?? 0 ) !== get_current_user_id() ) {
				return $this->error( __( 'Access denied.', 'chronos-bridge' ), 'forbidden', 403 );
			}
			return $this->success(
				array(
					'paid'     => self::fulfill( $session ),
					'orderId'  => (int) $session->metadata->order_id,
					'testMode' => true,
				)
			);
		} catch ( \Throwable $error ) {
			return $this->error( __( 'Could not verify test payment.', 'chronos-bridge' ), 'verification_failed', 502 );
		}
	}
}
