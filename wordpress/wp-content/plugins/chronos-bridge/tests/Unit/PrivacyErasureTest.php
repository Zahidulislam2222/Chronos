<?php
/** Regression coverage for native database IDs and failed erasures. */
declare(strict_types=1);

namespace {
	if ( ! class_exists( 'WP_Error' ) ) {
		class WP_Error {
			public function __construct( public string $code, public string $message, public array $data ) {}
			public function get_error_code(): string { return $this->code; }
			public function get_error_message(): string { return $this->message; }
		}
	}
}

namespace ChronosBridge\Database {

	function sanitize_email( string $email ): string {
		return filter_var( $email, FILTER_SANITIZE_EMAIL ) ?: '';
	}
}

namespace ChronosBridge\Tests\Unit {

	use ChronosBridge\Privacy\DataHandler;
	use PHPUnit\Framework\TestCase;

	final class PrivacyErasureTest extends TestCase {

		private function erase( bool $fail_second, bool $read_fails = false, bool $export = false, array $ids = array( '41', '42' ) ): array {
			$previous        = $GLOBALS['wpdb'] ?? null;
			$database        = new class( $fail_second, $read_fails, $ids ) {
				public string $prefix = 'wp_';
				public array $deleted = array();
				public string $last_error = '';

				public function __construct( private bool $fail_second, private bool $read_fails, private array $ids ) {}

				public function prepare( string $query, mixed ...$values ): string {
					return $query;
				}

				public function get_results( string $query ): array {
					if ( $this->read_fails ) {
						$this->last_error = 'Synthetic private SQL diagnostics';
						return array();
					}
					return array_map( static fn( $id ) => (object) array( 'id' => $id ), $this->ids );
				}

				public function delete( string $table, array $where, array $formats ): int|false {
					if ( $this->fail_second && 42 === $where['id'] ) {
						return false;
					}
					$this->deleted[] = $where['id'];
					return 1;
				}
			};
			$GLOBALS['wpdb'] = $database;
			try {
				$result = $export ? DataHandler::export_data( 'synthetic@example.test' ) : DataHandler::erase_data( 'synthetic@example.test' );
				return array( $result, $database );
			} finally {
				$GLOBALS['wpdb'] = $previous;
			}
		}

		public function test_native_string_ids_are_erased(): void {
			list( $result, $database ) = $this->erase( false );
			self::assertSame( 2, $result['items_removed'] );
			self::assertSame( 0, $result['items_retained'] );
			self::assertSame( array( 41, 42 ), $database->deleted );
		}

		public function test_database_failure_reports_retained_data(): void {
			list( $result, $database ) = $this->erase( true );
			self::assertSame( 1, $result['items_removed'] );
			self::assertSame( 1, $result['items_retained'] );
			self::assertSame( array( 41 ), $database->deleted );
		}

		public function test_failed_read_never_claims_export_or_erasure_completed(): void {
			foreach ( array( false, true ) as $export ) {
				list( $result, $database ) = $this->erase( false, true, $export );
				self::assertInstanceOf( \WP_Error::class, $result );
				self::assertSame( 'chronos_privacy_read_failed', $result->get_error_code() );
				self::assertStringNotContainsString( 'SQL diagnostics', $result->get_error_message() );
				self::assertSame( array(), $database->deleted );
			}
		}

		public function test_invalid_and_overflow_ids_never_delete_another_record(): void {
			list( $result, $database ) = $this->erase( false, false, false, array( 'invalid', '18446744073709551615' ) );
			self::assertSame( 0, $result['items_removed'] );
			self::assertSame( 2, $result['items_retained'] );
			self::assertSame( array(), $database->deleted );
		}
	}
}
