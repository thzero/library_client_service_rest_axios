import axios from 'axios'

// import crc32 from 'crc/crc32'

import LibraryConstants from '@thzero/library_client/constants';

import LibraryUtility from '@thzero/library_common/utility';

import RestCommunicationService from '@thzero/library_client/service/restCommunication';

const separator = ': ';
const contentType = 'Content-Type';
const contentTypeJson = 'application/json';

class AxiosRestCommunicationService extends RestCommunicationService {
	constructor() {
		super();

		this._serviceAuth = null;
	}

	async init(injector) {
		await super.init(injector);

		this._serviceAuth = this._injector.getService(LibraryConstants.InjectorKeys.SERVICE_AUTH);
	}

	async delete(correlationId, key, url, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.delete(LibraryUtility.formatUrl(url)));
	}

	async deleteById(correlationId, key, url, id, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.delete(LibraryUtility.formatUrlParams(url, id)));
	}

	async get(correlationId, key, url, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.get(LibraryUtility.formatUrl(url)));
	}

	async getById(correlationId, key, url, id, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.get(LibraryUtility.formatUrlParams(url, id)));
	}

	async post(correlationId, key, url, body, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.post(LibraryUtility.formatUrl(url), body));
	}

	async postById(correlationId, key, url, id, body, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.post(LibraryUtility.formatUrlParams(url, id), body));
	}

	async _create(correlationId, key, opts) {
		const config = this._config.getBackend(key);
		let baseUrl = config.baseUrl;
		if (!baseUrl.endsWith('/'))
			baseUrl += '/';

		const token = await this._addTokenHeader();
		const headers = {};
		headers[LibraryConstants.Headers.AuthKeys.API] = config.apiKey;
		headers[LibraryConstants.Headers.CorrelationId] = correlationId ? correlationId : LibraryUtility.generateId();
		if (token)
			headers[LibraryConstants.Headers.AuthKeys.AUTH] = LibraryConstants.Headers.AuthKeys.AUTH_BEARER + separator + token;
		headers[contentType] = contentTypeJson;

		let options = {
			baseURL: baseUrl,
			headers: headers,
			validateStatus: function (status) {
				return status >= 200 && status <= 503
			}
		};

		if (config.timeout)
			options.timeout = config.timeout;
		options = { ...options, ...opts };

		const instance = axios.create(options);

		// const unreliablePromise = (resolveOn, onReject) => () => {
		// 	if (--resolveOn > 0) {
		// 		onReject()
		// 		return Promise.reject()
		// 	}
		// 	return Promise.resolve()
		// }

		//	 const retry = (retries, fn) => fn().catch(err => retries > 1 ? retry(retries - 1, fn) : Promise.reject(err))
		//	 const pause = (duration) => new Promise(res => setTimeout(res, duration))
		//	 const backoff = (retries, fn, delay = 500) =>
		// 	fn().catch(err => retries > 1
		//		? pause(delay).then(() => backoff(retries - 1, fn, delay * 2))
		//		: Promise.reject(err))

		// Add a response interceptor
		instance.interceptors.response.use(function (response) {
			// Any status code that lie within the range of 2xx cause this function to trigger
			return response
		},
		function (error) {
			// Any status codes that falls outside the range of 2xx cause this function to trigger// Any status codes that falls outside the range of 2xx cause this function to trigger
			// await retry(3, unreliablePromise(3, log('Error'))).then(log('Resolved'))

			if (error && error.response && error.response.status === 401) {
				return this._serviceAuth.tokenUser(null, true).resolve()
			}

			return Promise.reject(error)
		});

		return instance;
	}

	_validate(correlationId, response) {
		if (response.status === 200) {
			// TODO: CRC
			// if (response.data.results && response.data.results.data) {
			// 	const dataCheck = crc32(JSON.stringify(response.data.results)).toString(16)
			// 	if (!response.data.check != dataCheck)
			// 		return this._error('AxiosRestCommunicationService', '_validate')
			// }
			return response.data;
		}

		if (response.status === 401)
			this._serviceAuth.tokenUser(null, true);

		return this._error('AxiosRestCommunicationService', '_validate', null, null, null, null, correlationId);
	}
}

export default AxiosRestCommunicationService;
