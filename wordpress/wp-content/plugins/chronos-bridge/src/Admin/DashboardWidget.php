<?php
/**
 * Admin dashboard widget showing Chronos stats at a glance.
 *
 * @package ChronosBridge\Admin
 */

declare(strict_types=1);

namespace ChronosBridge\Admin;

use ChronosBridge\Database\ContactTable;

/**
 * Adds a dashboard widget with watch and contact statistics.
 */
final class DashboardWidget {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'wp_dashboard_setup', array( self::class, 'add_widget' ) );
	}

	/**
	 * Register the dashboard widget.
	 */
	public static function add_widget(): void {
		wp_add_dashboard_widget(
			'chronos_stats_widget',
			__( 'Chronos at a Glance', 'chronos-bridge' ),
			array( self::class, 'render_widget' )
		);
	}

	/**
	 * Render the dashboard widget.
	 */
	public static function render_widget(): void {
		$watch_count    = wp_count_posts( 'chronos_watch' );
		$contact_count  = ContactTable::count_by_status();
		$published      = (int) ( $watch_count->publish ?? 0 );
		$drafts         = (int) ( $watch_count->draft ?? 0 );
		$new_contacts   = $contact_count['new'] ?? 0;
		$total_contacts = array_sum( $contact_count );

		$brand_count = wp_count_terms( array( 'taxonomy' => 'chronos_brand' ) );
		$brand_count = is_wp_error( $brand_count ) ? 0 : (int) $brand_count;

		$ai_available = class_exists( 'ChronosBridge\AI\DescriptionGenerator' )
			&& \ChronosBridge\AI\DescriptionGenerator::is_available();
		?>
		<div class="chronos-dashboard-widget">
			<style>
				.chronos-dashboard-widget .chronos-stats {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 12px;
					margin-bottom: 12px;
				}
				.chronos-dashboard-widget .chronos-stat {
					text-align: center;
					padding: 12px 8px;
					background: #f6f7f7;
					border-radius: 4px;
				}
				.chronos-dashboard-widget .chronos-stat-number {
					font-size: 1.8em;
					font-weight: 600;
					display: block;
					line-height: 1.2;
				}
				.chronos-dashboard-widget .chronos-stat-label {
					font-size: 12px;
					color: #646970;
					display: block;
				}
				.chronos-dashboard-widget .chronos-links {
					margin: 0;
					padding: 0;
					list-style: none;
				}
				.chronos-dashboard-widget .chronos-links li {
					padding: 4px 0;
				}
			</style>

			<div class="chronos-stats">
				<div class="chronos-stat">
					<span class="chronos-stat-number"><?php echo esc_html( (string) $published ); ?></span>
					<span class="chronos-stat-label"><?php esc_html_e( 'Published Watches', 'chronos-bridge' ); ?></span>
				</div>
				<div class="chronos-stat">
					<span class="chronos-stat-number"><?php echo esc_html( (string) $drafts ); ?></span>
					<span class="chronos-stat-label"><?php esc_html_e( 'Draft Watches', 'chronos-bridge' ); ?></span>
				</div>
				<div class="chronos-stat">
					<span class="chronos-stat-number"><?php echo esc_html( (string) $new_contacts ); ?></span>
					<span class="chronos-stat-label"><?php esc_html_e( 'New Contacts', 'chronos-bridge' ); ?></span>
				</div>
				<div class="chronos-stat">
					<span class="chronos-stat-number"><?php echo esc_html( (string) $brand_count ); ?></span>
					<span class="chronos-stat-label"><?php esc_html_e( 'Brands', 'chronos-bridge' ); ?></span>
				</div>
			</div>

			<ul class="chronos-links">
				<li>
					<a href="<?php echo esc_url( admin_url( 'edit.php?post_type=chronos_watch' ) ); ?>">
						<?php esc_html_e( 'Manage Watches', 'chronos-bridge' ); ?>
					</a>
					(<?php echo esc_html( (string) ( $published + $drafts ) ); ?>)
				</li>
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=chronos-contacts' ) ); ?>">
						<?php esc_html_e( 'Contact Submissions', 'chronos-bridge' ); ?>
					</a>
					(<?php echo esc_html( (string) $total_contacts ); ?>)
				</li>
				<li>
					<a href="<?php echo esc_url( admin_url( 'admin.php?page=chronos-settings' ) ); ?>">
						<?php esc_html_e( 'Chronos Settings', 'chronos-bridge' ); ?>
					</a>
				</li>
				<li>
					<?php esc_html_e( 'AI Features:', 'chronos-bridge' ); ?>
					<?php if ( $ai_available ) : ?>
						<span style="color: #00a32a;">&#10003; <?php esc_html_e( 'Active', 'chronos-bridge' ); ?></span>
					<?php else : ?>
						<span style="color: #996800;"><?php esc_html_e( 'Requires WP 7.0 + AI Provider', 'chronos-bridge' ); ?></span>
					<?php endif; ?>
				</li>
			</ul>
		</div>
		<?php
	}
}
