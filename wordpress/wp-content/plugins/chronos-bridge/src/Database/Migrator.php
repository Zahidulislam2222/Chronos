<?php
/**
 * Database migrator — creates and updates custom tables using dbDelta.
 *
 * @package ChronosBridge\Database
 */

declare(strict_types=1);

namespace ChronosBridge\Database;

/**
 * Manages database schema creation and upgrades.
 */
final class Migrator {

	/**
	 * Run all migrations on plugin activation.
	 */
	public static function run(): void {
		self::create_contact_submissions_table();
		update_option( 'chronos_bridge_db_version', CHRONOS_BRIDGE_VERSION );
	}

	/**
	 * Check if migrations need to run (version comparison).
	 */
	public static function maybe_upgrade(): void {
		$installed_version = get_option( 'chronos_bridge_db_version', '0' );

		if ( version_compare( $installed_version, CHRONOS_BRIDGE_VERSION, '<' ) ) {
			self::run();
		}
	}

	/**
	 * Create the contact_submissions table.
	 */
	private static function create_contact_submissions_table(): void {
		global $wpdb;

		$table_name      = $wpdb->prefix . 'chronos_contact_submissions';
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			name varchar(255) NOT NULL DEFAULT '',
			email varchar(255) NOT NULL DEFAULT '',
			subject varchar(255) NOT NULL DEFAULT '',
			message longtext NOT NULL,
			ip_address varchar(45) NOT NULL DEFAULT '',
			status varchar(20) NOT NULL DEFAULT 'new',
			submitted_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY idx_status (status),
			KEY idx_email (email),
			KEY idx_submitted_at (submitted_at)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Drop custom tables on plugin uninstall.
	 */
	public static function drop_tables(): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare( 'DROP TABLE IF EXISTS %i', $wpdb->prefix . 'chronos_contact_submissions' )
		);

		delete_option( 'chronos_bridge_db_version' );
	}
}
