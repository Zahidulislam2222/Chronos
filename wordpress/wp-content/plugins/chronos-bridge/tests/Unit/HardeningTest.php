<?php
/**
 * Regression coverage for public-exposure guards, GraphQL limits, health,
 * the AI reply-helper switch and contact retention (build 2026-11-25).
 *
 * WordPress functions are stubbed per namespace; HardeningState holds the
 * simulated request context.
 *
 * @package ChronosBridge\Tests
 */

declare(strict_types=1);

namespace {
	if ( ! class_exists( 'WP_Error' ) ) {
		class WP_Error {
			public function __construct( public string $code = "", public string $message = "", public mixed $data = array() ) {}
			public function get_error_code(): string { return $this->code; }
			public function get_error_message(): string { return $this->message; }
			public function get_error_data(): mixed { return $this->data; }
			public function has_errors(): bool { return '' !== $this->code; }
			public function get_error_codes(): array { return '' === $this->code ? array() : array( $this->code ); }
		}
	}
	if ( ! class_exists( 'WP_REST_Response' ) ) {
		class WP_REST_Response {
			public array $headers = array();
			public function __construct( public mixed $data = null, public int $status = 200 ) {}
			public function header( string $name, string $value ): void { $this->headers[ $name ] = $value; }
			public function get_status(): int { return $this->status; }
			public function get_data(): mixed { return $this->data; }
		}
	}
	if ( ! class_exists( 'WooCommerce' ) ) {
		class WooCommerce {}
	}
	if ( ! function_exists( 'graphql' ) ) {
		function graphql(): array { return array(); }
	}
	if ( ! defined( 'DAY_IN_SECONDS' ) ) {
		define( 'DAY_IN_SECONDS', 86400 );
	}

	/** Simulated WordPress state shared by the stubs below. */
	final class HardeningState {
		public static array $options    = array();
		public static array $caps       = array();
		public static bool $logged_in   = false;
		public static bool $admin       = false;
		public static array $filters    = array();
		public static array $actions    = array();
		public static array $routes     = array();
		public static string $now       = '2026-11-25 12:00:00';
		public static int $login_init   = 0;

		public static function reset(): void {
			self::$options   = array();
			self::$caps      = array();
			self::$logged_in = false;
			self::$admin     = false;
			self::$filters   = array();
			self::$actions   = array();
			self::$routes    = array();
			self::$login_init = 0;
		}
	}
}

namespace ChronosBridge\Configuration {
	function get_option( string $name, mixed $fallback = false ): mixed {
		return \HardeningState::$options[ $name ] ?? $fallback;
	}
}

namespace ChronosBridge\Security {
	function add_filter( string $hook, mixed $callback, int $priority = 10, int $args = 1 ): void {
		\HardeningState::$filters[] = $hook;
	}
	function current_user_can( string $cap ): bool {
		return in_array( $cap, \HardeningState::$caps, true );
	}
	function is_user_logged_in(): bool {
		return \HardeningState::$logged_in;
	}
	function is_admin(): bool {
		return \HardeningState::$admin;
	}
	function __( string $text, string $domain = 'default' ): string {
		return $text;
	}
	function is_wp_error( mixed $thing ): bool {
		return $thing instanceof \WP_Error;
	}
	function did_action( string $hook ): int {
		return 'login_init' === $hook ? \HardeningState::$login_init : 0;
	}
	function add_action( string $hook, mixed $callback, int $priority = 10, int $args = 1 ): void {
		\HardeningState::$actions[] = $hook;
	}
}

namespace ChronosBridge\GraphQL {
	function add_filter( string $hook, mixed $callback, int $priority = 10, int $args = 1 ): void {
		\HardeningState::$filters[] = $hook;
	}
	function current_user_can( string $cap ): bool {
		return in_array( $cap, \HardeningState::$caps, true );
	}
}

namespace ChronosBridge\Api {
	function register_rest_route( string $namespace, string $route, array $args ): void {
		\HardeningState::$routes[] = $namespace . $route;
	}
}

namespace ChronosBridge\AI {
	function add_action( string $hook, mixed $callback, int $priority = 10, int $args = 1 ): void {
		\HardeningState::$actions[] = $hook;
	}
}

namespace ChronosBridge\Cron {
	function current_datetime(): \DateTimeImmutable {
		return new \DateTimeImmutable( \HardeningState::$now );
	}
}

namespace ChronosBridge\Tests\Unit {

