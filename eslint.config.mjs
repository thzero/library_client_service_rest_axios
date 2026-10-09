// Rules earned their place: each one catches a defect found in this codebase.
// See AUDIT_CLIENT.md in the parent workspace for the catalogue.
import vitest from '@vitest/eslint-plugin';

const rules = {
	// undeclared identifiers: caught _logger.info throwing on every call, and
	// theEvent in baseControlEdit
	'no-undef': 'error',
	'use-isnan': 'error',
	// args is 'none': abstract base classes declare signatures they do not use
	'no-unused-vars': [ 'error', { args: 'none', ignoreRestSiblings: true } ],
	'no-bitwise': 'error',
	// == null is allowed: it is how this code tests for null or undefined
	'eqeqeq': [ 'error', 'always', { null: 'ignore' } ],
	'no-dupe-class-members': 'error',
	'no-dupe-keys': 'error',
	'no-unreachable': 'error',
	'no-constant-condition': [ 'error', { checkLoops: false } ],
	'no-self-compare': 'error',
	// the comma operator: caught the options check in base.vue's initialize()
	'no-sequences': 'error',
	'no-useless-catch': 'error',
	'no-self-assign': 'error',
	'no-unused-expressions': 'error'
};

const globals = {
	// library_common installs helpers onto the global String
	String: 'writable',
	console: 'readonly',
	window: 'readonly',
	document: 'readonly',
	navigator: 'readonly',
	localStorage: 'readonly',
	sessionStorage: 'readonly',
	HTMLElement: 'readonly',
	fetch: 'readonly',
	crypto: 'readonly',
	URL: 'readonly',
	TextEncoder: 'readonly',
	TextDecoder: 'readonly',
	Intl: 'readonly',
	setTimeout: 'readonly',
	clearTimeout: 'readonly',
	setInterval: 'readonly',
	clearInterval: 'readonly'
};

export default [
	{ ignores: [ 'node_modules/**', 'dist/**', '_config/**', 'coverage/**' ] },
	{
		files: [ '**/*.js', '**/*.mjs' ],
		languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals },
		rules
	},
	{
		files: [ 'test/**/*.js' ],
		plugins: { vitest },
		rules: {
			// a stray .only or .skip passes CI while running a fraction of the suite
			'vitest/no-focused-tests': 'error',
			'vitest/no-disabled-tests': 'error',
			// a test with no assertion passes whatever the code does
			'vitest/expect-expect': 'error'
		}
	}
];
