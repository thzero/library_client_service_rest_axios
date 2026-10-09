import { afterEach, beforeAll } from 'vitest';

// library_common installs String.isNullOrEmpty and friends onto the global String
import '@thzero/library_common/utility/string';

import LibraryClientUtility from '@thzero/library_client/utility/index';

// Tests assign stubs to the LibraryClientUtility globals ($injector, $store,
// $EventBus, $navRouter, ...). After every test, put back what the file had once
// its imports ran, so one test's stubs cannot leak into the next.
const globals = () => Object.getOwnPropertyNames(LibraryClientUtility).filter((key) => key.startsWith('$'));
let saved;
beforeAll(() => {
	saved = new Map(globals().map((key) => [ key, LibraryClientUtility[key] ]));
});
afterEach(() => {
	for (const key of globals()) {
		if (!saved.has(key))
			delete LibraryClientUtility[key];
	}
	for (const [ key, value ] of saved)
		LibraryClientUtility[key] = value;
});
