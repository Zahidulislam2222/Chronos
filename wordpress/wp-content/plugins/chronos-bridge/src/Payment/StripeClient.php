<?php
/**
 * Stripe SDK wrapper — retrieves API keys from WordPress options.
 *
 * @package ChronosBridge\Payment
 */

declare(strict_types=1);

namespace ChronosBridge\Payment;

use Stripe\StripeClient as Stripe;
use Stripe\Exception\ApiErrorException;

/**
 * Provides a configured Stripe client instance.
 */
final class StripeClient {

	/**
	 * Cached Stripe client.
	 *
	 * @var Stripe|null
	 */
	private static ?Stripe $client = null;

	/**
	 * Get the Stripe client configured with the secret key from WP options.
	 *
	 * @throws \RuntimeException If the Stripe secret key is not configured.
	 */
	public static function get(): Stripe {
		if ( null !== self::$client ) {
			return self::$client;
		}

		$secret_key = self::get_secret_key();

		if ( empty( $secret_key ) ) {
			// phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped, WordPress.Security.EscapeOutput.ExceptionNotEscaped
			throw new \RuntimeException(
				__( 'Stripe secret key is not configured. Go to Chronos > Settings to add it.', 'chronos-bridge' )
			);
			// phpcs:enable
		}

		self::$client = new Stripe( $secret_key );

		return self::$client;
	}

	/**
	 * Get the publishable key (safe for frontend).
	 */
	public static function get_publishable_key(): string {
		return (string) get_option( 'chronos_stripe_publishable_key', '' );
	}

	/**
	 * Get the secret key.
	 */
	public static function get_secret_key(): string {
		return (string) get_option( 'chronos_stripe_secret_key', '' );
	}

	/**
	 * Get the webhook signing secret.
	 */
	public static function get_webhook_secret(): string {
		return (string) get_option( 'chronos_stripe_webhook_secret', '' );
	}

	/**
	 * Check if Stripe is configured (both keys present).
	 */
	public static function is_configured(): bool {
		return ! empty( self::get_publishable_key() ) && ! empty( self::get_secret_key() );
	}

	/**
	 * Check if we're using test mode (key starts with sk_test_).
	 */
	public static function is_test_mode(): bool {
		return str_starts_with( self::get_secret_key(), 'sk_test_' );
	}

	/**
	 * Reset the cached client (useful for testing).
	 */
	public static function reset(): void {
		self::$client = null;
	}
}
