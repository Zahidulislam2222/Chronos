<?php
/**
 * Admin menu registration — adds Chronos top-level menu with sub-pages.
 *
 * @package ChronosBridge\Admin
 */

declare(strict_types=1);

namespace ChronosBridge\Admin;

use ChronosBridge\Database\ContactTable;
use ChronosBridge\Database\ContactStatus;
use ChronosBridge\Security\Sanitizer;

/**
 * Handles admin menu registration and rendering.
 */
final class AdminMenu {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'admin_menu', array( self::class, 'add_menus' ) );
	}

	/**
	 * Add the top-level Chronos menu and sub-pages.
	 */
	public static function add_menus(): void {
		// Top-level menu.
		add_menu_page(
			__( 'Chronos', 'chronos-bridge' ),
			__( 'Chronos', 'chronos-bridge' ),
			'manage_options',
			'chronos-settings',
			array( Settings::class, 'render_settings_page' ),
			'dashicons-clock',
			30
		);

		// Settings sub-page (same as top-level).
		add_submenu_page(
			'chronos-settings',
			__( 'Settings', 'chronos-bridge' ),
			__( 'Settings', 'chronos-bridge' ),
			'manage_options',
			'chronos-settings',
			array( Settings::class, 'render_settings_page' )
		);

		// Contact Submissions sub-page.
		add_submenu_page(
			'chronos-settings',
			__( 'Contact Submissions', 'chronos-bridge' ),
			__( 'Contact Submissions', 'chronos-bridge' ),
			'manage_options',
			'chronos-contacts',
			array( self::class, 'render_contacts_page' )
		);

		// Watch Analytics sub-page.
		add_submenu_page(
			'chronos-settings',
			__( 'Watch Analytics', 'chronos-bridge' ),
			__( 'Watch Analytics', 'chronos-bridge' ),
			'manage_options',
			'chronos-analytics',
			array( self::class, 'render_analytics_page' )
		);
	}

	/**
	 * Render the Contact Submissions admin page.
	 */
	public static function render_contacts_page(): void {
		Sanitizer::require_capability();

		// Handle form submissions — verify nonce first via Sanitizer::verify_nonce().
		if ( Sanitizer::verify_nonce( 'chronos_contact_action' ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above via Sanitizer::verify_nonce().
			if ( isset( $_POST['chronos_update_status'], $_POST['submission_id'], $_POST['new_status'] ) ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
				$id = absint( $_POST['submission_id'] );
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
				$status = ContactStatus::tryFrom( sanitize_text_field( wp_unslash( $_POST['new_status'] ) ) );
				if ( null !== $status ) {
					ContactTable::update_status( $id, $status );
				}
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above via Sanitizer::verify_nonce().
			if ( isset( $_POST['chronos_delete_submission'], $_POST['submission_id'] ) ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
				ContactTable::delete( absint( $_POST['submission_id'] ) );
			}
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display filtering only.
		$page = max( 1, absint( $_GET['paged'] ?? 1 ) );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Display filtering only.
		$status = isset( $_GET['status'] ) ? ContactStatus::tryFrom( sanitize_text_field( wp_unslash( $_GET['status'] ) ) ) : null;
		$result = ContactTable::paginate( page: $page, per_page: 20, status: $status );
		$counts = ContactTable::count_by_status();
		$total  = array_sum( $counts );

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Contact Submissions', 'chronos-bridge' ); ?></h1>

			<ul class="subsubsub">
				<li><a href="<?php echo esc_url( admin_url( 'admin.php?page=chronos-contacts' ) ); ?>" <?php echo null === $status ? 'class="current"' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static string. ?>>
					<?php
					/* translators: %d: total number of contact submissions */
					printf( esc_html__( 'All (%d)', 'chronos-bridge' ), absint( $total ) );
					?>
				</a> |</li>
				<?php foreach ( ContactStatus::cases() as $s ) : ?>
					<li><a href="<?php echo esc_url( add_query_arg( 'status', $s->value, admin_url( 'admin.php?page=chronos-contacts' ) ) ); ?>"
						<?php echo $status === $s ? 'class="current"' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static string. ?>>
						<?php printf( '%s (%d)', esc_html( ucfirst( $s->value ) ), absint( $counts[ $s->value ] ?? 0 ) ); ?>
					</a><?php echo ContactStatus::Replied !== $s ? ' |' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static string. ?></li>
				<?php endforeach; ?>
			</ul>

			<table class="wp-list-table widefat fixed striped">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Name', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Email', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Subject', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Message', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Status', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Date', 'chronos-bridge' ); ?></th>
						<th><?php esc_html_e( 'Actions', 'chronos-bridge' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php if ( empty( $result['items'] ) ) : ?>
						<tr><td colspan="7"><?php esc_html_e( 'No submissions found.', 'chronos-bridge' ); ?></td></tr>
					<?php else : ?>
						<?php foreach ( $result['items'] as $item ) : ?>
							<tr>
								<td><?php echo esc_html( $item->name ); ?></td>
								<td><a href="mailto:<?php echo esc_attr( $item->email ); ?>"><?php echo esc_html( $item->email ); ?></a></td>
								<td><?php echo esc_html( $item->subject ); ?></td>
								<td><?php echo esc_html( wp_trim_words( $item->message, 15 ) ); ?></td>
								<td><span class="chronos-status chronos-status--<?php echo esc_attr( $item->status ); ?>"><?php echo esc_html( ucfirst( $item->status ) ); ?></span></td>
								<td><?php echo esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $item->submitted_at ) ) ); ?></td>
								<td>
									<form method="post" style="display:inline;">
										<?php Sanitizer::nonce_field( 'chronos_contact_action' ); ?>
										<input type="hidden" name="submission_id" value="<?php echo esc_attr( (string) $item->id ); ?>" />
										<?php if ( 'new' === $item->status ) : ?>
											<button type="submit" name="chronos_update_status" class="button button-small" value="1">
												<input type="hidden" name="new_status" value="read" />
												<?php esc_html_e( 'Mark Read', 'chronos-bridge' ); ?>
											</button>
										<?php endif; ?>
										<button type="submit" name="chronos_delete_submission" class="button button-small button-link-delete" value="1"
											onclick="return confirm('<?php esc_attr_e( 'Are you sure?', 'chronos-bridge' ); ?>');">
											<?php esc_html_e( 'Delete', 'chronos-bridge' ); ?>
										</button>
									</form>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php endif; ?>
				</tbody>
			</table>

			<?php
			$total_pages = (int) ceil( $result['total'] / 20 );
			if ( $total_pages > 1 ) {
				echo '<div class="tablenav bottom"><div class="tablenav-pages">';
				echo wp_kses_post(
					paginate_links(
						array(
							'base'    => add_query_arg( 'paged', '%#%' ),
							'format'  => '',
							'current' => $page,
							'total'   => $total_pages,
						)
					) ?? ''
				);
				echo '</div></div>';
			}
			?>
		</div>
		<?php
	}

	/**
	 * Render the Watch Analytics admin page.
	 */
	public static function render_analytics_page(): void {
		Sanitizer::require_capability();

		$watch_count   = wp_count_posts( 'chronos_watch' );
		$contact_count = ContactTable::count_by_status();

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Watch Analytics', 'chronos-bridge' ); ?></h1>

			<div class="chronos-analytics-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:16px; margin-top:20px;">
				<div class="card" style="padding:16px;">
					<h3><?php esc_html_e( 'Published Watches', 'chronos-bridge' ); ?></h3>
					<p style="font-size:2em; font-weight:bold; margin:0;"><?php echo esc_html( (string) ( $watch_count->publish ?? 0 ) ); ?></p>
				</div>
				<div class="card" style="padding:16px;">
					<h3><?php esc_html_e( 'Draft Watches', 'chronos-bridge' ); ?></h3>
					<p style="font-size:2em; font-weight:bold; margin:0;"><?php echo esc_html( (string) ( $watch_count->draft ?? 0 ) ); ?></p>
				</div>
				<div class="card" style="padding:16px;">
					<h3><?php esc_html_e( 'New Contacts', 'chronos-bridge' ); ?></h3>
					<p style="font-size:2em; font-weight:bold; margin:0;"><?php echo esc_html( (string) $contact_count['new'] ); ?></p>
				</div>
				<div class="card" style="padding:16px;">
					<h3><?php esc_html_e( 'Total Contacts', 'chronos-bridge' ); ?></h3>
					<p style="font-size:2em; font-weight:bold; margin:0;"><?php echo esc_html( (string) array_sum( $contact_count ) ); ?></p>
				</div>
			</div>
		</div>
		<?php
	}
}
