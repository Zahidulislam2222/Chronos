<?php
/**
 * Custom taxonomies: Brand and Movement Type.
 *
 * @package ChronosBridge\PostTypes
 */

declare(strict_types=1);

namespace ChronosBridge\PostTypes;

/**
 * Registers Brand and Movement Type custom taxonomies.
 */
final class Taxonomy {

	public const BRAND    = 'chronos_brand';
	public const MOVEMENT = 'chronos_movement';

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'init', array( self::class, 'register_taxonomies' ) );
	}

	/**
	 * Register both taxonomies.
	 */
	public static function register_taxonomies(): void {
		self::register_brand_taxonomy();
		self::register_movement_taxonomy();
	}

	/**
	 * Register chronos_brand taxonomy (hierarchical — like categories).
	 */
	private static function register_brand_taxonomy(): void {
		$labels = array(
			'name'              => __( 'Brands', 'chronos-bridge' ),
			'singular_name'     => __( 'Brand', 'chronos-bridge' ),
			'search_items'      => __( 'Search Brands', 'chronos-bridge' ),
			'all_items'         => __( 'All Brands', 'chronos-bridge' ),
			'parent_item'       => __( 'Parent Brand', 'chronos-bridge' ),
			'parent_item_colon' => __( 'Parent Brand:', 'chronos-bridge' ),
			'edit_item'         => __( 'Edit Brand', 'chronos-bridge' ),
			'update_item'       => __( 'Update Brand', 'chronos-bridge' ),
			'add_new_item'      => __( 'Add New Brand', 'chronos-bridge' ),
			'new_item_name'     => __( 'New Brand Name', 'chronos-bridge' ),
			'menu_name'         => __( 'Brands', 'chronos-bridge' ),
		);

		register_taxonomy(
			self::BRAND,
			WatchCollection::POST_TYPE,
			array(
				'labels'              => $labels,
				'hierarchical'        => true,
				'public'              => true,
				'show_ui'             => true,
				'show_admin_column'   => true,
				'show_in_rest'        => true,
				'rewrite'             => array( 'slug' => 'brand' ),
				'show_in_graphql'     => true,
				'graphql_single_name' => 'chronosBrand',
				'graphql_plural_name' => 'chronosBrands',
			)
		);
	}

	/**
	 * Register chronos_movement taxonomy (non-hierarchical — like tags).
	 */
	private static function register_movement_taxonomy(): void {
		$labels = array(
			'name'                       => __( 'Movement Types', 'chronos-bridge' ),
			'singular_name'              => __( 'Movement Type', 'chronos-bridge' ),
			'search_items'               => __( 'Search Movement Types', 'chronos-bridge' ),
			'popular_items'              => __( 'Popular Movement Types', 'chronos-bridge' ),
			'all_items'                  => __( 'All Movement Types', 'chronos-bridge' ),
			'edit_item'                  => __( 'Edit Movement Type', 'chronos-bridge' ),
			'update_item'                => __( 'Update Movement Type', 'chronos-bridge' ),
			'add_new_item'               => __( 'Add New Movement Type', 'chronos-bridge' ),
			'new_item_name'              => __( 'New Movement Type Name', 'chronos-bridge' ),
			'separate_items_with_commas' => __( 'Separate movement types with commas', 'chronos-bridge' ),
			'add_or_remove_items'        => __( 'Add or remove movement types', 'chronos-bridge' ),
			'choose_from_most_used'      => __( 'Choose from most used movement types', 'chronos-bridge' ),
			'menu_name'                  => __( 'Movement Types', 'chronos-bridge' ),
		);

		register_taxonomy(
			self::MOVEMENT,
			WatchCollection::POST_TYPE,
			array(
				'labels'              => $labels,
				'hierarchical'        => false,
				'public'              => true,
				'show_ui'             => true,
				'show_admin_column'   => true,
				'show_in_rest'        => true,
				'rewrite'             => array( 'slug' => 'movement' ),
				'show_in_graphql'     => true,
				'graphql_single_name' => 'chronosMovement',
				'graphql_plural_name' => 'chronosMovements',
			)
		);
	}
}
