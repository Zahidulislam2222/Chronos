<?php
/**
 * Unit tests for the Sanitizer class.
 *
 * @package ChronosBridge\Tests\Unit
 */

declare(strict_types=1);

namespace ChronosBridge\Tests\Unit;

use ChronosBridge\Security\Sanitizer;
use PHPUnit\Framework\TestCase;

/**
 * These tests stub WordPress functions to isolate business logic.
 */
class SanitizerTest extends TestCase {

	/**
	 * Set up WordPress function stubs.
	 */
	protected function setUp(): void {
		parent::setUp();

		// Stub WordPress functions if they don't exist.
		if ( ! function_exists( 'sanitize_text_field' ) ) {
			function_exists( 'sanitize_text_field' ) || eval( 'function sanitize_text_field( string $str ): string { return trim( strip_tags( $str ) ); }' );
		}
		if ( ! function_exists( 'sanitize_textarea_field' ) ) {
			function_exists( 'sanitize_textarea_field' ) || eval( 'function sanitize_textarea_field( string $str ): string { return trim( strip_tags( $str ) ); }' );
		}
		if ( ! function_exists( 'sanitize_email' ) ) {
			function_exists( 'sanitize_email' ) || eval( 'function sanitize_email( string $email ): string { return filter_var( $email, FILTER_SANITIZE_EMAIL ) ?: ""; }' );
		}
		if ( ! function_exists( 'esc_url_raw' ) ) {
			function_exists( 'esc_url_raw' ) || eval( 'function esc_url_raw( string $url ): string { return filter_var( $url, FILTER_SANITIZE_URL ) ?: ""; }' );
		}
		if ( ! function_exists( 'absint' ) ) {
			function_exists( 'absint' ) || eval( 'function absint( $val ): int { return abs( intval( $val ) ); }' );
		}
		if ( ! function_exists( 'wp_kses' ) ) {
			function_exists( 'wp_kses' ) || eval( 'function wp_kses( string $str, $allowed ): string { return strip_tags( $str, "<a><br><em><strong><p><ul><ol><li>" ); }' );
		}
		if ( ! function_exists( 'is_email' ) ) {
			function_exists( 'is_email' ) || eval( 'function is_email( string $email ) { return filter_var( $email, FILTER_VALIDATE_EMAIL ) ?: false; }' );
		}
	}

	public function test_text_sanitizes_html(): void {
		$result = Sanitizer::text( '<script>alert("xss")</script>Hello' );
		$this->assertStringNotContainsString( '<script>', $result );
		$this->assertStringContainsString( 'Hello', $result );
	}

	public function test_text_trims_whitespace(): void {
		$result = Sanitizer::text( '  hello  ' );
		$this->assertSame( 'hello', $result );
	}

	public function test_email_sanitizes(): void {
		$result = Sanitizer::email( 'test@example.com' );
		$this->assertSame( 'test@example.com', $result );
	}

	public function test_email_strips_invalid_chars(): void {
		$result = Sanitizer::email( 'test<>@example.com' );
		$this->assertStringNotContainsString( '<', $result );
	}

	public function test_integer_returns_absolute(): void {
		$this->assertSame( 42, Sanitizer::integer( '42' ) );
		$this->assertSame( 42, Sanitizer::integer( -42 ) );
		$this->assertSame( 0, Sanitizer::integer( 'abc' ) );
	}

	public function test_is_valid_email_true(): void {
		$this->assertTrue( Sanitizer::is_valid_email( 'user@example.com' ) );
	}

	public function test_is_valid_email_false(): void {
		$this->assertFalse( Sanitizer::is_valid_email( 'not-an-email' ) );
	}

	public function test_is_valid_phone_true(): void {
		$this->assertTrue( Sanitizer::is_valid_phone( '+1 (555) 123-4567' ) );
		$this->assertTrue( Sanitizer::is_valid_phone( '5551234567' ) );
	}

	public function test_is_valid_phone_false(): void {
		$this->assertFalse( Sanitizer::is_valid_phone( 'abc' ) );
		$this->assertFalse( Sanitizer::is_valid_phone( '12' ) );
	}

	public function test_is_valid_url_true(): void {
		$this->assertTrue( Sanitizer::is_valid_url( 'https://example.com' ) );
	}

	public function test_is_valid_url_false(): void {
		$this->assertFalse( Sanitizer::is_valid_url( 'not a url' ) );
	}

	public function test_html_allows_safe_tags(): void {
		$input  = '<p>Hello <strong>world</strong></p><script>bad</script>';
		$result = Sanitizer::html( $input );
		$this->assertStringContainsString( '<p>', $result );
		$this->assertStringContainsString( '<strong>', $result );
		$this->assertStringNotContainsString( '<script>', $result );
	}
}
