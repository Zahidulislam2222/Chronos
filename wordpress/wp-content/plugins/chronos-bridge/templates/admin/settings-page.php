<?php
/**
 * Admin settings page template.
 *
 * This file is loaded by Settings::render_settings_page() as an alternative template approach.
 * Currently, the settings page renders inline in the Settings class.
 * This file serves as documentation for the template structure.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap">
	<h1><?php esc_html_e( 'Chronos Settings', 'chronos-bridge' ); ?></h1>
	<form method="post" action="options.php">
		<?php
		settings_fields( 'chronos_settings' );
		do_settings_sections( 'chronos-settings' );
		submit_button();
		?>
	</form>
</div>
