<?php
/**
 * Stops signed-out visitors from enumerating WordPress accounts.
 *
 * Covers the REST users routes, author archives (including `?author=N`),
 * the core users sitemap and oEmbed author fields. Signed-in users keep
 * `/wp/v2/users/me`; administrators keep every route.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Security;

/** Account-enumeration guards for public requests. */
final class PublicExposure {

	/** Register the guards. */
	public static function register(): void {
		add_filter( 'rest_pre_dispatch', array( self::class, 'guard_rest_users' ), 10, 3 );
		add_filter( 'request', array( self::class, 'remove_author_query' ) );
		add_filter( 'wp_sitemaps_add_provider', array( self::class, 'remove_users_sitemap' ), 10, 2 );
		add_filter( 'oembed_response_data', array( self::class, 'remove_oembed_author' ) );
	}

	/**
	 * Refuse user listings and lookups to anyone who cannot list users.
	 *
	 * @param mixed            $result  Earlier short-circuit value.
	 * @param mixed            $server  REST server (unused).
	 * @param \WP_REST_Request $request Current request.
	 * @return mixed
	 */
	public static function guard_rest_users( $result, $server, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by the filter signature.
		if ( null !== $result || ! is_object( $request ) || ! method_exists( $request, 'get_route' ) ) {
			return $result;
		}
		$route = (string) $request->get_route();
		if ( 1 !== preg_match( '#^/wp/v2/users(?:/|$)#', $route ) || '/wp/v2/users/me' === $route || current_user_can( 'list_users' ) ) {
			return $result;
		}
		return new \WP_Error(
			'rest_user_cannot_view',
			__( 'Sorry, you are not allowed to view users.', 'chronos-bridge' ),
			array( 'status' => is_user_logged_in() ? 403 : 401 )
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
