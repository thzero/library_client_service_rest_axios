import { describe, expect, it } from 'vitest';

// Every module in the package loads: catches imports that resolve to nothing,
// undefined identifiers at module scope and syntax errors.
const modules = import.meta.glob([
	'../index.js',
	'../openSource.js'
]);

describe('modules', () => {
	it('finds the modules', () => {
		expect(Object.keys(modules).length).toBeGreaterThan(1);
	});

	it.each(Object.keys(modules))('%s loads', async (key) => {
		expect(await modules[key]()).toBeDefined();
	});
});
