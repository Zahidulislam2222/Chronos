<?php
/**
 * Server-side render for the Watch Showcase block.
 *
 * @package ChronosBlocks
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content (empty for dynamic blocks).
 * @var WP_Block $block      Block instance.
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$watch_id    = absint( $attributes['watchId'] ?? 0 );
$show_price  = (bool) ( $attributes['showPrice'] ?? true );
$show_excerpt = (bool) ( $attributes['showExcerpt'] ?? true );
$cta_text    = sanitize_text_field( $attributes['ctaText'] ?? __( 'View Details', 'chronos-blocks' ) );
$cta_url     = esc_url( $attributes['ctaUrl'] ?? '' );
$layout      = in_array( $attributes['layout'] ?? 'horizontal', array( 'horizontal', 'vertical' ), true )
	? $attributes['layout']
	: 'horizontal';

if ( 0 === $watch_id ) {
	return;
}

$post = get_post( $watch_id );

if ( ! $post || 'chronos_watch' !== $post->post_type || 'publish' !== $post->post_status ) {
	return;
}

$thumbnail_id  = get_post_thumbnail_id( $post->ID );
$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( (int) $thumbnail_id, 'large' ) : '';
$brands        = wp_get_post_terms( $post->ID, 'chronos_brand', array( 'fields' => 'names' ) );
$brand_names   = is_array( $brands ) ? implode( ', ', $brands ) : '';
$price         = (int) get_post_meta( $post->ID, '_chronos_price', true );
$permalink     = ! empty( $cta_url ) ? $cta_url : get_permalink( $post );

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => "chronos-watch-showcase layout-{$layout}" )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes(). ?>>
	<div class="chronos-watch-showcase__inner">
		<div class="chronos-watch-showcase__image">
			<?php if ( $thumbnail_url ) : ?>
				<img src="<?php echo esc_url( $thumbnail_url ); ?>" alt="<?php echo esc_attr( get_the_title( $post ) ); ?>" loading="lazy" />
			<?php else : ?>
				<div class="chronos-watch-showcase__placeholder-image">
					<span class="dashicons dashicons-format-image"></span>
				</div>
			<?php endif; ?>
		</div>
		<div class="chronos-watch-showcase__content">
			<h3 class="chronos-watch-showcase__title"><?php echo esc_html( get_the_title( $post ) ); ?></h3>
			<?php if ( ! empty( $brand_names ) ) : ?>
				<p class="chronos-watch-showcase__brand"><?php echo esc_html( $brand_names ); ?></p>
			<?php endif; ?>
			<?php if ( $show_price && $price > 0 ) : ?>
				<p class="chronos-watch-showcase__price">$<?php echo esc_html( number_format( $price ) ); ?></p>
			<?php endif; ?>
			<?php if ( $show_excerpt && has_excerpt( $post ) ) : ?>
				<p class="chronos-watch-showcase__excerpt"><?php echo esc_html( get_the_excerpt( $post ) ); ?></p>
			<?php endif; ?>
			<a href="<?php echo esc_url( $permalink ); ?>" class="chronos-watch-showcase__cta">
				<?php echo esc_html( $cta_text ); ?>
			</a>
		</div>
	</div>
</div>
