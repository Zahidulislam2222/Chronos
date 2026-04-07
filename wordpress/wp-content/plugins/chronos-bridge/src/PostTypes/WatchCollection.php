<?php
/**
 * Custom Post Type: chronos_watch (Watch Collection).
 *
 * @package ChronosBridge\PostTypes
 */

declare(strict_types=1);

namespace ChronosBridge\PostTypes;

/**
 * Registers and manages the Watch Collection custom post type.
 */
final class WatchCollection {

	public const POST_TYPE = 'chronos_watch';

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'init', array( self::class, 'register_post_type' ) );
		add_action( 'add_meta_boxes', array( self::class, 'add_meta_boxes' ) );
		add_action( 'save_post_' . self::POST_TYPE, array( self::class, 'save_meta' ), 10, 2 );
		add_filter( 'manage_' . self::POST_TYPE . '_posts_columns', array( self::class, 'admin_columns' ) );
		add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( self::class, 'render_admin_column' ), 10, 2 );
	}

	/**
	 * Register the chronos_watch post type.
	 */
	public static function register_post_type(): void {
		$labels = array(
			'name'               => __( 'Watches', 'chronos-bridge' ),
			'singular_name'      => __( 'Watch', 'chronos-bridge' ),
			'menu_name'          => __( 'Watch Collection', 'chronos-bridge' ),
			'add_new'            => __( 'Add New Watch', 'chronos-bridge' ),
			'add_new_item'       => __( 'Add New Watch', 'chronos-bridge' ),
			'edit_item'          => __( 'Edit Watch', 'chronos-bridge' ),
			'new_item'           => __( 'New Watch', 'chronos-bridge' ),
			'view_item'          => __( 'View Watch', 'chronos-bridge' ),
			'search_items'       => __( 'Search Watches', 'chronos-bridge' ),
			'not_found'          => __( 'No watches found', 'chronos-bridge' ),
			'not_found_in_trash' => __( 'No watches found in Trash', 'chronos-bridge' ),
			'all_items'          => __( 'All Watches', 'chronos-bridge' ),
		);

		$args = array(
			'labels'              => $labels,
			'public'              => true,
			'publicly_queryable'  => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => true,
			'menu_position'       => 5,
			'menu_icon'           => 'dashicons-clock',
			'capability_type'     => 'post',
			'has_archive'         => true,
			'hierarchical'        => false,
			'rewrite'             => array( 'slug' => 'watches' ),
			'supports'            => array( 'title', 'editor', 'thumbnail', 'custom-fields', 'excerpt' ),
			'show_in_graphql'     => true,
			'graphql_single_name' => 'chronosWatch',
			'graphql_plural_name' => 'chronosWatches',
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Add meta boxes for watch-specific data.
	 */
	public static function add_meta_boxes(): void {
		add_meta_box(
			'chronos_watch_details',
			__( 'Watch Specifications', 'chronos-bridge' ),
			array( self::class, 'render_meta_box' ),
			self::POST_TYPE,
			'normal',
			'high'
		);
	}

	/**
	 * Render the watch specifications meta box.
	 *
	 * @param \WP_Post $post The current post object.
	 */
	public static function render_meta_box( \WP_Post $post ): void {
		wp_nonce_field( 'chronos_watch_meta', '_chronos_watch_nonce' );

		$fields = self::get_meta_fields();

		echo '<table class="form-table">';

		foreach ( $fields as $key => $field ) {
			$value = get_post_meta( $post->ID, $key, true );
			printf(
				'<tr><th><label for="%1$s">%2$s</label></th><td>',
				esc_attr( $key ),
				esc_html( $field['label'] )
			);

			match ( $field['type'] ) {
				'select' => self::render_select_field( $key, $value, $field['options'] ),
				default  => printf(
					'<input type="%1$s" id="%2$s" name="%2$s" value="%3$s" class="regular-text" />',
					esc_attr( $field['type'] ),
					esc_attr( $key ),
					esc_attr( (string) $value )
				),
			};

			if ( ! empty( $field['description'] ) ) {
				printf( '<p class="description">%s</p>', esc_html( $field['description'] ) );
			}

			echo '</td></tr>';
		}

		echo '</table>';
	}

	/**
	 * Save meta box data.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 */
	public static function save_meta( int $post_id, \WP_Post $post ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by WordPress hook signature.
		if ( ! isset( $_POST['_chronos_watch_nonce'] ) ) {
			return;
		}

		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_chronos_watch_nonce'] ) ), 'chronos_watch_meta' ) ) {
			return;
		}

		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$fields = self::get_meta_fields();

		foreach ( $fields as $key => $field ) {
			if ( ! isset( $_POST[ $key ] ) ) {
				continue;
			}

			$value = match ( $field['type'] ) {
				'number' => absint( $_POST[ $key ] ),
				'select' => sanitize_text_field( wp_unslash( $_POST[ $key ] ) ),
				default  => sanitize_text_field( wp_unslash( $_POST[ $key ] ) ),
			};

			update_post_meta( $post_id, $key, $value );
		}
	}

	/**
	 * Define custom admin columns.
	 *
	 * @param array<string, string> $columns Existing columns.
	 * @return array<string, string>
	 */
	public static function admin_columns( array $columns ): array {
		$new_columns = array();

		foreach ( $columns as $key => $label ) {
			$new_columns[ $key ] = $label;

			if ( 'title' === $key ) {
				$new_columns['chronos_brand']    = __( 'Brand', 'chronos-bridge' );
				$new_columns['chronos_movement'] = __( 'Movement', 'chronos-bridge' );
				$new_columns['chronos_price']    = __( 'Price', 'chronos-bridge' );
				$new_columns['chronos_stock']    = __( 'Stock', 'chronos-bridge' );
			}
		}

		return $new_columns;
	}

	/**
	 * Render custom admin column content.
	 *
	 * @param string $column  Column name.
	 * @param int    $post_id The post ID.
	 */
	public static function render_admin_column( string $column, int $post_id ): void {
		$price_val = get_post_meta( $post_id, '_chronos_price', true );
		$stock_val = get_post_meta( $post_id, '_chronos_stock_status', true );

		match ( $column ) {
			'chronos_brand'    => self::render_taxonomy_column( $post_id, Taxonomy::BRAND ),
			'chronos_movement' => self::render_taxonomy_column( $post_id, Taxonomy::MOVEMENT ),
			'chronos_price'    => printf( '$%s', esc_html( ! empty( $price_val ) ? $price_val : '—' ) ),
			'chronos_stock'    => printf(
				'<span class="dashicons dashicons-%s" title="%s"></span>',
				'in_stock' === $stock_val ? 'yes-alt' : 'dismiss',
				esc_attr( ! empty( $stock_val ) ? $stock_val : 'unknown' )
			),
			default            => null,
		};
	}

	/**
	 * Get watch meta field definitions.
	 *
	 * @return array<string, array{label: string, type: string, description?: string, options?: array<string, string>}>
	 */
	private static function get_meta_fields(): array {
		return array(
			'_chronos_reference'        => array(
				'label'       => __( 'Reference Number', 'chronos-bridge' ),
				'type'        => 'text',
				'description' => __( 'e.g., 126610LN', 'chronos-bridge' ),
			),
			'_chronos_price'            => array(
				'label' => __( 'Price (USD)', 'chronos-bridge' ),
				'type'  => 'number',
			),
			'_chronos_case_diameter'    => array(
				'label'       => __( 'Case Diameter (mm)', 'chronos-bridge' ),
				'type'        => 'number',
				'description' => __( 'e.g., 41', 'chronos-bridge' ),
			),
			'_chronos_case_material'    => array(
				'label' => __( 'Case Material', 'chronos-bridge' ),
				'type'  => 'text',
			),
			'_chronos_water_resistance' => array(
				'label'       => __( 'Water Resistance (meters)', 'chronos-bridge' ),
				'type'        => 'number',
				'description' => __( 'e.g., 300', 'chronos-bridge' ),
			),
			'_chronos_year'             => array(
				'label' => __( 'Year', 'chronos-bridge' ),
				'type'  => 'number',
			),
			'_chronos_condition'        => array(
				'label'   => __( 'Condition', 'chronos-bridge' ),
				'type'    => 'select',
				'options' => array(
					''          => __( '— Select —', 'chronos-bridge' ),
					'new'       => __( 'New / Unworn', 'chronos-bridge' ),
					'excellent' => __( 'Excellent', 'chronos-bridge' ),
					'very_good' => __( 'Very Good', 'chronos-bridge' ),
					'good'      => __( 'Good', 'chronos-bridge' ),
					'fair'      => __( 'Fair', 'chronos-bridge' ),
				),
			),
			'_chronos_stock_status'     => array(
				'label'   => __( 'Stock Status', 'chronos-bridge' ),
				'type'    => 'select',
				'options' => array(
					'in_stock'     => __( 'In Stock', 'chronos-bridge' ),
					'out_of_stock' => __( 'Out of Stock', 'chronos-bridge' ),
					'on_order'     => __( 'On Order', 'chronos-bridge' ),
				),
			),
		);
	}

	/**
	 * Render a select field in the meta box.
	 *
	 * @param string                $key     Field key/name.
	 * @param string                $value   Current selected value.
	 * @param array<string, string> $options Available options.
	 */
	private static function render_select_field( string $key, string $value, array $options ): void {
		printf( '<select id="%1$s" name="%1$s">', esc_attr( $key ) );
		foreach ( $options as $opt_value => $opt_label ) {
			printf(
				'<option value="%s" %s>%s</option>',
				esc_attr( $opt_value ),
				selected( $value, $opt_value, false ),
				esc_html( $opt_label )
			);
		}
		echo '</select>';
	}

	/**
	 * Render taxonomy terms for an admin column.
	 *
	 * @param int    $post_id  The post ID.
	 * @param string $taxonomy Taxonomy name.
	 */
	private static function render_taxonomy_column( int $post_id, string $taxonomy ): void {
		$terms = get_the_terms( $post_id, $taxonomy );
		if ( is_array( $terms ) ) {
			echo esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) );
		} else {
			echo '—';
		}
	}
}
