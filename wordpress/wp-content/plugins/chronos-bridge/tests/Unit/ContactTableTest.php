<?php
/**
 * Unit tests for the ContactTable class.
 *
 * Tests the ContactStatus enum and data formatting logic.
 *
 * @package ChronosBridge\Tests\Unit
 */

declare(strict_types=1);

namespace ChronosBridge\Tests\Unit;

use ChronosBridge\Database\ContactStatus;
use PHPUnit\Framework\TestCase;

class ContactTableTest extends TestCase {

	public function test_contact_status_enum_values(): void {
		$this->assertSame( 'new', ContactStatus::New->value );
		$this->assertSame( 'read', ContactStatus::Read->value );
		$this->assertSame( 'replied', ContactStatus::Replied->value );
	}

	public function test_contact_status_from_string(): void {
		$this->assertSame( ContactStatus::New, ContactStatus::from( 'new' ) );
		$this->assertSame( ContactStatus::Read, ContactStatus::from( 'read' ) );
		$this->assertSame( ContactStatus::Replied, ContactStatus::from( 'replied' ) );
	}

	public function test_contact_status_try_from_invalid(): void {
		$this->assertNull( ContactStatus::tryFrom( 'invalid' ) );
	}

	public function test_contact_status_cases(): void {
		$cases = ContactStatus::cases();
		$this->assertCount( 3, $cases );
	}

	public function test_contact_status_values(): void {
		$expected = [ 'new', 'read', 'replied' ];
		$values   = array_map( fn( ContactStatus $s ) => $s->value, ContactStatus::cases() );
		$this->assertSame( $expected, $values );
	}
}
