<?php
/**
 * WP-Cron scheduled tasks — transient cleanup and weekly contact summary email.
 *
 * @package ChronosBridge\Cron
 */

declare(strict_types=1);

namespace ChronosBridge\Cron;

use ChronosBridge\Cache\TransientCache;
use ChronosBridge\Database\ContactTable;

/**
 * Handles scheduled cleanup and summary email tasks.
 */
final class CleanupJob {

	private const DAILY_HOOK  = 'chronos_daily_cleanup';
	private const WEEKLY_HOOK = 'chronos_weekly_summary';

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( self::DAILY_HOOK, array( self::class, 'daily_cleanup' ) );
		add_action( self::WEEKLY_HOOK, array( self::class, 'weekly_summary' ) );
	}

	/**
	 * Schedule cron events on plugin activation.
	 */
	public static function schedule(): void {
		if ( ! wp_next_scheduled( self::DAILY_HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::DAILY_HOOK );
		}

		if ( ! wp_next_scheduled( self::WEEKLY_HOOK ) ) {
			wp_schedule_event( time(), 'weekly', self::WEEKLY_HOOK );
		}
	}

	/**
	 * Clear scheduled events on plugin deactivation.
	 */
	public static function unschedule(): void {
		wp_clear_scheduled_hook( self::DAILY_HOOK );
		wp_clear_scheduled_hook( self::WEEKLY_HOOK );
	}

	/**
	 * Daily cleanup: flush expired chronos transients.
	 */
	public static function daily_cleanup(): void {
		TransientCache::flush();
	}

	/**
	 * Weekly summary: email admin with contact submission stats.
	 */
	public static function weekly_summary(): void {
		$counts = ContactTable::count_by_status();
		$total  = array_sum( $counts );

		if ( 0 === $total ) {
			return;
		}

		$to      = get_option( 'chronos_contact_email', get_option( 'admin_email' ) );
		$subject = sprintf(
			/* translators: %d: total contact submissions count */
			__( 'Chronos Weekly Summary — %d contact submissions', 'chronos-bridge' ),
			$total
		);

		$body = sprintf(
			'<h3>%s</h3><ul><li>%s: %d</li><li>%s: %d</li><li>%s: %d</li><li><strong>%s: %d</strong></li></ul>',
			esc_html__( 'Contact Submissions Summary', 'chronos-bridge' ),
			esc_html__( 'New', 'chronos-bridge' ),
			$counts['new'],
			esc_html__( 'Read', 'chronos-bridge' ),
			$counts['read'],
			esc_html__( 'Replied', 'chronos-bridge' ),
			$counts['replied'],
			esc_html__( 'Total', 'chronos-bridge' ),
			$total
		);

		wp_mail( $to, $subject, $body, array( 'Content-Type: text/html; charset=UTF-8' ) );
	}
}
