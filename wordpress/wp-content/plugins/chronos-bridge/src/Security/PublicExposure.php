<?php
/**
 * Stops signed-out visitors from enumerating WordPress accounts.
 *
 * Covers the REST users routes, author archives (including `?author=N`),
 * the core users sitemap, oEmbed author fields, sign-in error messages
 * (including REST application passwords) and the lost-password form.
 * Signed-in users keep `/wp/v2/users/me`; staff keep the user routes.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Security;

/** Account-enumeration guards for public requests. */
final class PublicExposure {

	/** Register the guards. */
	public static function register(): void {
		add_filter( 'rest_dispatch_request', array( self::class, 'guard_rest_users' ), 10, 3 );
		add_filter( 'authenticate', array( self::class, 'uniform_login_error' ), 100 );
		add_filter( 'rest_authentication_errors', array( self::class, 'uniform_rest_auth_error' ), 100 );
		add_action( 'lostpassword_post', array( self::class, 'uniform_lost_password' ), 10, 2 );
		add_filter( 'request', array( self::class, 'remove_author_query' ) );
		add_filter( 'wp_sitemaps_add_provider', array( self::class, 'remove_users_sitemap' ), 10, 2 );
		add_filter( 'oembed_response_data', array( self::class, 'remove_oembed_author' ) );
	}

	/**
	 * Refuse user listings and lookups to visitors and customers.
	 *
	 * Runs on the route pattern WordPress actually matched, so letter case or
	 * trailing-slash variations of the URL cannot bypass it. Staff who can edit
	 * posts keep the block editor's author picker; `/wp/v2/users/me` stays open.
	 *
	 * @param mixed            $result  Earlier short-circuit value.
	 * @param \WP_REST_Request $request Current request (unused).
	 * @param string           $route   Matched route pattern.
	 * @return mixed
	 */
	public static function guard_rest_users( $result, $request, $route ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by the filter signature.
		if ( null !== $result || ! is_string( $route ) ) {
			return $result;
		}
		$route          = strtolower( $route );
		$is_users_route = '/wp/v2/users' === rtrim( $route, '/' ) || str_starts_with( $route, '/wp/v2/users/' );
		if ( ! $is_users_route || '/wp/v2/users/me' === $route
			|| current_user_can( 'list_users' ) || current_user_can( 'edit_posts' ) ) {
			return $result;
		}
		return new \WP_Error(
			'rest_user_cannot_view',
			__( 'Sorry, you are not allowed to view users.', 'chronos-bridge' ),
			array( 'status' => is_user_logged_in() ? 403 : 401 )
		);
	}

	/**
	 * Make failed sign-ins indistinguishable, so they cannot confirm that an account exists.
	 *
	 * Covers wp-login.php, XML-RPC and the GraphQL JWT login mutation, which call
	 * wp_authenticate(). REST application passwords are handled separately.
	 *
	 * @param mixed $user Authentication result.
	 * @return mixed
	 */
	public static function uniform_login_error( $user ) {
		return self::is_account_error( $user ) ? self::credentials_error() : $user;
	}

	/**
	 * Apply the same uniform error to REST application-password failures.
	 *
	 * Core validates application passwords without the `authenticate` filter and
	 * reports "unknown username" and "invalid application password" differently.
	 *
	 * @param mixed $result Earlier authentication result.
	 * @return mixed
	 */
	public static function uniform_rest_auth_error( $result ) {
		return self::is_account_error( $result ) ? self::credentials_error( 401 ) : $result;
	}

	/**
	 * Answer a lost-password request for an unknown account exactly like a sent reset.
	 *
	 * Core adds its "no account" error after every filter, so the request is
	 * finished here with core's own success redirect.
	 *
	 * @param mixed $errors    Errors collected so far.
	 * @param mixed $user_data Matched user, or false.
	 */
	public static function uniform_lost_password( $errors, $user_data ): void {
		if ( ! self::masks_unknown_account( $errors, $user_data ) ) {
			return;
		}
		// Mirrors core's success branch in wp-login.php, which reads the same field without a nonce.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- wp_safe_redirect() validates the target, as in core.
		$redirect_to = ! empty( $_REQUEST['redirect_to'] ) ? wp_unslash( $_REQUEST['redirect_to'] ) : 'wp-login.php?checkemail=confirm';
		wp_safe_redirect( $redirect_to );
		exit;
	}

	/**
	 * Whether a lost-password request names no account and has no other error.
	 *
	 * An unknown username arrives with no error yet; an unknown email address
	 * arrives with core's `invalid_email` ("no account") error only.
	 *
	 * @param mixed $errors    Errors collected so far.
	 * @param mixed $user_data Matched user, or false.
	 */
	public static function masks_unknown_account( $errors, $user_data ): bool {
		if ( false !== $user_data || ! $errors instanceof \WP_Error || did_action( 'login_init' ) < 1 ) {
			return false;
		}
		return ! $errors->has_errors() || array( 'invalid_email' ) === $errors->get_error_codes();
	}

	/**
	 * Whether a value is an error that would reveal whether an account exists.
	 *
	 * @param mixed $value Authentication result.
	 */
	private static function is_account_error( $value ): bool {
		return is_wp_error( $value ) && in_array( $value->get_error_code(), array( 'invalid_username', 'invalid_email', 'incorrect_password' ), true );
	}

	/**
	 * The one sign-in error visitors see.
	 *
	 * @param int $status HTTP status for REST responses, 0 for none.
	 */
	private static function credentials_error( int $status = 0 ): \WP_Error {
		return new \WP_Error(
			'invalid_credentials',
			__( 'The username or password is incorrect.', 'chronos-bridge' ),
			$status > 0 ? array( 'status' => $status ) : ''
		);
	}

	/**
	 * Turn author archive queries into a 404 before canonical redirects run.
	 *
	 * @param array<string, mixed> $query_vars Parsed query variables.
	 * @return array<string, mixed>
	 */
	public static function remove_author_query( array $query_vars ): array {
		if ( is_admin() || current_user_can( 'list_users' ) ) {
			return $query_vars;
		}
		if ( isset( $query_vars['author'] ) || isset( $query_vars['author_name'] ) ) {
			unset( $query_vars['author'], $query_vars['author_name'] );
			$query_vars['error'] = '404';
		}
		return $query_vars;
	}

	/**
	 * Drop the core users sitemap provider.
	 *
	 * @param mixed  $provider Sitemap provider.
	 * @param string $name     Provider name.
	 * @return mixed
	 */
	public static function remove_users_sitemap( $provider, string $name ) {
		return 'users' === $name ? false : $provider;
	}

	/**
	 * Remove author fields from oEmbed responses.
	 *
	 * @param array<string, mixed> $data oEmbed response data.
	 * @return array<string, mixed>
	 */
	public static function remove_oembed_author( array $data ): array {
		unset( $data['author_name'], $data['author_url'] );
		return $data;
	}
}
