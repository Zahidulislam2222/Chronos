<?php
/**
 * JSON-LD structured data output for SEO.
 *
 * Outputs Product, Organization, and BreadcrumbList schemas.
 *
 * @package ChronosBridge\SEO
 */

declare(strict_types=1);

namespace ChronosBridge\SEO;

/**
 * Generates and outputs JSON-LD structured data.
 */
final class StructuredData {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'wp_head', array( self::class, 'output_organization_schema' ), 1 );
		add_action( 'wp_head', array( self::class, 'output_product_schema' ), 2 );
		add_action( 'wp_head', array( self::class, 'output_breadcrumb_schema' ), 3 );

		// REST API endpoint for headless frontend to fetch structured data.
		add_action( 'rest_api_init', array( self::class, 'register_rest_routes' ) );
	}

	/**
	 * Output Organization schema on every page.
	 */
	public static function output_organization_schema(): void {
		$schema = array(
			'@context'    => 'https://schema.org',
			'@type'       => 'Organization',
			'name'        => get_bloginfo( 'name' ),
			'url'         => home_url( '/' ),
			'description' => get_bloginfo( 'description' ),
			'logo'        => array(
				'@type' => 'ImageObject',
				'url'   => get_site_icon_url( 512 ) ? get_site_icon_url( 512 ) : '',
			),
			'sameAs'      => array(),
		);

		self::output_json_ld( $schema );
	}

	/**
	 * Output Product schema on single chronos_watch pages.
	 */
	public static function output_product_schema(): void {
		if ( ! is_singular( 'chronos_watch' ) ) {
			return;
		}

		$post = get_queried_object();
		if ( ! $post instanceof \WP_Post ) {
			return;
		}

		$schema = self::build_product_schema( $post );
		self::output_json_ld( $schema );
	}

	/**
	 * Output BreadcrumbList schema.
	 */
	public static function output_breadcrumb_schema(): void {
		if ( is_front_page() ) {
			return;
		}

		$items = array(
			array(
				'@type'    => 'ListItem',
				'position' => 1,
				'name'     => __( 'Home', 'chronos-bridge' ),
				'item'     => home_url( '/' ),
			),
		);

		$position = 2;

		if ( is_singular( 'chronos_watch' ) ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $position++,
				'name'     => __( 'Watches', 'chronos-bridge' ),
				'item'     => home_url( '/watches/' ),
			);
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $position,
				'name'     => get_the_title(),
			);
		} elseif ( is_post_type_archive( 'chronos_watch' ) ) {
			$items[] = array(
				'@type'    => 'ListItem',
				'position' => $position,
				'name'     => __( 'Watches', 'chronos-bridge' ),
			);
		}

		$schema = array(
			'@context'        => 'https://schema.org',
			'@type'           => 'BreadcrumbList',
			'itemListElement' => $items,
		);

		self::output_json_ld( $schema );
	}

	/**
	 * Build Product schema for a watch post.
	 *
	 * @param \WP_Post $post The watch post.
	 * @return array<string, mixed>
	 */
	public static function build_product_schema( \WP_Post $post ): array {
		$price         = (int) get_post_meta( $post->ID, '_chronos_price', true );
		$stock_status  = get_post_meta( $post->ID, '_chronos_stock_status', true );
		$condition     = get_post_meta( $post->ID, '_chronos_condition', true );
		$reference     = get_post_meta( $post->ID, '_chronos_reference', true );
		$brands        = wp_get_post_terms( $post->ID, 'chronos_brand', array( 'fields' => 'names' ) );
		$thumbnail_id  = get_post_thumbnail_id( $post->ID );
		$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( (int) $thumbnail_id, 'large' ) : '';

		$availability = match ( $stock_status ) {
			'in_stock'     => 'https://schema.org/InStock',
			'out_of_stock' => 'https://schema.org/OutOfStock',
			'pre_order'    => 'https://schema.org/PreOrder',
			default        => 'https://schema.org/InStock',
		};

		$item_condition = match ( $condition ) {
			'New'          => 'https://schema.org/NewCondition',
			'Pre-owned'    => 'https://schema.org/UsedCondition',
			'Refurbished'  => 'https://schema.org/RefurbishedCondition',
			default        => 'https://schema.org/NewCondition',
		};

		$schema = array(
			'@context'    => 'https://schema.org',
			'@type'       => 'Product',
			'name'        => get_the_title( $post ),
			'description' => wp_strip_all_tags( get_the_excerpt( $post ) ),
			'url'         => get_permalink( $post ),
			'sku'         => ! empty( $reference ) ? $reference : 'CW-' . $post->ID,
			'brand'       => array(
				'@type' => 'Brand',
				'name'  => is_array( $brands ) && ! empty( $brands ) ? $brands[0] : 'Chronos',
			),
			'category'    => __( 'Luxury Watches', 'chronos-bridge' ),
			'offers'      => array(
				'@type'         => 'Offer',
				'price'         => $price,
				'priceCurrency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
				'availability'  => $availability,
				'itemCondition' => $item_condition,
				'url'           => get_permalink( $post ),
				'seller'        => array(
					'@type' => 'Organization',
					'name'  => get_bloginfo( 'name' ),
				),
			),
		);

		if ( ! empty( $thumbnail_url ) ) {
			$schema['image'] = $thumbnail_url;
		}

		return $schema;
	}

	/**
	 * Register REST API routes for headless structured data.
	 */
	public static function register_rest_routes(): void {
		register_rest_route(
			'chronos/v1',
			'/seo/product/(?P<id>\d+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( self::class, 'rest_product_schema' ),
					'permission_callback' => '__return_true',
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);

		register_rest_route(
			'chronos/v1',
			'/seo/organization',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( self::class, 'rest_organization_schema' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * REST callback: Product structured data.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function rest_product_schema( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$post = get_post( (int) $request->get_param( 'id' ) );

		if ( ! $post || 'chronos_watch' !== $post->post_type ) {
			return new \WP_Error( 'not_found', __( 'Watch not found.', 'chronos-bridge' ), array( 'status' => 404 ) );
		}

		return new \WP_REST_Response( self::build_product_schema( $post ), 200 );
	}

	/**
	 * REST callback: Organization structured data.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return \WP_REST_Response
	 */
	public static function rest_organization_schema( \WP_REST_Request $request ): \WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by REST API.
		return new \WP_REST_Response(
			array(
				'@context'    => 'https://schema.org',
				'@type'       => 'Organization',
				'name'        => get_bloginfo( 'name' ),
				'url'         => home_url( '/' ),
				'description' => get_bloginfo( 'description' ),
			),
			200
		);
	}

	/**
	 * Output a JSON-LD script tag.
	 *
	 * @param array<string, mixed> $data Schema data.
	 */
	private static function output_json_ld( array $data ): void {
		echo '<script type="application/ld+json">';
		echo wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
		echo '</script>' . "\n";
	}
}
