/**
 * Tests for the Watch Showcase block.
 */
import {
	registerBlockType,
	getBlockType,
	unregisterBlockType,
	setCategories,
} from '@wordpress/blocks';
import metadata from '../src/watch-showcase/block.json';

describe( 'Watch Showcase Block', () => {
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
		expect( block.name ).toBe( 'chronos/watch-showcase' );
	} );

	it( 'should have correct title', () => {
		const block = getBlockType( metadata.name );
		expect( block.title ).toBe( 'Watch Showcase' );
	} );

	it( 'should be in chronos category', () => {
		const block = getBlockType( metadata.name );
		expect( block.category ).toBe( 'chronos' );
	} );

	it( 'should have default attributes', () => {
		const block = getBlockType( metadata.name );
		expect( block.attributes.watchId.default ).toBe( 0 );
		expect( block.attributes.showPrice.default ).toBe( true );
		expect( block.attributes.showExcerpt.default ).toBe( true );
		expect( block.attributes.ctaText.default ).toBe( 'View Details' );
		expect( block.attributes.layout.default ).toBe( 'horizontal' );
	} );

	it( 'should support alignment', () => {
		const block = getBlockType( metadata.name );
		expect( block.supports.align ).toContain( 'wide' );
		expect( block.supports.align ).toContain( 'full' );
	} );

	it( 'should not support html editing', () => {
		const block = getBlockType( metadata.name );
		expect( block.supports.html ).toBe( false );
	} );
} );
