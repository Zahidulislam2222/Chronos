const defaults = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...defaults,
	// Gutenberg imports ESM-only Markdown and UUID packages in the CJS test runner.
	transformIgnorePatterns: [ 'node_modules[/\\\\](?!(marked|uuid)[/\\\\])' ],
};