	use ChronosBridge\AI\ContactResponder;
	use ChronosBridge\Api\HealthEndpoint;
	use ChronosBridge\Configuration\Policy;
	use ChronosBridge\Cron\CleanupJob;
	use ChronosBridge\GraphQL\Hardening;
	use ChronosBridge\Security\PublicExposure;
	use PHPUnit\Framework\TestCase;

	final class HardeningTest extends TestCase {

		protected function setUp(): void {
			\HardeningState::reset();
		}

		public function test_signed_out_user_routes_are_refused_with_401(): void {
			foreach ( array( '/wp/v2/users', '/wp/v2/users/1', '/wp/v2/users/1/application-passwords' ) as $route ) {
				$result = PublicExposure::guard_rest_users( null, null, $route );
				$this->assertInstanceOf( \WP_Error::class, $result, $route );
				$this->assertSame( 401, $result->data['status'] );
			}
		}

		public function test_signed_in_customer_keeps_me_but_cannot_list(): void {
			\HardeningState::$logged_in = true;
			$this->assertNull( PublicExposure::guard_rest_users( null, null, '/wp/v2/users/me' ) );
			$result = PublicExposure::guard_rest_users( null, null, '/wp/v2/users' );
			$this->assertSame( 403, $result->data['status'] );
		}

