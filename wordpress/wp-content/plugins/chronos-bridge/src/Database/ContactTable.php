<?php
/**
 * CRUD operations for the contact_submissions custom table.
 *
 * @package ChronosBridge\Database
 */

declare(strict_types=1);

namespace ChronosBridge\Database;

use ChronosBridge\Security\Sanitizer;

/**
 * CRUD operations for the contact submissions database table.
 */
final class ContactTable {

	/**
	 * Get the full table name.
	 */
	public static function table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'chronos_contact_submissions';
	}

	/**
	 * Insert a new contact submission.
	 *
	 * @param array{name: string, email: string, subject: string, message: string} $data Submission data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function insert( array $data ): int|false {
		global $wpdb;

		$result = $wpdb->insert(
			self::table_name(),
			array(
				'name'         => Sanitizer::text( $data['name'] ?? '' ),
				'email'        => Sanitizer::email( $data['email'] ?? '' ),
				'subject'      => Sanitizer::text( $data['subject'] ?? '' ),
				'message'      => Sanitizer::textarea( $data['message'] ?? '' ),
				'ip_address'   => Sanitizer::get_client_ip(),
				'status'       => ContactStatus::New->value,
				'submitted_at' => current_time( 'mysql' ),
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		return false !== $result ? (int) $wpdb->insert_id : false;
	}

	/**
	 * Get a single submission by ID.
	 *
	 * @param int $id Submission ID.
	 * @return object|null
	 */
	public static function find( int $id ): ?object {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				'SELECT * FROM %i WHERE id = %d',
				self::table_name(),
				$id
			)
		);
	}

	/**
	 * Get submissions with pagination and optional status filter.
	 *
	 * @param int                $page     Current page number.
	 * @param int                $per_page Items per page.
	 * @param ContactStatus|null $status   Optional status filter.
	 * @return array{items: array<object>, total: int}
	 */
	public static function paginate(
		int $page = 1,
		int $per_page = 20,
		?ContactStatus $status = null,
	): array {
		global $wpdb;

		$table  = self::table_name();
		$offset = ( $page - 1 ) * $per_page;

		if ( null !== $status ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$items = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM %i WHERE status = %s ORDER BY submitted_at DESC LIMIT %d OFFSET %d',
					$table,
					$status->value,
					$per_page,
					$offset
				)
			);

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$total = (int) $wpdb->get_var(
				$wpdb->prepare(
					'SELECT COUNT(*) FROM %i WHERE status = %s',
					$table,
					$status->value
				)
			);
		} else {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$items = $wpdb->get_results(
				$wpdb->prepare(
					'SELECT * FROM %i ORDER BY submitted_at DESC LIMIT %d OFFSET %d',
					$table,
					$per_page,
					$offset
				)
			);

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$total = (int) $wpdb->get_var(
				$wpdb->prepare( 'SELECT COUNT(*) FROM %i', $table )
			);
		}

		return array(
			'items' => ! empty( $items ) ? $items : array(),
			'total' => $total,
		);
	}

	/**
	 * Update the status of a submission.
	 *
	 * @param int           $id     Submission ID.
	 * @param ContactStatus $status New status value.
	 * @return bool
	 */
	public static function update_status( int $id, ContactStatus $status ): bool {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->update(
			self::table_name(),
			array( 'status' => $status->value ),
			array( 'id' => $id ),
			array( '%s' ),
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete a submission.
	 *
	 * @param int $id Submission ID.
	 * @return bool
	 */
	public static function delete( int $id ): bool {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete(
			self::table_name(),
			array( 'id' => $id ),
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Count submissions by status.
	 *
	 * @return array<string, int>
	 */
	public static function count_by_status(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			$wpdb->prepare(
				'SELECT status, COUNT(*) as count FROM %i GROUP BY status',
				self::table_name()
			)
		);

		$counts = array(
			'new'     => 0,
			'read'    => 0,
			'replied' => 0,
		);

		foreach ( ( ! empty( $results ) ? $results : array() ) as $row ) {
			$counts[ $row->status ] = (int) $row->count;
		}

		return $counts;
	}

	/**
	 * Check rate limiting by IP address.
	 *
	 * @param int $max_per_hour Maximum submissions per hour.
	 * @return bool
	 */
	public static function is_rate_limited( int $max_per_hour = 5 ): bool {
		$ip        = Sanitizer::get_client_ip();
		$cache_key = 'rate_limit_' . md5( $ip );
		$count     = (int) get_transient( $cache_key );

		return $count >= $max_per_hour;
	}

	/**
	 * Increment the rate limit counter for the current IP.
	 */
	public static function increment_rate_limit(): void {
		$ip        = Sanitizer::get_client_ip();
		$cache_key = 'rate_limit_' . md5( $ip );
		$count     = (int) get_transient( $cache_key );

		set_transient( $cache_key, $count + 1, HOUR_IN_SECONDS );
	}
}
