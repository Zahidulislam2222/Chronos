<?php
/**
 * Single owner of operator-changeable security and retention settings.
 *
 * Values live in WordPress options so an operator changes them with WP-CLI
 * (`wp option update <name> <value>`) without a code release. Defaults and
 * bounds are defined here once; business code receives the resolved value.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\Configuration;

/** Typed access to the bounded operator settings. */
final class Policy {

	public const GRAPHQL_MAX_DEPTH_OPTION = 'chronos_graphql_max_depth';
	public const CONTACT_RETENTION_OPTION = 'chronos_contact_retention_days';
	public const CONTACT_RESPONDER_OPTION = 'chronos_ai_contact_responder';
	public const BACKUP_MARKER_OPTION     = 'chronos_backup_marker_file';
	public const BACKUP_MAX_AGE_OPTION    = 'chronos_backup_max_age_hours';

	private const BACKUP_MAX_AGE_DEFAULT = 30;
	private const BACKUP_MAX_AGE_RANGE   = array( 1, 720 );

	private const GRAPHQL_MAX_DEPTH_DEFAULT = 12;
	private const GRAPHQL_MAX_DEPTH_RANGE   = array( 5, 30 );
	private const CONTACT_RETENTION_RANGE   = array( 0, 3650 );

	/** Maximum GraphQL query depth for every request. */
	public static function graphql_max_depth(): int {
		return self::bounded( self::GRAPHQL_MAX_DEPTH_OPTION, self::GRAPHQL_MAX_DEPTH_DEFAULT, self::GRAPHQL_MAX_DEPTH_RANGE );
	}

	/** Days a contact submission is kept; 0 disables automatic deletion. */
	public static function contact_retention_days(): int {
		return self::bounded( self::CONTACT_RETENTION_OPTION, 0, self::CONTACT_RETENTION_RANGE );
	}

	/** Whether the admin AI reply helper may send submissions to a provider. */
	public static function contact_responder_enabled(): bool {
		return 'on' === get_option( self::CONTACT_RESPONDER_OPTION, 'off' );
	}

	/**
	 * Absolute path of the off-host backup marker, or '' when the check is off.
	 */
	public static function backup_marker_file(): string {
		$path = get_option( self::BACKUP_MARKER_OPTION, '' );
		return is_string( $path ) && 1 === preg_match( '#^/(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+$#D', $path ) && ! str_contains( $path, '..' ) ? $path : '';
	}

	/** Maximum age in hours of the last confirmed off-host backup. */
	public static function backup_max_age_hours(): int {
		return self::bounded( self::BACKUP_MAX_AGE_OPTION, self::BACKUP_MAX_AGE_DEFAULT, self::BACKUP_MAX_AGE_RANGE );
	}

	/**
	 * Read an integer option, falling back to the default when out of range.
	 *
	 * @param string          $option  Option name.
	 * @param int             $fallback Default value.
	 * @param array{int, int} $range   Inclusive bounds.
	 */
	private static function bounded( string $option, int $fallback, array $range ): int {
		$value = get_option( $option, $fallback );
		if ( ! is_numeric( $value ) ) {
			return $fallback;
		}
		$value = (int) $value;
		return ( $value < $range[0] || $value > $range[1] ) ? $fallback : $value;
	}
}
