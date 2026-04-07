<?php
/**
 * WordPress Privacy API integration — data exporter and eraser for contact submissions.
 *
 * Allows site admins to export and erase personal data stored by Chronos Bridge
 * via WordPress > Tools > Export/Erase Personal Data.
 *
 * @package ChronosBridge\Privacy
 */

declare(strict_types=1);

namespace ChronosBridge\Privacy;

use ChronosBridge\Database\ContactTable;

/**
 * Registers data exporter and eraser with WordPress Privacy API.
 */
final class DataHandler {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( self::class, 'register_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( self::class, 'register_eraser' ) );
		add_action( 'admin_init', array( self::class, 'add_privacy_policy_content' ) );
	}

	/**
	 * Register the data exporter.
	 *
	 * @param array<string, array<string, mixed>> $exporters Existing exporters.
	 * @return array<string, array<string, mixed>>
	 */
	public static function register_exporter( array $exporters ): array {
		$exporters['chronos-bridge'] = array(
			'exporter_friendly_name' => __( 'Chronos Contact Submissions', 'chronos-bridge' ),
			'callback'               => array( self::class, 'export_data' ),
		);
		return $exporters;
	}

	/**
	 * Register the data eraser.
	 *
	 * @param array<string, array<string, mixed>> $erasers Existing erasers.
	 * @return array<string, array<string, mixed>>
	 */
	public static function register_eraser( array $erasers ): array {
		$erasers['chronos-bridge'] = array(
			'eraser_friendly_name' => __( 'Chronos Contact Submissions', 'chronos-bridge' ),
			'callback'             => array( self::class, 'erase_data' ),
		);
		return $erasers;
	}

	/**
	 * Export personal data for a given email address.
	 *
	 * @param string $email The user's email address.
	 * @param int    $page  Page number for pagination.
	 * @return array{data: array<array<string, mixed>>, done: bool}
	 */
	public static function export_data( string $email, int $page = 1 ): array { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by WordPress Privacy API.
		$submissions  = ContactTable::find_by_email( $email );
		$export_items = array();

		foreach ( $submissions as $submission ) {
			$export_items[] = array(
				'group_id'          => 'chronos-contact',
				'group_label'       => __( 'Contact Form Submissions', 'chronos-bridge' ),
				'group_description' => __( 'Messages submitted through the Chronos contact form.', 'chronos-bridge' ),
				'item_id'           => "chronos-contact-{$submission->id}",
				'data'              => array(
					array(
						'name'  => __( 'Name', 'chronos-bridge' ),
						'value' => $submission->name,
					),
					array(
						'name'  => __( 'Email', 'chronos-bridge' ),
						'value' => $submission->email,
					),
					array(
						'name'  => __( 'Subject', 'chronos-bridge' ),
						'value' => $submission->subject,
					),
					array(
						'name'  => __( 'Message', 'chronos-bridge' ),
						'value' => $submission->message,
					),
					array(
						'name'  => __( 'Date', 'chronos-bridge' ),
						'value' => $submission->submitted_at,
					),
					array(
						'name'  => __( 'IP Address', 'chronos-bridge' ),
						'value' => $submission->ip_address ?? '',
					),
				),
			);
		}

		return array(
			'data' => $export_items,
			'done' => true,
		);
	}

	/**
	 * Erase personal data for a given email address.
	 *
	 * @param string $email The user's email address.
	 * @param int    $page  Page number for pagination.
	 * @return array{items_removed: int, items_retained: int, messages: array<string>, done: bool}
	 */
	public static function erase_data( string $email, int $page = 1 ): array { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by WordPress Privacy API.
		$submissions = ContactTable::find_by_email( $email );
		$removed     = 0;

		foreach ( $submissions as $submission ) {
			if ( ContactTable::delete( $submission->id ) ) {
				++$removed;
			}
		}

		return array(
			'items_removed'  => $removed,
			'items_retained' => 0,
			'messages'       => array(),
			'done'           => true,
		);
	}

	/**
	 * Add privacy policy suggested content.
	 */
	public static function add_privacy_policy_content(): void {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$content = sprintf(
			'<h2>%s</h2><p>%s</p><h3>%s</h3><p>%s</p><h3>%s</h3><p>%s</p>',
			__( 'Chronos Contact Form', 'chronos-bridge' ),
			__( 'When you submit our contact form, we collect your name, email address, subject, message, and IP address. This data is stored in our database to respond to your inquiry.', 'chronos-bridge' ),
			__( 'How Long We Retain Your Data', 'chronos-bridge' ),
			__( 'Contact form submissions are retained until manually deleted by an administrator or upon a privacy erasure request.', 'chronos-bridge' ),
			__( 'Your Rights', 'chronos-bridge' ),
			__( 'You can request an export or deletion of your personal data via the WordPress privacy tools. Contact us to exercise these rights.', 'chronos-bridge' )
		);

		wp_add_privacy_policy_content(
			'Chronos Bridge',
			wp_kses_post( $content )
		);
	}
}
