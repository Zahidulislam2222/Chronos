<?php
/**
 * Connected editorial routes and WordPress-owned navigation.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Api;

/** Owns the SiteEndpoint integration boundary. */
final class SiteEndpoint extends RestController {

	/**
	 * Register navigation and public permalink hooks.
	 */
	public static function register(): void {
		add_action(
			'after_setup_theme',
			static function (): void {
				register_nav_menus( array( 'chronos_primary' => __( 'Chronos storefront', 'chronos-bridge' ) ) );
			}
		);
		foreach ( array( 'post_link', 'page_link', 'post_type_link' ) as $filter ) {
			add_filter( $filter, array( self::class, 'frontend_link' ), 10, 2 );
		}
	}

	/**
	 * Resolve a published WordPress record to its storefront URL.
	 *
	 * @param string $url Original permalink.
	 * @param mixed  $post WordPress post or identifier.
	 */
	public static function frontend_link( string $url, $post ): string {
		$post   = get_post( $post );
		$origin = untrailingslashit( (string) get_option( 'chronos_frontend_url', '' ) );
		if ( ! $post || ! $origin || 'publish' !== $post->post_status ) {
			return $url;
		}
		foreach ( array(
			'shop'      => '/shop',
			'cart'      => '/cart',
			'checkout'  => '/checkout',
			'myaccount' => '/account',
		) as $role => $route ) {
			if ( function_exists( 'wc_get_page_id' ) && wc_get_page_id( $role ) === $post->ID ) {
				return $origin . $route;
			}
		}
		$path = match ( $post->post_type ) {
			'product' => '/product/' . $post->post_name,
			'post' => '/blog/' . $post->post_name,
			'page' => '/' . get_page_uri( $post ),
			default => null,
		};
		return null === $path ? $url : $origin . ( '/my-account' === $path ? '/account' : $path );
	}

	/**
	 * Register read-only editorial endpoints.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/route-status',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'route_status' ),
				'permission_callback' => array( $this, 'permission_public' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/sitemap',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'sitemap' ),
				'permission_callback' => array( $this, 'permission_public' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/site',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'site' ),
				'permission_callback' => array( $this, 'permission_public' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/page',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'page' ),
				'permission_callback' => array( $this, 'permission_public' ),
				'args'                => array(
					'uri' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Validate a dynamic route for the reverse proxy's status subrequest.
	 *
	 * @param \WP_REST_Request $request Original URI supplied by the proxy.
	 */
	public function route_status( \WP_REST_Request $request ): \WP_REST_Response {
		$path = trim( (string) wp_parse_url( $request->get_header( 'X-Chronos-Path' ), PHP_URL_PATH ), '/' );
		$type = array( 'page', 'post' );
		if ( str_starts_with( $path, 'product/' ) ) {
			$path = substr( $path, strlen( 'product/' ) );
			$type = 'product';
		} elseif ( str_starts_with( $path, 'blog/' ) ) {
			$path = substr( $path, strlen( 'blog/' ) );
			$type = 'post';
		}
		$post  = $path ? get_page_by_path( $path, OBJECT, $type ) : null;
		$valid = $post && 'publish' === $post->post_status && empty( $post->post_password );
		// Nginx auth_request maps denied subrequests to the storefront's real 404.
		return new \WP_REST_Response( null, $valid ? 200 : 403 );
	}

	/** Return current public content URLs for the XML delivery hook. */
	public function sitemap(): \WP_REST_Response {
		$origin   = untrailingslashit( (string) get_option( 'chronos_frontend_url', '' ) );
		$urls     = array( $origin . '/', $origin . '/shop', $origin . '/blog', $origin . '/contact' );
		$excluded = array_map( 'wc_get_page_id', array( 'cart', 'checkout', 'myaccount' ) );
		$posts    = get_posts(
			array(
				'post_type'    => array( 'product', 'post', 'page' ),
				'post_status'  => 'publish',
				'numberposts'  => -1,
				'has_password' => false,
			)
		);
		foreach ( $posts as $post ) {
			if ( ! in_array( $post->ID, $excluded, true ) ) {
				$urls[] = get_permalink( $post );
			}
		}
		return new \WP_REST_Response( array_values( array_unique( $urls ) ) );
	}

	/**
	 * Return published pages and the assigned navigation menu.
	 */
	public function site(): \WP_REST_Response {
		$locations = get_nav_menu_locations();
		$items     = wp_get_nav_menu_items( $locations['chronos_primary'] ?? 0 );
		$items     = is_array( $items ) ? $items : array();
		$nav       = array();
		foreach ( $items as $item ) {
			if ( 'post_type' === $item->type && 'publish' !== get_post_status( (int) $item->object_id ) ) {
				continue;
			}
			$nav[] = array(
				'label'  => wp_strip_all_tags( $item->title ),
				'href'   => $item->url,
				'parent' => (int) $item->menu_item_parent,
				'id'     => (int) $item->ID,
			);
		}
		$pages    = array_map(
			static fn( $p ) => array(
				'id'    => $p->ID,
				'title' => $p->post_title,
				'uri'   => get_page_uri( $p ),
				'url'   => get_permalink( $p ),
			),
			get_pages( array( 'post_status' => 'publish' ) )
		);
		$response = $this->success(
			array(
				'navigation' => $nav,
				'pages'      => $pages,
				'currency'   => get_woocommerce_currency(),
				'testMode'   => true,
			)
		);
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}

	/**
	 * Resolve and render one published editorial record.
	 *
	 * @param \WP_REST_Request $request Validated REST request.
	 */
	public function page( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$uri  = trim( (string) $request->get_param( 'uri' ), '/' );
		$post = get_page_by_path( $uri, OBJECT, array( 'page', 'post' ) );
		if ( ! $post || 'publish' !== $post->post_status || ! empty( $post->post_password ) ) {
			return $this->error( __( 'Page not found.', 'chronos-bridge' ), 'not_found', 404 );
		}
		$response = $this->success(
			array(
				'id'      => $post->ID,
				'title'   => $post->post_title,
				'uri'     => get_page_uri( $post ),
				'content' => wp_kses_post( wpautop( do_shortcode( do_blocks( $post->post_content ) ) ) ),
				'url'     => get_permalink( $post ),
				'type'    => $post->post_type,
			)
		);
		$response->header( 'Cache-Control', 'no-store' );
		return $response;
	}
}
