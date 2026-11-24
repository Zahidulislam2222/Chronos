<?php
/**
 * Stops signed-out visitors from enumerating WordPress accounts.
 *
 * Covers the REST users routes, author archives (including `?author=N`),
 * the core users sitemap, oEmbed author fields and sign-in error messages.
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
	 * Covers wp-login.php, REST application passwords and the GraphQL JWT login mutation,
	 * which all call wp_authenticate().
	 *
	 * @param mixed $user Authentication result.
	 * @return mixed
	 */
	public static function uniform_login_error( $user ) {
		if ( is_wp_error( $user ) && in_array( $user->get_error_code(), array( 'invalid_username', 'invalid_email', 'incorrect_password' ), true ) ) {
			return new \WP_Error( 'invalid_credentials', __( 'The username or password is incorrect.', 'chronos-bridge' ) );
		}
		return $user;
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
