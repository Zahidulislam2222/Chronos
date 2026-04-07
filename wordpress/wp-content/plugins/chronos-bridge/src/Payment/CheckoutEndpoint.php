<?php
/**
 * REST endpoint: POST /chronos/v1/stripe/create-session
 *
 * Creates a Stripe Checkout Session for the current WooCommerce cart.
 *
 * @package ChronosBridge\Payment
 */

declare(strict_types=1);

namespace ChronosBridge\Payment;

use ChronosBridge\Api\RestController;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use Stripe\Exception\ApiErrorException;

/**
 * Handles Stripe Checkout Session creation.
 */
final class CheckoutEndpoint extends RestController {

	/**
	 * Register routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/stripe/create-session',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'create_session' ),
					'permission_callback' => array( $this, 'permission_public' ),
					'args'                => $this->get_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/stripe/config',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_config' ),
					'permission_callback' => array( $this, 'permission_public' ),
				),
			)
		);
	}

	/**
	 * GET /stripe/config — return publishable key and mode.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_config( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		if ( ! StripeClient::is_configured() ) {
			return $this->error(
				__( 'Stripe is not configured.', 'chronos-bridge' ),
				'stripe_not_configured',
				503
			);
		}

		return $this->success(
			array(
				'publishableKey' => StripeClient::get_publishable_key(),
				'testMode'       => StripeClient::is_test_mode(),
			)
		);
	}

	/**
	 * POST /stripe/create-session — create a Checkout Session.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_session( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		if ( ! StripeClient::is_configured() ) {
			return $this->error(
				__( 'Stripe is not configured.', 'chronos-bridge' ),
				'stripe_not_configured',
				503
			);
		}

		$line_items  = $request->get_param( 'lineItems' );
		$success_url = $request->get_param( 'successUrl' );
		$cancel_url  = $request->get_param( 'cancelUrl' );
		$email       = $request->get_param( 'customerEmail' );
		$metadata    = $request->get_param( 'metadata' );

		if ( empty( $line_items ) || ! is_array( $line_items ) ) {
			return $this->error(
				__( 'No line items provided.', 'chronos-bridge' ),
				'invalid_line_items',
				400
			);
		}

		$stripe_line_items = array();

		foreach ( $line_items as $item ) {
			$stripe_line_items[] = array(
				'price_data' => array(
					'currency'     => strtolower( get_woocommerce_currency() ),
					'product_data' => array(
						'name'   => sanitize_text_field( $item['name'] ?? '' ),
						'images' => ! empty( $item['image'] ) ? array( esc_url_raw( $item['image'] ) ) : array(),
					),
					'unit_amount'  => absint( $item['price'] ?? 0 ),
				),
				'quantity'   => max( 1, absint( $item['quantity'] ?? 1 ) ),
			);
		}

		try {
			$stripe  = StripeClient::get();
			$session = $stripe->checkout->sessions->create(
				array(
					'mode'                        => 'payment',
					'payment_method_types'        => array( 'card' ),
					'line_items'                  => $stripe_line_items,
					'success_url'                 => esc_url_raw( $success_url ) . '?session_id={CHECKOUT_SESSION_ID}',
					'cancel_url'                  => esc_url_raw( $cancel_url ),
					'customer_email'              => sanitize_email( $email ),
					'metadata'                    => is_array( $metadata ) ? array_map( 'sanitize_text_field', $metadata ) : array(),
					'shipping_address_collection' => array(
						'allowed_countries' => array( 'US', 'CA', 'GB', 'DE', 'FR', 'AU', 'BD' ),
					),
				)
			);

			return $this->success(
				array(
					'sessionId' => $session->id,
					'url'       => $session->url,
				)
			);
		} catch ( ApiErrorException $e ) {
			return $this->error(
				$e->getMessage(),
				'stripe_error',
				500
			);
		}
	}

	/**
	 * Argument schema for create-session.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_args(): array {
		return array(
			'lineItems'     => array(
				'type'     => 'array',
				'required' => true,
				'items'    => array(
					'type'       => 'object',
					'properties' => array(
						'name'     => array( 'type' => 'string' ),
						'price'    => array( 'type' => 'integer' ),
						'quantity' => array( 'type' => 'integer' ),
						'image'    => array( 'type' => 'string' ),
					),
				),
			),
			'successUrl'    => array(
				'type'     => 'string',
				'required' => true,
			),
			'cancelUrl'     => array(
				'type'     => 'string',
				'required' => true,
			),
			'customerEmail' => array(
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_email',
			),
			'metadata'      => array(
				'type'    => 'object',
				'default' => array(),
			),
		);
	}
}
