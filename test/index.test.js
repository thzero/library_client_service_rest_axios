import { beforeEach, describe, expect, it, vi } from 'vitest';

import AxiosRestCommunicationService from '../index';

describe('AxiosRestCommunicationService', () => {
	let service;

	beforeEach(() => {
		service = new AxiosRestCommunicationService();
		service._logger = { debug() {}, error() {}, exception: vi.fn() };
	});

	it('_validate returns the data of a 200', async () => {
		const data = { success: true };

		expect(await service._validate('cid', { status: 200, data })).toBe(data);
	});

	it('_validate refreshes the token on a 401, and waits for it', async () => {
		let refreshed = false;
		const spy = vi.spyOn(service, '_refreshToken').mockImplementation(async () => { refreshed = true; });

		const response = await service._validate('cid', { status: 401 });

		expect(spy).toHaveBeenCalledWith('cid', true);
		expect(refreshed).toBe(true);
		expect(response.success).toBe(false);
	});

	it('_interceptorFailure refreshes on a 401 and passes the error on', async () => {
		const spy = vi.spyOn(service, '_refreshToken').mockResolvedValue();
		const error = { response: { status: 401 } };

		// axios calls it detached from the service; it is bound where it is registered
		const detached = service._interceptorFailure.bind(service);

		await expect(detached(error)).rejects.toBe(error);
		expect(spy).toHaveBeenCalledWith(expect.any(String), true);
	});

	it('_interceptorFailure leaves other errors alone', async () => {
		const spy = vi.spyOn(service, '_refreshToken');
		const error = { response: { status: 500 } };

		await expect(service._interceptorFailure(error)).rejects.toBe(error);
		expect(spy).not.toHaveBeenCalled();
	});

	it('_requestNewToken goes through _refreshToken', async () => {
		// it called a tokenUser that no auth service defines
		const spy = vi.spyOn(service, '_refreshToken').mockResolvedValue();

		await service._requestNewToken('cid', true);

		expect(spy).toHaveBeenCalledWith('cid', true);
	});
});
