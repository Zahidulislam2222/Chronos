<?php
/**
 * Centralized sanitization, validation, and security helpers.
 *
 * @package ChronosBridge\Security
 */

declare(strict_types=1);

namespace ChronosBridge\Security;

/**
 * Provides centralized input sanitization and security helpers.
 */
final class Sanitizer {

	/**
	 * Sanitize a plain-text string.
	 *
	 * @param string $value Raw input value.
	 * @return string
	 */
	public static function text( string $value ): string {
		return sanitize_text_field( $value );
	}

	/**
	 * Sanitize a textarea (preserves newlines).
	 *
	 * @param string $value Raw input value.
	 * @return string
	 */
	public static function textarea( string $value ): string {
		return sanitize_textarea_field( $value );
	}

	/**
	 * Sanitize an email address.
	 *
	 * @param string $value Raw email input.
	 * @return string
	 */
	public static function email( string $value ): string {
		return sanitize_email( $value );
	}

	/**
	 * Sanitize a URL.
	 *
	 * @param string $value Raw URL input.
	 * @return string
	 */
	public static function url( string $value ): string {
		return esc_url_raw( $value );
	}

	/**
	 * Sanitize an integer value.
	 *
	 * @param mixed $value Raw input value.
	 * @return int
	 */
	public static function integer( mixed $value ): int {
		return absint( $value );
	}

	/**
	 * Sanitize HTML using wp_kses with limited allowed tags.
	 *
	 * @param string $value Raw HTML input.
	 * @return string
	 */
	public static function html( string $value ): string {
		return wp_kses( $value, self::allowed_html_tags() );
	}

	/**
	 * Validate an email address.
	 *
	 * @param string $email Email address to validate.
	 * @return bool
	 */
	public static function is_valid_email( string $email ): bool {
		return false !== is_email( $email );
	}

	/**
	 * Validate a phone number (international format).
	 *
	 * @param string $phone Phone number to validate.
	 * @return bool
	 */
	public static function is_valid_phone( string $phone ): bool {
		return (bool) preg_match( '/^\+?[0-9\s\-\(\)]{7,20}$/', $phone );
	}

	/**
	 * Validate a URL.
	 *
	 * @param string $url URL to validate.
	 * @return bool
	 */
	public static function is_valid_url( string $url ): bool {
		return (bool) filter_var( $url, FILTER_VALIDATE_URL );
	}

	/**
	 * Create a nonce field for a form.
	 *
	 * @param string $action Nonce action name.
	 * @param string $name   Nonce field name.
	 */
	public static function nonce_field( string $action, string $name = '_chronos_nonce' ): void {
		wp_nonce_field( $action, $name );
	}

	/**
	 * Verify a nonce from a request.
	 *
	 * @param string $action Nonce action name.
	 * @param string $name   Nonce field name.
	 * @return bool
	 */
	public static function verify_nonce( string $action, string $name = '_chronos_nonce' ): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This IS the nonce verification function.
		$nonce = sanitize_text_field( wp_unslash( $_REQUEST[ $name ] ?? '' ) );
		return (bool) wp_verify_nonce( $nonce, $action );
	}

	/**
	 * Check if the current user has a capability.
	 *
	 * @param string $capability WordPress capability string.
	 * @return bool
	 */
	public static function can( string $capability = 'manage_options' ): bool {
		return current_user_can( $capability );
	}

	/**
	 * Abort with 403 if user lacks a capability.
	 *
	 * @param string $capability WordPress capability string.
	 */
	public static function require_capability( string $capability = 'manage_options' ): void {
		if ( ! self::can( $capability ) ) {
			wp_die(
				esc_html__( 'You do not have permission to access this page.', 'chronos-bridge' ),
				403
			);
		}
	}

	/**
	 * Get the client IP address (for rate limiting).
	 *
	 * @return string
	 */
	public static function get_client_ip(): string {
		$ip = sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
		return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '0.0.0.0';
	}

	/**
	 * Allowed HTML tags for wp_kses.
	 *
	 * @return array<string, array<string, bool>>
	 */
	private static function allowed_html_tags(): array {
		return array(
			'a'      => array(
				'href'   => true,
				'title'  => true,
				'target' => true,
				'rel'    => true,
			),
			'br'     => array(),
			'em'     => array(),
			'strong' => array(),
			'p'      => array(),
			'ul'     => array(),
			'ol'     => array(),
			'li'     => array(),
		);
	}
}
