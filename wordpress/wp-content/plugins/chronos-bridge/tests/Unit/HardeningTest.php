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
			public function __construct( public string $code, public string $message, public array $data ) {}
			public function get_error_code(): string { return $this->code; }
			public function get_error_message(): string { return $this->message; }
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

		public static function reset(): void {
			self::$options   = array();
			self::$caps      = array();
			self::$logged_in = false;
			self::$admin     = false;
			self::$filters   = array();
			self::$actions   = array();
			self::$routes    = array();
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

		private function request( string $route ): object {
			return new class( $route ) {
				public function __construct( private string $route ) {}
				public function get_route(): string { return $this->route; }
			};
		}

		public function test_signed_out_user_routes_are_refused_with_401(): void {
			foreach ( array( '/wp/v2/users', '/wp/v2/users/1', '/wp/v2/users/1/application-passwords' ) as $route ) {
				$result = PublicExposure::guard_rest_users( null, null, $this->request( $route ) );
				$this->assertInstanceOf( \WP_Error::class, $result, $route );
				$this->assertSame( 401, $result->data['status'] );
			}
		}

		public function test_signed_in_customer_keeps_me_but_cannot_list(): void {
			\HardeningState::$logged_in = true;
			$this->assertNull( PublicExposure::guard_rest_users( null, null, $this->request( '/wp/v2/users/me' ) ) );
			$result = PublicExposure::guard_rest_users( null, null, $this->request( '/wp/v2/users' ) );
			$this->assertSame( 403, $result->data['status'] );
		}

		public function test_user_administrators_and_other_routes_pass_through(): void {
			$this->assertNull( PublicExposure::guard_rest_users( null, null, $this->request( '/wp/v2/posts' ) ) );
			$this->assertNull( PublicExposure::guard_rest_users( null, null, $this->request( '/wp/v2/usersettings' ) ) );
			\HardeningState::$caps = array( 'list_users' );
			$this->assertNull( PublicExposure::guard_rest_users( null, null, $this->request( '/wp/v2/users' ) ) );
			$earlier = new \WP_Error( 'x', 'y', array() );
			$this->assertSame( $earlier, PublicExposure::guard_rest_users( $earlier, null, $this->request( '/wp/v2/users' ) ) );
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
				$this->assertTrue( $report['checks']['database'] );
				// The unit environment has neither WooCommerce nor WPGraphQL loaded.
				$this->assertSame( 'degraded', $report['status'] );
				$response = HealthEndpoint::report();
				$this->assertSame( 503, $response->get_status() );
				$this->assertSame( 'no-store', $response->headers['Cache-Control'] );
				$this->assertStringNotContainsString( 'version', json_encode( $response->get_data() ) );
				$GLOBALS['wpdb']->up = false;
				$this->assertFalse( HealthEndpoint::checks()['checks']['database'] );
				( new HealthEndpoint() )->register_routes();
				$this->assertSame( array( 'chronos/v1/health' ), \HardeningState::$routes );
			} finally {
				$GLOBALS['wpdb'] = $previous;
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