		public function test_user_administrators_and_other_routes_pass_through(): void {
			$this->assertNull( PublicExposure::guard_rest_users( null, null, '/wp/v2/posts' ) );
			$this->assertNull( PublicExposure::guard_rest_users( null, null, '/wp/v2/usersettings' ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertNull( PublicExposure::guard_rest_users( null, null, '/wp/v2/users' ) );
			$earlier = new \WP_Error( 'x', 'y', array() );
			$this->assertSame( $earlier, PublicExposure::guard_rest_users( $earlier, null, '/wp/v2/users' ) );
		}

		public function test_route_case_and_null_route_variants_cannot_bypass_the_guard(): void {
			foreach ( array( '/WP/V2/USERS', '/wp/v2/Users/1', '/Wp/V2/users' ) as $route ) {
				$this->assertInstanceOf( \WP_Error::class, PublicExposure::guard_rest_users( null, null, $route ), $route );
			}
			$this->assertNull( PublicExposure::guard_rest_users( null, null, null ) );
		}

		public function test_staff_who_edit_posts_keep_the_author_picker(): void {
			\HardeningState::$logged_in = true;
			\HardeningState::$caps      = array( 'edit_posts' );
			$this->assertNull( PublicExposure::guard_rest_users( null, null, '/wp/v2/users' ) );
		}

		public function test_failed_sign_ins_are_indistinguishable(): void {
			$codes = array();
			foreach ( array( 'invalid_username', 'invalid_email', 'incorrect_password' ) as $code ) {
				$result  = PublicExposure::uniform_login_error( new \WP_Error( $code, 'detail for ' . $code, array() ) );
				$codes[] = $result->get_error_code() . '|' . $result->get_error_message();
			}
			$this->assertCount( 1, array_unique( $codes ) );
			$this->assertStringStartsWith( 'invalid_credentials|', $codes[0] );
			$other = new \WP_Error( 'empty_password', 'x', array() );
			$this->assertSame( $other, PublicExposure::uniform_login_error( $other ) );
			$user = (object) array( 'ID' => 3 );
			$this->assertSame( $user, PublicExposure::uniform_login_error( $user ) );
			$this->assertNull( PublicExposure::uniform_login_error( null ) );
		}

		public function test_rest_application_password_failures_are_indistinguishable(): void {
			$unknown = PublicExposure::uniform_rest_auth_error( new \WP_Error( 'invalid_username', 'Unknown username.', array( 'status' => 401 ) ) );
			$wrong   = PublicExposure::uniform_rest_auth_error( new \WP_Error( 'incorrect_password', 'Invalid application password.', array( 'status' => 401 ) ) );
			$this->assertEquals( $unknown, $wrong );
			$this->assertSame( 'invalid_credentials', $unknown->get_error_code() );
			$this->assertSame( array( 'status' => 401 ), $unknown->get_error_data() );
			$other = new \WP_Error( 'rest_cookie_invalid_nonce', 'x', array( 'status' => 403 ) );
			$this->assertSame( $other, PublicExposure::uniform_rest_auth_error( $other ) );
			$this->assertTrue( PublicExposure::uniform_rest_auth_error( true ) );
			$this->assertNull( PublicExposure::uniform_rest_auth_error( null ) );
		}

		public function test_lost_password_masks_only_unknown_accounts_on_the_login_screen(): void {
			$clean = new \WP_Error();
			$this->assertFalse( PublicExposure::masks_unknown_account( $clean, false ), 'outside wp-login.php' );
			\HardeningState::$login_init = 1;
			$this->assertTrue( PublicExposure::masks_unknown_account( $clean, false ) );
			$this->assertFalse( PublicExposure::masks_unknown_account( $clean, (object) array( 'ID' => 1 ) ), 'real account follows core' );
			$this->assertTrue( PublicExposure::masks_unknown_account( new \WP_Error( 'invalid_email', 'no account', array() ), false ), 'unknown email' );
			$this->assertFalse( PublicExposure::masks_unknown_account( new \WP_Error( 'empty_username', 'x', array() ), false ), 'empty input keeps its error' );
			PublicExposure::register();
			$this->assertContains( 'lostpassword_post', \HardeningState::$actions );
			$this->assertContains( 'rest_authentication_errors', \HardeningState::$filters );
		}

		public function test_author_queries_become_404_for_visitors_only(): void {
			$this->assertSame( array( 'error' => '404' ), PublicExposure::remove_author_query( array( 'author' => '1' ) ) );
			$this->assertSame( array( 'error' => '404' ), PublicExposure::remove_author_query( array( 'author_name' => 'studio' ) ) );
			$this->assertSame( array( 'p' => '5' ), PublicExposure::remove_author_query( array( 'p' => '5' ) ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertSame( array( 'author' => '1' ), PublicExposure::remove_author_query( array( 'author' => '1' ) ) );
		}

		public function test_users_sitemap_and_oembed_author_are_removed(): void {
			$this->assertFalse( PublicExposure::remove_users_sitemap( 'provider', 'users' ) );
			$this->assertSame( 'provider', PublicExposure::remove_users_sitemap( 'provider', 'posts' ) );
			$this->assertSame( array( 'title' => 'T' ), PublicExposure::remove_oembed_author( array( 'title' => 'T', 'author_name' => 'A', 'author_url' => 'U' ) ) );
		}

		public function test_graphql_settings_are_enforced_whatever_is_stored(): void {
			$section = 'graphql_general_settings';
			foreach ( array( 'debug_mode_enabled', 'query_analyzer_enabled', 'public_introspection_enabled' ) as $name ) {
				$this->assertSame( 'off', Hardening::enforce_setting( 'on', 'off', $name, array(), $section ) );
			}
			$this->assertSame( 'on', Hardening::enforce_setting( 'off', 'off', 'query_depth_enabled', array(), $section ) );
			$this->assertSame( 12, Hardening::enforce_setting( 10, 10, 'query_depth_max', array(), $section ) );
			$this->assertSame( 'graphql', Hardening::enforce_setting( 'graphql', '', 'graphql_endpoint', array(), $section ) );
			$this->assertSame( 'on', Hardening::enforce_setting( 'on', 'off', 'debug_mode_enabled', array(), 'other_section' ) );
		}

		public function test_debug_extension_is_removed_from_array_and_object_responses(): void {
			$this->assertSame(
				array( 'data' => array( 'a' => 1 ) ),
				Hardening::strip_debug_extension( array( 'data' => array( 'a' => 1 ), 'extensions' => array( 'debug' => array( 'x' ) ) ) )
			);
			$this->assertSame(
				array( 'extensions' => array( 'other' => 1 ) ),
				Hardening::strip_debug_extension( array( 'extensions' => array( 'debug' => array(), 'other' => 1 ) ) )
			);
			$result             = new \stdClass();
			$result->extensions = array( 'debug' => array( 'x' ), 'keep' => true );
			$this->assertSame( array( 'keep' => true ), Hardening::strip_debug_extension( $result )->extensions );
			$this->assertSame( 'text', Hardening::strip_debug_extension( 'text' ) );
		}

		public function test_restricted_avatar_resolves_to_null_and_others_resolve_normally(): void {
			$nil        = new \stdClass();
			$restricted = (object) array( 'isRestricted' => true );
			$visible    = (object) array( 'isRestricted' => false );
			$this->assertNull( Hardening::hide_restricted_avatar( $nil, $restricted, array(), null, null, 'User', 'avatar' ) );
			$this->assertSame( $nil, Hardening::hide_restricted_avatar( $nil, $visible, array(), null, null, 'User', 'avatar' ) );
			$this->assertSame( $nil, Hardening::hide_restricted_avatar( $nil, $restricted, array(), null, null, 'User', 'name' ) );
			$this->assertSame( $nil, Hardening::hide_restricted_avatar( $nil, $restricted, array(), null, null, 'Post', 'avatar' ) );
		}

		public function test_guest_commenter_avatar_hash_is_hidden_from_visitors(): void {
			$nil   = new \stdClass();
			$guest = (object) array( 'name' => 'Guest' );
			$this->assertNull( Hardening::hide_restricted_avatar( $nil, $guest, array(), null, null, 'CommentAuthor', 'avatar' ) );
			$this->assertSame( $nil, Hardening::hide_restricted_avatar( $nil, $guest, array(), null, null, 'CommentAuthor', 'name' ) );
			\HardeningState::$caps = array( 'moderate_comments' );
			$this->assertSame( $nil, Hardening::hide_restricted_avatar( $nil, $guest, array(), null, null, 'CommentAuthor', 'avatar' ) );
		}

		public function test_visitors_cannot_look_up_accounts_through_root_fields(): void {
			$nil = new \stdClass();
			$this->assertNull( Hardening::refuse_user_lookups( $nil, null, array( 'id' => 'studio', 'idType' => 'SLUG' ), null, null, 'RootQuery', 'user' ) );
			$this->assertNull( Hardening::refuse_user_lookups( $nil, null, array(), null, null, 'RootQuery', 'users' ) );
			$this->assertSame( $nil, Hardening::refuse_user_lookups( $nil, null, array(), null, null, 'RootQuery', 'posts' ) );
			$this->assertSame( $nil, Hardening::refuse_user_lookups( $nil, null, array(), null, null, 'Post', 'author' ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertSame( $nil, Hardening::refuse_user_lookups( $nil, null, array(), null, null, 'RootQuery', 'user' ) );
		}

		public function test_author_filters_are_dropped_from_visitor_post_queries(): void {
			$args = array( 'post_type' => 'post', 'author_name' => 'studio', 'author' => 1, 'author__in' => array( 1 ), 'author__not_in' => array( 2 ) );
			$this->assertSame( array( 'post_type' => 'post' ), Hardening::drop_author_filters( $args ) );
			$this->assertSame( 'x', Hardening::drop_author_filters( 'x' ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertSame( $args, Hardening::drop_author_filters( $args ) );
		}

		public function test_graphql_depth_option_is_bounded(): void {
			\HardeningState::$options['chronos_graphql_max_depth'] = '8';
			$this->assertSame( 8, Policy::graphql_max_depth() );
			\HardeningState::$options['chronos_graphql_max_depth'] = '500';
			$this->assertSame( 12, Policy::graphql_max_depth() );
			\HardeningState::$options['chronos_graphql_max_depth'] = 'deep';
			$this->assertSame( 12, Policy::graphql_max_depth() );
		}

		public function test_visitors_see_only_the_display_name_of_other_users(): void {
			$visitor = (object) array( 'ID' => 0 );
			$this->assertSame( 'restricted', Hardening::restrict_users( 'public', 'UserObject', null, 1, $visitor ) );
			$this->assertSame( array( 'name', 'isRestricted' ), Hardening::public_user_fields( array( 'slug', 'databaseId' ), 'UserObject', null, 'restricted', 1, $visitor ) );
			$this->assertSame( 'public', Hardening::restrict_users( 'public', 'PostObject', null, 1, $visitor ) );
			$this->assertSame( 'private', Hardening::restrict_users( 'private', 'UserObject', null, 1, $visitor ) );
		}

		public function test_owner_and_user_administrators_keep_full_user_objects(): void {
			$owner = (object) array( 'ID' => 7 );
			$this->assertSame( 'public', Hardening::restrict_users( 'public', 'UserObject', null, 7, $owner ) );
			$this->assertSame( array( 'slug' ), Hardening::public_user_fields( array( 'slug' ), 'UserObject', null, 'restricted', 7, $owner ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertSame( 'public', Hardening::restrict_users( 'public', 'UserObject', null, 1, $owner ) );
		}

		public function test_health_reports_dependencies_and_degrades_without_them(): void {
			$previous        = $GLOBALS['wpdb'] ?? null;
			$GLOBALS['wpdb'] = new class() {
				public bool $up = true;
				public function get_var( string $sql ): ?string { return $this->up ? '1' : null; }
			};
			try {
				$report = HealthEndpoint::checks();
				$this->assertSame( array( 'database', 'commerce', 'graphql' ), array_keys( $report['checks'] ) );
				$this->assertSame( 'ok', $report['status'] );
				$response = HealthEndpoint::report();
				$this->assertSame( 200, $response->get_status() );
				$this->assertSame( 'no-store', $response->headers['Cache-Control'] );
				$this->assertStringNotContainsString( 'version', json_encode( $response->get_data() ) );
				$GLOBALS['wpdb']->up = false;
				$this->assertFalse( HealthEndpoint::checks()['checks']['database'] );
				$this->assertSame( 503, HealthEndpoint::report()->get_status() );
				( new HealthEndpoint() )->register_routes();
				$this->assertSame( array( 'chronos/v1/health', 'chronos/v1/health/backup' ), \HardeningState::$routes );
			} finally {
				$GLOBALS['wpdb'] = $previous;
			}
		}

		public function test_backup_freshness_is_separate_from_site_health(): void {
			$previous        = $GLOBALS['wpdb'] ?? null;
			$GLOBALS['wpdb'] = new class() {
				public function get_var( string $sql ): string { return '1'; }
			};
			$marker = sys_get_temp_dir() . '/chronos-backup-marker-' . getmypid();
			try {
				$this->assertSame( 'off', HealthEndpoint::backup_status() );
				$this->assertSame( 200, HealthEndpoint::report_backup()->get_status() );
				\HardeningState::$options['chronos_backup_marker_file'] = 'relative/marker';
				$this->assertSame( 'off', HealthEndpoint::backup_status() );
				\HardeningState::$options['chronos_backup_marker_file'] = '/var/../etc/passwd';
				$this->assertSame( 'off', HealthEndpoint::backup_status() );
				\HardeningState::$options['chronos_backup_marker_file'] = $marker;
				$this->assertSame( 'stale', HealthEndpoint::backup_status(), 'missing marker' );
				$stale = HealthEndpoint::report_backup();
				$this->assertSame( 503, $stale->get_status() );
				$this->assertSame( 'no-store', $stale->headers['Cache-Control'] );
				$this->assertSame( 'ok', HealthEndpoint::checks()['status'], 'a stale backup never degrades site health' );
				touch( $marker );
				$this->assertSame( 'ok', HealthEndpoint::backup_status(), 'fresh marker' );
				$this->assertSame( 200, HealthEndpoint::report_backup()->get_status() );
				touch( $marker, time() - 31 * 3600 );
				clearstatcache();
				$this->assertSame( 'stale', HealthEndpoint::backup_status(), 'stale marker' );
				\HardeningState::$options['chronos_backup_max_age_hours'] = '48';
				$this->assertSame( 'ok', HealthEndpoint::backup_status(), 'within configured age' );
			} finally {
				$GLOBALS['wpdb'] = $previous;
				if ( is_file( $marker ) ) {
					unlink( $marker );
				}
			}
		}

		public function test_contact_reply_helper_is_off_by_default_and_registers_nothing(): void {
			$this->assertFalse( Policy::contact_responder_enabled() );
			$this->assertFalse( ContactResponder::is_available() );
			ContactResponder::register();
			$this->assertSame( array(), \HardeningState::$actions );
			\HardeningState::$options['chronos_ai_contact_responder'] = 'on';
			ContactResponder::register();
			$this->assertContains( 'rest_api_init', \HardeningState::$actions );
			$this->assertContains( 'wp_ajax_chronos_ai_suggest_reply', \HardeningState::$actions );
		}

		public function test_contact_retention_is_off_by_default_and_deletes_by_site_time_cutoff(): void {
			$previous        = $GLOBALS['wpdb'] ?? null;
			$GLOBALS['wpdb'] = new class() {
				public string $prefix = 'wp_';
				public array $queries = array();
				public array $values  = array();
				public mixed $result  = 3;
				public function prepare( string $query, mixed ...$values ): string {
					$this->values = $values;
					return $query;
				}
				public function query( string $sql ): mixed {
					$this->queries[] = $sql;
					return $this->result;
				}
			};
			try {
				$this->assertNull( CleanupJob::apply_contact_retention() );
				$this->assertSame( array(), $GLOBALS['wpdb']->queries );
				\HardeningState::$options['chronos_contact_retention_days'] = '30';
				$this->assertSame( 3, CleanupJob::apply_contact_retention() );
				$this->assertSame( array( 'wp_chronos_contact_submissions', '2026-10-26 12:00:00' ), $GLOBALS['wpdb']->values );
				$this->assertStringStartsWith( 'DELETE FROM %i WHERE submitted_at < %s', $GLOBALS['wpdb']->queries[0] );
				$GLOBALS['wpdb']->result = false;
				$this->assertNull( CleanupJob::apply_contact_retention() );
				\HardeningState::$options['chronos_contact_retention_days'] = '-4';
				$this->assertSame( 0, Policy::contact_retention_days() );
			} finally {
				$GLOBALS['wpdb'] = $previous;
			}
		}
	}
}
