<?php
/**
 * Production GraphQL limits that do not depend on admin screen settings.
 *
 * Debug output and the query analyzer are always off, public introspection
 * stays refused, a query-depth limit always applies, and user objects expose
 * only the display name to anyone who cannot list users.
 *
 * @package ChronosBridge
 */

declare(strict_types=1);

namespace ChronosBridge\GraphQL;

use ChronosBridge\Configuration\Policy;

/** Enforced WPGraphQL hardening. */
final class Hardening {

	/** Fields a visitor may read on another person's user object. */
	private const PUBLIC_USER_FIELDS = array( 'name', 'isRestricted' );

	/** Register the filters. */
	public static function register(): void {
		add_filter( 'graphql_debug_enabled', '__return_false', PHP_INT_MAX );
		add_filter( 'graphql_should_analyze_queries', '__return_false', PHP_INT_MAX );
		add_filter( 'graphql_get_setting_section_field_value', array( self::class, 'enforce_setting' ), PHP_INT_MAX, 5 );
		add_filter( 'graphql_object_visibility', array( self::class, 'restrict_users' ), 10, 5 );
		add_filter( 'graphql_allowed_fields_on_restricted_type', array( self::class, 'public_user_fields' ), 10, 6 );
	}

	/**
	 * Force the security-relevant general settings.
	 *
	 * @param mixed  $value          Stored value.
	 * @param mixed  $default_value  Default value (unused).
	 * @param string $option_name    Setting name.
	 * @param mixed  $section_fields Section values (unused).
	 * @param string $section_name   Section name.
	 * @return mixed
	 */
	public static function enforce_setting( $value, $default_value, $option_name, $section_fields, $section_name ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by the filter signature.
		if ( 'graphql_general_settings' !== $section_name ) {
			return $value;
		}
		return match ( $option_name ) {
			'debug_mode_enabled', 'query_analyzer_enabled', 'public_introspection_enabled' => 'off',
			'query_depth_enabled' => 'on',
			'query_depth_max' => Policy::graphql_max_depth(),
			default => $value,
		};
	}

	/**
	 * Treat other people's user objects as restricted for visitors.
	 *
	 * @param string $visibility   Model visibility.
	 * @param string $model_name   Model name.
	 * @param mixed  $data         Model data (unused).
	 * @param mixed  $owner        Owning user ID.
	 * @param mixed  $current_user Current user object.
	 */
	public static function restrict_users( $visibility, $model_name, $data, $owner, $current_user ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by the filter signature.
		if ( 'UserObject' !== $model_name || 'public' !== $visibility || self::may_see_user( $owner, $current_user ) ) {
			return $visibility;
		}
		return 'restricted';
	}

	/**
	 * Limit restricted user objects to the display name.
	 *
	 * @param array<int, string> $allowed      Allowed fields.
	 * @param string             $model_name   Model name.
	 * @param mixed              $data         Model data (unused).
	 * @param mixed              $visibility   Visibility (unused).
	 * @param mixed              $owner        Owning user ID.
	 * @param mixed              $current_user Current user object.
	 * @return array<int, string>
	 */
	public static function public_user_fields( $allowed, $model_name, $data, $visibility, $owner, $current_user ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by the filter signature.
		if ( 'UserObject' !== $model_name || self::may_see_user( $owner, $current_user ) ) {
			return $allowed;
		}
		return self::PUBLIC_USER_FIELDS;
	}

	/**
	 * Owners and user administrators see the full object.
	 *
	 * @param mixed $owner        Owning user ID.
	 * @param mixed $current_user Current user object.
	 */
	private static function may_see_user( $owner, $current_user ): bool {
		$current_id = is_object( $current_user ) && isset( $current_user->ID ) ? (int) $current_user->ID : 0;
		return ( $current_id > 0 && (int) $owner === $current_id ) || current_user_can( 'list_users' );
	}
}
