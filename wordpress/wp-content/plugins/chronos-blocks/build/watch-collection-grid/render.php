<?php
/**
 * Server-side render for the Watch Collection Grid block.
 *
 * @package ChronosBlocks
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$columns    = max( 1, min( 6, absint( $attributes['columns'] ?? 3 ) ) );
$per_page   = max( 1, min( 24, absint( $attributes['perPage'] ?? 6 ) ) );
$brand      = sanitize_text_field( $attributes['brand'] ?? '' );
$movement   = sanitize_text_field( $attributes['movement'] ?? '' );
$orderby    = in_array( $attributes['orderby'] ?? 'date', array( 'date', 'title', 'price' ), true )
	? $attributes['orderby']
	: 'date';
$order      = in_array( $attributes['order'] ?? 'DESC', array( 'ASC', 'DESC' ), true )
	? $attributes['order']
	: 'DESC';
$show_price = (bool) ( $attributes['showPrice'] ?? true );
$show_brand = (bool) ( $attributes['showBrand'] ?? true );

$query_args = array(
	'post_type'      => 'chronos_watch',
	'post_status'    => 'publish',
	'posts_per_page' => $per_page,
	'orderby'        => 'price' === $orderby ? 'meta_value_num' : $orderby,
	'order'          => $order,
);

if ( 'price' === $orderby ) {
	$query_args['meta_key'] = '_chronos_price';
}

$tax_query = array();

if ( ! empty( $brand ) ) {
	$tax_query[] = array(
		'taxonomy' => 'chronos_brand',
		'field'    => 'slug',
		'terms'    => $brand,
	);
}

if ( ! empty( $movement ) ) {
	$tax_query[] = array(
		'taxonomy' => 'chronos_movement',
		'field'    => 'slug',
		'terms'    => $movement,
	);
}

if ( ! empty( $tax_query ) ) {
	$query_args['tax_query'] = $tax_query;
}

$query = new WP_Query( $query_args );

if ( ! $query->have_posts() ) {
	return;
}

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => 'chronos-watch-grid' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes(). ?>>
	<div class="chronos-watch-grid__items" style="grid-template-columns: repeat(<?php echo absint( $columns ); ?>, 1fr);">
		<?php while ( $query->have_posts() ) : ?>
			<?php
			$query->the_post();
			$thumbnail_id  = get_post_thumbnail_id();
			$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( (int) $thumbnail_id, 'medium_large' ) : '';
			$brands        = wp_get_post_terms( get_the_ID(), 'chronos_brand', array( 'fields' => 'names' ) );
			$price         = (int) get_post_meta( get_the_ID(), '_chronos_price', true );
			?>
			<div class="chronos-watch-grid__item">
				<div class="chronos-watch-grid__image">
					<?php if ( $thumbnail_url ) : ?>
						<img src="<?php echo esc_url( $thumbnail_url ); ?>" alt="<?php the_title_attribute(); ?>" loading="lazy" />
					<?php else : ?>
						<div class="chronos-watch-grid__placeholder">
							<span class="dashicons dashicons-format-image"></span>
						</div>
					<?php endif; ?>
				</div>
				<div class="chronos-watch-grid__info">
					<?php if ( $show_brand && is_array( $brands ) && ! empty( $brands ) ) : ?>
						<span class="chronos-watch-grid__brand"><?php echo esc_html( $brands[0] ); ?></span>
					<?php endif; ?>
					<h4 class="chronos-watch-grid__title"><?php the_title(); ?></h4>
					<?php if ( $show_price && $price > 0 ) : ?>
						<span class="chronos-watch-grid__price">$<?php echo esc_html( number_format( $price ) ); ?></span>
					<?php endif; ?>
				</div>
			</div>
		<?php endwhile; ?>
		<?php wp_reset_postdata(); ?>
	</div>
</div>
