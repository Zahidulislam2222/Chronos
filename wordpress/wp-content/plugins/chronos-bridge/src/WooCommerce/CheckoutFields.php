<?php
/**
 * Custom WooCommerce checkout fields — gift wrapping and delivery instructions.
 *
 * @package ChronosBridge\WooCommerce
 */

declare(strict_types=1);

namespace ChronosBridge\WooCommerce;

/**
 * Adds custom fields to WooCommerce checkout and order admin.
 */
final class CheckoutFields {

	/**
	 * Register all WooCommerce hooks.
	 */
	public static function register(): void {
		// REST API endpoint always registers (headless frontend needs it).
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );

		// GraphQL fields always register.
		add_action( 'graphql_register_types', array( self::class, 'register_graphql_fields' ) );

		// WooCommerce-specific hooks only when WC is available.
		add_action( 'woocommerce_after_order_notes', array( self::class, 'render_custom_fields' ) );
		add_action( 'woocommerce_checkout_process', array( self::class, 'validate_custom_fields' ) );
		add_action( 'woocommerce_checkout_update_order_meta', array( self::class, 'save_custom_fields' ) );
		add_action( 'woocommerce_admin_order_data_after_billing_address', array( self::class, 'display_in_admin' ) );
		add_action( 'woocommerce_email_after_order_table', array( self::class, 'display_in_email' ), 10, 1 );
	}

	/**
	 * Render custom checkout fields.
	 *
	 * @param \WC_Checkout $checkout The checkout object.
	 */
	public static function render_custom_fields( \WC_Checkout $checkout ): void {
		echo '<div class="chronos-custom-fields"><h3>' . esc_html__( 'Special Options', 'chronos-bridge' ) . '</h3>';

		woocommerce_form_field(
			'chronos_gift_wrapping',
			array(
				'type'  => 'checkbox',
				'class' => array( 'form-row-wide' ),
				'label' => __( 'Add gift wrapping', 'chronos-bridge' ),
			),
			$checkout->get_value( 'chronos_gift_wrapping' )
		);

		woocommerce_form_field(
			'chronos_delivery_instructions',
			array(
				'type'        => 'textarea',
				'class'       => array( 'form-row-wide' ),
				'label'       => __( 'Delivery instructions', 'chronos-bridge' ),
				'placeholder' => __( 'E.g., leave at front door, ring doorbell, call on arrival...', 'chronos-bridge' ),
				'maxlength'   => 500,
			),
			$checkout->get_value( 'chronos_delivery_instructions' )
		);

		echo '</div>';
	}

	/**
	 * Validate custom fields during checkout.
	 */
	public static function validate_custom_fields(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce handles nonce verification for checkout.
		$instructions = isset( $_POST['chronos_delivery_instructions'] )
			? sanitize_textarea_field( wp_unslash( $_POST['chronos_delivery_instructions'] ) )
			: '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( mb_strlen( $instructions ) > 500 ) {
			wc_add_notice(
				__( 'Delivery instructions cannot exceed 500 characters.', 'chronos-bridge' ),
				'error'
			);
		}
	}

	/**
	 * Save custom fields to order meta.
	 *
	 * @param int $order_id The WooCommerce order ID.
	 */
	public static function save_custom_fields( int $order_id ): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce handles nonce verification for checkout.
		$gift_wrapping = ! empty( $_POST['chronos_gift_wrapping'] ) ? 'yes' : 'no';

		$delivery_instructions = isset( $_POST['chronos_delivery_instructions'] )
			? sanitize_textarea_field( wp_unslash( $_POST['chronos_delivery_instructions'] ) )
			: '';

		update_post_meta( $order_id, '_chronos_gift_wrapping', $gift_wrapping );
		update_post_meta( $order_id, '_chronos_delivery_instructions', $delivery_instructions );
		// phpcs:enable WordPress.Security.NonceVerification.Missing
	}

	/**
	 * Save custom fields from REST API / headless checkout.
	 *
	 * @param int    $order_id              The WooCommerce order ID.
	 * @param bool   $gift_wrapping         Whether gift wrapping is requested.
	 * @param string $delivery_instructions Delivery instructions text.
	 */
	public static function save_from_api( int $order_id, bool $gift_wrapping, string $delivery_instructions ): void {
		update_post_meta( $order_id, '_chronos_gift_wrapping', $gift_wrapping ? 'yes' : 'no' );
		update_post_meta(
			$order_id,
			'_chronos_delivery_instructions',
			sanitize_textarea_field( $delivery_instructions )
		);
	}

	/**
	 * Display custom fields in admin order view.
	 *
	 * @param \WC_Order $order The order object.
	 */
	public static function display_in_admin( \WC_Order $order ): void {
		$gift     = get_post_meta( $order->get_id(), '_chronos_gift_wrapping', true );
		$delivery = get_post_meta( $order->get_id(), '_chronos_delivery_instructions', true );

		if ( 'yes' === $gift ) {
			echo '<p><strong>' . esc_html__( 'Gift Wrapping:', 'chronos-bridge' ) . '</strong> '
				. esc_html__( 'Yes', 'chronos-bridge' ) . '</p>';
		}

		if ( ! empty( $delivery ) ) {
			echo '<p><strong>' . esc_html__( 'Delivery Instructions:', 'chronos-bridge' ) . '</strong><br/>'
				. esc_html( $delivery ) . '</p>';
		}
	}

	/**
	 * Display custom fields in order emails.
	 *
	 * @param \WC_Order $order The order object.
	 */
	public static function display_in_email( \WC_Order $order ): void {
		self::display_in_admin( $order );
	}

	/**
	 * Register REST API routes for headless custom checkout fields.
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/checkout/custom-fields',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( self::class, 'handle_custom_fields_api' ),
					'permission_callback' => '__return_true',
					'args'                => array(
						'orderId'              => array(
							'type'     => 'integer',
							'required' => true,
						),
						'giftWrapping'         => array(
							'type'    => 'boolean',
							'default' => false,
						),
						'deliveryInstructions' => array(
							'type'    => 'string',
							'default' => '',
						),
					),
				),
			)
		);
	}

	/**
	 * Handle custom fields via REST API for headless checkout.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function handle_custom_fields_api( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$order_id     = absint( $request->get_param( 'orderId' ) );
		$gift         = (bool) $request->get_param( 'giftWrapping' );
		$instructions = sanitize_textarea_field( $request->get_param( 'deliveryInstructions' ) );

		if ( ! function_exists( 'wc_get_order' ) ) {
			return new \WP_Error( 'woo_missing', __( 'WooCommerce is not active.', 'chronos-bridge' ), array( 'status' => 500 ) );
		}

		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return new \WP_Error( 'invalid_order', __( 'Order not found.', 'chronos-bridge' ), array( 'status' => 404 ) );
		}

		self::save_from_api( $order_id, $gift, $instructions );

		return new \WP_REST_Response(
			array(
				'success' => true,
				'data'    => array(
					'orderId'              => $order_id,
					'giftWrapping'         => $gift,
					'deliveryInstructions' => $instructions,
				),
			),
			200
		);
	}

	/**
	 * Register custom fields in GraphQL (for WPGraphQL WooCommerce).
	 */
	public static function register_graphql_fields(): void {
		if ( ! function_exists( 'register_graphql_field' ) ) {
			return;
		}

		register_graphql_field(
			'Order',
			'giftWrapping',
			array(
				'type'        => 'Boolean',
				'description' => __( 'Whether gift wrapping was requested.', 'chronos-bridge' ),
				'resolve'     => static function ( $order ): bool {
					return 'yes' === get_post_meta( $order->databaseId, '_chronos_gift_wrapping', true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WPGraphQL property.
				},
			)
		);

		register_graphql_field(
			'Order',
			'deliveryInstructions',
			array(
				'type'        => 'String',
				'description' => __( 'Delivery instructions from the customer.', 'chronos-bridge' ),
				'resolve'     => static function ( $order ): string {
					return (string) get_post_meta( $order->databaseId, '_chronos_delivery_instructions', true ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- WPGraphQL property.
				},
			)
		);
	}
}
