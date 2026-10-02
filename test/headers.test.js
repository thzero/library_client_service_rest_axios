import { afterEach, describe, expect, it, vi } from 'vitest';

import axios from 'axios';

import AxiosRestCommunicationService from '../index';

const create = async (opts) => {
	const service = new AxiosRestCommunicationService();
	service._logger = { debug() {}, error() {}, exception() {} };
	service._config = { getBackend: () => ({ baseUrl: 'http://api/' }) };
	service._addTokenHeader = async () => 'token';
	const spy = vi.spyOn(axios, 'create');
	await service._create('cid', 'backend', opts);
	return spy.mock.calls[0][0];
};

describe('AxiosRestCommunicationService headers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('sends a caller\'s headers with the defaults', async () => {
		const options = await create({ headers: { 'x-extra': 'yes' } });

		// merged into opts and never sent; and spreading opts would have replaced the
		// token and correlation id with the caller's map alone
		expect(options.headers['x-extra']).toBe('yes');
		expect(options.headers['correlation-id']).toBe('cid');
		expect(options.headers.authorization).toContain('token');
	});

	it('keeps the other options it is given', async () => {
		const options = await create({ timeout: 5 });

		expect(options.timeout).toBe(5);
		expect(options.headers['correlation-id']).toBe('cid');
	});
});
