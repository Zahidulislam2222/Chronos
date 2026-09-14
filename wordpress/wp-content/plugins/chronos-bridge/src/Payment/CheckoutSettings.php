<?php
/**
 * One owner for the demonstration checkout's operational configuration.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);
namespace ChronosBridge\Payment;

/** Owns the CheckoutSettings integration boundary. */
final class CheckoutSettings {
	/**
	 * Read the central checkout configuration.
	 */
	public static function values(): array {
		return array(
			'frontend'         => untrailingslashit( (string) get_option( 'chronos_frontend_url', '' ) ),
			'max_items'        => (int) get_option( 'chronos_checkout_max_items', 20 ),
			'max_quantity'     => (int) get_option( 'chronos_checkout_max_quantity', 10 ),
			'max_instructions' => (int) get_option( 'chronos_checkout_max_instructions', 500 ),
			'order_label'      => (string) get_option( 'chronos_checkout_order_label', 'Chronos demonstration order' ),
		);
	}
}
