<?php
/**
 * REST endpoint: GET /wp-json/chronos/v1/watches
 *
 * @package ChronosBridge\Api
 */

declare(strict_types=1);

namespace ChronosBridge\Api;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;
use WP_Query;
use ChronosBridge\PostTypes\WatchCollection;
use ChronosBridge\PostTypes\Taxonomy;
use ChronosBridge\Cache\TransientCache;

/**
 * REST endpoint for watch collection data.
 */
final class WatchEndpoint extends RestController {

	/**
	 * Register routes.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/watches',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'list_watches' ),
					'permission_callback' => array( $this, 'permission_public' ),
					'args'                => $this->get_list_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/watches/(?P<id>\d+)',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_watch' ),
					'permission_callback' => array( $this, 'permission_public' ),
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
	}

	/**
	 * GET /watches — list with pagination and filtering.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response
	 */
	public function list_watches( WP_REST_Request $request ): WP_REST_Response {
		$page     = (int) $request->get_param( 'page' );
		$per_page = (int) $request->get_param( 'per_page' );
		$brand    = $request->get_param( 'brand' );
		$movement = $request->get_param( 'movement' );
		$orderby  = $request->get_param( 'orderby' );
		$order    = strtoupper( $request->get_param( 'order' ) );

		$cache_key = sprintf( 'watches_%s_%d_%d_%s_%s_%s', ! empty( $brand ) ? $brand : 'all', $page, $per_page, ! empty( $movement ) ? $movement : 'all', $orderby, $order );

		$result = TransientCache::remember(
			$cache_key,
			function () use ( $page, $per_page, $brand, $movement, $orderby, $order ): array {
				$query_args = array(
					'post_type'      => WatchCollection::POST_TYPE,
					'post_status'    => 'publish',
					'posts_per_page' => $per_page,
					'paged'          => $page,
					'orderby'        => 'price' === $orderby ? 'meta_value_num' : $orderby,
					'order'          => $order,
				);

				if ( 'price' === $orderby ) {
					$query_args['meta_key'] = '_chronos_price';
				}

				$tax_query = array();

				if ( ! empty( $brand ) ) {
					$tax_query[] = array(
						'taxonomy' => Taxonomy::BRAND,
						'field'    => 'slug',
						'terms'    => $brand,
					);
				}

				if ( ! empty( $movement ) ) {
					$tax_query[] = array(
						'taxonomy' => Taxonomy::MOVEMENT,
						'field'    => 'slug',
						'terms'    => $movement,
					);
				}

				if ( ! empty( $tax_query ) ) {
					$query_args['tax_query'] = $tax_query;
				}

				$query   = new WP_Query( $query_args );
				$watches = array_map( array( $this, 'format_watch' ), $query->posts );

				return array(
					'items'       => $watches,
					'total'       => $query->found_posts,
					'total_pages' => $query->max_num_pages,
					'page'        => $page,
					'per_page'    => $per_page,
				);
			},
			15 * MINUTE_IN_SECONDS
		);

		return $this->success( $result );
	}

	/**
	 * GET /watches/{id} — get a single watch.
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_watch( WP_REST_Request $request ): WP_REST_Response|WP_Error {
		$post = get_post( (int) $request->get_param( 'id' ) );

		if ( ! $post || WatchCollection::POST_TYPE !== $post->post_type || 'publish' !== $post->post_status ) {
			return $this->error(
				__( 'Watch not found.', 'chronos-bridge' ),
				'not_found',
				404
			);
		}

		return $this->success( $this->format_watch( $post ) );
	}

	/**
	 * Format a watch post for API response.
	 *
	 * @param \WP_Post $post The watch post object.
	 * @return array<string, mixed>
	 */
	private function format_watch( \WP_Post $post ): array {
		$thumbnail_id  = get_post_thumbnail_id( $post->ID );
		$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( (int) $thumbnail_id, 'large' ) : null;

		$brands    = wp_get_post_terms( $post->ID, Taxonomy::BRAND, array( 'fields' => 'names' ) );
		$movements = wp_get_post_terms( $post->ID, Taxonomy::MOVEMENT, array( 'fields' => 'names' ) );

		return array(
			'id'               => $post->ID,
			'title'            => get_the_title( $post ),
			'slug'             => $post->post_name,
			'excerpt'          => get_the_excerpt( $post ),
			'content'          => apply_filters( 'the_content', $post->post_content ), // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core WP filter.
			'image'            => $thumbnail_url,
			'brands'           => is_array( $brands ) ? $brands : array(),
			'movements'        => is_array( $movements ) ? $movements : array(),
			'reference'        => get_post_meta( $post->ID, '_chronos_reference', true ),
			'price'            => (int) get_post_meta( $post->ID, '_chronos_price', true ),
			'case_diameter'    => (int) get_post_meta( $post->ID, '_chronos_case_diameter', true ),
			'case_material'    => get_post_meta( $post->ID, '_chronos_case_material', true ),
			'water_resistance' => (int) get_post_meta( $post->ID, '_chronos_water_resistance', true ),
			'year'             => (int) get_post_meta( $post->ID, '_chronos_year', true ),
			'condition'        => get_post_meta( $post->ID, '_chronos_condition', true ),
			'stock_status'     => get_post_meta( $post->ID, '_chronos_stock_status', true ),
			'date_created'     => get_the_date( 'c', $post ),
			'date_modified'    => get_the_modified_date( 'c', $post ),
		);
	}

	/**
	 * Argument schema for the list endpoint.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function get_list_args(): array {
		return array(
			'page'     => array(
				'type'              => 'integer',
				'default'           => 1,
				'minimum'           => 1,
				'sanitize_callback' => 'absint',
			),
			'per_page' => array(
				'type'              => 'integer',
				'default'           => 12,
				'minimum'           => 1,
				'maximum'           => 100,
				'sanitize_callback' => 'absint',
			),
			'brand'    => array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'movement' => array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'orderby'  => array(
				'type'    => 'string',
				'default' => 'date',
				'enum'    => array( 'date', 'title', 'price' ),
			),
			'order'    => array(
				'type'    => 'string',
				'default' => 'DESC',
				'enum'    => array( 'ASC', 'DESC' ),
			),
		);
	}
}
