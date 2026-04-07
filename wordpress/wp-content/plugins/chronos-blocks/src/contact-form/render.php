<?php
/**
 * Server-side render for the Contact Form block.
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

$heading         = sanitize_text_field( $attributes['heading'] ?? '' );
$description     = sanitize_text_field( $attributes['description'] ?? '' );
$submit_text     = sanitize_text_field( $attributes['submitText'] ?? __( 'Send Message', 'chronos-blocks' ) );
$success_message = sanitize_text_field( $attributes['successMessage'] ?? __( 'Thank you for your message.', 'chronos-blocks' ) );
$show_subject    = (bool) ( $attributes['showSubject'] ?? true );

$wrapper_attributes = get_block_wrapper_attributes(
	array( 'class' => 'chronos-contact-form' )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped by get_block_wrapper_attributes(). ?>>
	<?php if ( ! empty( $heading ) ) : ?>
		<h2 class="chronos-contact-form__heading"><?php echo esc_html( $heading ); ?></h2>
	<?php endif; ?>
	<?php if ( ! empty( $description ) ) : ?>
		<p class="chronos-contact-form__description"><?php echo esc_html( $description ); ?></p>
	<?php endif; ?>

	<form class="chronos-contact-form__form" data-success-message="<?php echo esc_attr( $success_message ); ?>" novalidate>
		<div class="chronos-contact-form__fields">
			<div class="chronos-contact-form__row">
				<div class="chronos-contact-form__field">
					<label for="chronos-name"><?php esc_html_e( 'Name', 'chronos-blocks' ); ?> <span aria-hidden="true">*</span></label>
					<input type="text" id="chronos-name" name="name" required aria-required="true" />
				</div>
				<div class="chronos-contact-form__field">
					<label for="chronos-email"><?php esc_html_e( 'Email', 'chronos-blocks' ); ?> <span aria-hidden="true">*</span></label>
					<input type="email" id="chronos-email" name="email" required aria-required="true" />
				</div>
			</div>
			<?php if ( $show_subject ) : ?>
				<div class="chronos-contact-form__field">
					<label for="chronos-subject"><?php esc_html_e( 'Subject', 'chronos-blocks' ); ?></label>
					<input type="text" id="chronos-subject" name="subject" />
				</div>
			<?php endif; ?>
			<div class="chronos-contact-form__field">
				<label for="chronos-message"><?php esc_html_e( 'Message', 'chronos-blocks' ); ?> <span aria-hidden="true">*</span></label>
				<textarea id="chronos-message" name="message" rows="5" required aria-required="true"></textarea>
			</div>
		</div>

		<div class="chronos-contact-form__status" role="alert" aria-live="polite" hidden></div>

		<button type="submit" class="chronos-contact-form__submit">
			<?php echo esc_html( $submit_text ); ?>
		</button>
	</form>
</div>
