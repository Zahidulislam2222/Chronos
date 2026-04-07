<?php
/**
 * WordPress Settings API integration for Chronos plugin options.
 *
 * @package ChronosBridge\Admin
 */

declare(strict_types=1);

namespace ChronosBridge\Admin;

use ChronosBridge\Security\Sanitizer;

/**
 * Handles WordPress Settings API registration and rendering.
 */
final class Settings {

	private const OPTION_GROUP = 'chronos_settings';
	private const PAGE_SLUG    = 'chronos-settings';

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'admin_init', array( self::class, 'register_settings' ) );
	}

	/**
	 * Register all settings, sections, and fields.
	 */
	public static function register_settings(): void {
		// Contact settings section.
		add_settings_section(
			'chronos_contact_section',
			__( 'Contact Form Settings', 'chronos-bridge' ),
			static function (): void {
				echo '<p>' . esc_html__( 'Configure how the contact form behaves.', 'chronos-bridge' ) . '</p>';
			},
			self::PAGE_SLUG
		);

		self::add_field(
			'chronos_contact_email',
			__( 'Recipient Email', 'chronos-bridge' ),
			'email',
			'chronos_contact_section',
			get_option( 'admin_email' ),
			__( 'Email address to receive contact form submissions.', 'chronos-bridge' )
		);

		self::add_field(
			'chronos_enable_rate_limiting',
			__( 'Enable Rate Limiting', 'chronos-bridge' ),
			'checkbox',
			'chronos_contact_section',
			'1'
		);

		self::add_field(
			'chronos_rate_limit_max',
			__( 'Rate Limit (per hour)', 'chronos-bridge' ),
			'number',
			'chronos_contact_section',
			'5',
			__( 'Maximum submissions per IP per hour.', 'chronos-bridge' )
		);

		self::add_field(
			'chronos_enable_email_notifications',
			__( 'Email Notifications', 'chronos-bridge' ),
			'checkbox',
			'chronos_contact_section',
			'1',
			__( 'Send email when a new contact submission arrives.', 'chronos-bridge' )
		);

		// Stripe payment section.
		add_settings_section(
			'chronos_stripe_section',
			__( 'Stripe Payment Settings', 'chronos-bridge' ),
			static function (): void {
				echo '<p>' . esc_html__( 'Configure Stripe API keys for payment processing. Use test keys (sk_test_ / pk_test_) during development.', 'chronos-bridge' ) . '</p>';
			},
			self::PAGE_SLUG
		);

		self::add_field(
			'chronos_stripe_publishable_key',
			__( 'Publishable Key', 'chronos-bridge' ),
			'text',
			'chronos_stripe_section',
			'',
			__( 'Starts with pk_test_ (test) or pk_live_ (production).', 'chronos-bridge' )
		);

		self::add_field(
			'chronos_stripe_secret_key',
			__( 'Secret Key', 'chronos-bridge' ),
			'password',
			'chronos_stripe_section',
			'',
			__( 'Starts with sk_test_ (test) or sk_live_ (production). Never share this key.', 'chronos-bridge' )
		);

		self::add_field(
			'chronos_stripe_webhook_secret',
			__( 'Webhook Secret', 'chronos-bridge' ),
			'password',
			'chronos_stripe_section',
			'',
			__( 'Starts with whsec_. Found in Stripe Dashboard > Developers > Webhooks.', 'chronos-bridge' )
		);

		// Analytics section.
		add_settings_section(
			'chronos_analytics_section',
			__( 'Analytics & Tracking', 'chronos-bridge' ),
			static function (): void {
				echo '<p>' . esc_html__( 'Configure analytics integrations.', 'chronos-bridge' ) . '</p>';
			},
			self::PAGE_SLUG
		);

		self::add_field(
			'chronos_ga_tracking_id',
			__( 'Google Analytics ID', 'chronos-bridge' ),
			'text',
			'chronos_analytics_section',
			'',
			__( 'e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X', 'chronos-bridge' )
		);
	}

	/**
	 * Register a single settings field.
	 *
	 * @param string $option_name Option name for the setting.
	 * @param string $label       Display label for the field.
	 * @param string $type        Input type (text, email, number, checkbox).
	 * @param string $section     Settings section ID.
	 * @param string $default     Default value for the option.
	 * @param string $description Help text displayed below the field.
	 */
	private static function add_field(
		string $option_name,
		string $label,
		string $type,
		string $section,
		string $default = '',
		string $description = '',
	): void {
		register_setting(
			self::OPTION_GROUP,
			$option_name,
			array(
				'type'              => match ( $type ) {
					'number'   => 'integer',
					'checkbox' => 'string',
					'password' => 'string',
					default    => 'string',
				},
				'sanitize_callback' => match ( $type ) {
					'email'    => 'sanitize_email',
					'number'   => 'absint',
					'checkbox' => static fn( mixed $val ): string => $val ? '1' : '0',
					'password' => 'sanitize_text_field',
					default    => 'sanitize_text_field',
				},
				'default'           => $default,
			)
		);

		add_settings_field(
			$option_name,
			$label,
			static function () use ( $option_name, $type, $default, $description ): void {
				$value = get_option( $option_name, $default );

				match ( $type ) {
					'checkbox' => printf(
						'<input type="checkbox" id="%1$s" name="%1$s" value="1" %2$s />',
						esc_attr( $option_name ),
						checked( $value, '1', false )
					),
					'number'   => printf(
						'<input type="number" id="%1$s" name="%1$s" value="%2$s" class="small-text" min="1" />',
						esc_attr( $option_name ),
						esc_attr( (string) $value )
					),
					default    => printf(
						'<input type="%1$s" id="%2$s" name="%2$s" value="%3$s" class="regular-text" />',
						esc_attr( $type ),
						esc_attr( $option_name ),
						esc_attr( (string) $value )
					),
				};

				if ( '' !== $description ) {
					printf( '<p class="description">%s</p>', esc_html( $description ) );
				}
			},
			self::PAGE_SLUG,
			$section,
			array( 'label_for' => $option_name )
		);
	}

	/**
	 * Render the main settings page.
	 */
	public static function render_settings_page(): void {
		Sanitizer::require_capability();

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Chronos Settings', 'chronos-bridge' ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Plugin Information', 'chronos-bridge' ); ?></h2>
			<table class="form-table">
				<tr>
					<th><?php esc_html_e( 'Version', 'chronos-bridge' ); ?></th>
					<td><?php echo esc_html( CHRONOS_BRIDGE_VERSION ); ?></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'PHP Version', 'chronos-bridge' ); ?></th>
					<td><?php echo esc_html( PHP_VERSION ); ?></td>
				</tr>
				<tr>
					<th><?php esc_html_e( 'REST API', 'chronos-bridge' ); ?></th>
					<td><code><?php echo esc_html( rest_url( 'chronos/v1/' ) ); ?></code></td>
				</tr>
			</table>
		</div>
		<?php
	}
}
