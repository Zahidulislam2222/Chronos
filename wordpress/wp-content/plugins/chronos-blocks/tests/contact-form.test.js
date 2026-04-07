/**
 * Tests for the Contact Form block.
 */
import {
	registerBlockType,
	getBlockType,
	unregisterBlockType,
	setCategories,
} from '@wordpress/blocks';
import metadata from '../src/contact-form/block.json';

describe( 'Contact Form Block', () => {
	beforeAll( () => {
		setCategories( [
			{ slug: 'chronos', title: 'Chronos', icon: 'clock' },
		] );
		registerBlockType( metadata.name, {
			...metadata,
			edit: () => null,
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( metadata.name );
	} );

	it( 'should be registered', () => {
		const block = getBlockType( metadata.name );
		expect( block ).toBeDefined();
		expect( block.name ).toBe( 'chronos/contact-form' );
	} );

	it( 'should have correct title', () => {
		const block = getBlockType( metadata.name );
		expect( block.title ).toBe( 'Contact Form' );
	} );

	it( 'should be in chronos category', () => {
		const block = getBlockType( metadata.name );
		expect( block.category ).toBe( 'chronos' );
	} );

	it( 'should have form default attributes', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.heading.default ).toBe( 'Get in Touch' );
		expect( block.attributes.submitText.default ).toBe( 'Send Message' );
		expect( block.attributes.showSubject.default ).toBe( true );
	} );

	it( 'should have a success message attribute', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.successMessage ).toBeDefined();
		expect( block.attributes.successMessage.default ).toContain(
			'Thank you'
		);
	} );

	it( 'should have a description attribute', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.description ).toBeDefined();
		expect( block.attributes.description.type ).toBe( 'string' );
	} );

	it( 'should support color customization', () => {
		const block = getBlockType( metadata.name );
		expect( block.supports.color.background ).toBe( true );
		expect( block.supports.color.text ).toBe( true );
	} );
} );
