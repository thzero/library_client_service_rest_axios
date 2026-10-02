import axios from 'axios';

// import crc32 from 'crc/crc32'

import LibraryClientConstants from '@thzero/library_client/constants';

import LibraryCommonUtility from '@thzero/library_common/utility';

import RestCommunicationService from '@thzero/library_client/service/restCommunication';

const separator = ': ';
const acceptType = 'accept';
const contentType = 'Content-Type';
const contentTypeJson = 'application/json';

class AxiosRestCommunicationService extends RestCommunicationService {
	constructor() {
		super();

		this._serviceAuth = null;
	}

	async init(injector) {
		await super.init(injector);

		this._serviceAuth = this._injector.getService(LibraryClientConstants.InjectorKeys.SERVICE_AUTH);
	}

	async delete(correlationId, key, url, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.delete(LibraryCommonUtility.formatUrl(url)));
	}

	async deleteById(correlationId, key, url, id, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.delete(LibraryCommonUtility.formatUrlParams(url, id)));
	}

	async get(correlationId, key, url, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.get(LibraryCommonUtility.formatUrl(url)));
	}

	async getById(correlationId, key, url, id, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.get(LibraryCommonUtility.formatUrlParams(url, id)));
	}

	async post(correlationId, key, url, body, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.post(LibraryCommonUtility.formatUrl(url), body));
	}

	async postById(correlationId, key, url, id, body, options) {
		const executor = await this._create(correlationId, key, options);
		return this._validate(correlationId, await executor.post(LibraryCommonUtility.formatUrlParams(url, id), body));
	}

	async _create(correlationId, key, opts) {
		const config = this._config.getBackend(correlationId, key);
		let baseUrl = config.baseUrl;
		if (!baseUrl.endsWith('/'))
			baseUrl += '/';

		if (opts && opts.replacements)
			baseUrl = baseUrl.replace(/\{([^\}]+)?}/g, ($1, $2) => { return opts.replacements[$2]; });

		const token = await this._addTokenHeader();
		const headers = {};
		if (config.apiKey)
			headers[LibraryClientConstants.Headers.AuthKeys.API] = config.apiKey;
		if (!(opts && opts.ignoreCorrelationId))
			headers[LibraryClientConstants.Headers.CorrelationId] = correlationId ? correlationId : LibraryCommonUtility.generateId();
		if (token && !(opts && opts.ignoreToken))
			headers[LibraryClientConstants.Headers.AuthKeys.AUTH] = LibraryClientConstants.Headers.AuthKeys.AUTH_BEARER + separator + token;
		headers[acceptType] = (opts?.acceptType ?? contentTypeJson);
		headers[contentType] = (opts?.contentType ?? contentTypeJson);
		// a caller's headers win over the defaults; this built the merged map into opts,
		// where it was never sent
		if (opts && opts.headers)
			Object.assign(headers, opts.headers);

		let options = {
			baseURL: baseUrl,
			headers: headers,
			validateStatus: function (status) {
				return status >= 200 && status <= 503;
			}
		};

		if (config.timeout)
			options.timeout = config.timeout;
		// headers last: opts.headers alone would replace the token and correlation id
		options = { ...options, ...opts, headers };

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
		// bound: axios calls these without the service as `this`
		instance.interceptors.response.use(
			this._interceptorSuccess.bind(this),
			this._interceptorFailure.bind(this)
		);

		return instance;
	}

	async _interceptorFailure(error) {
		// Any status codes that falls outside the range of 2xx cause this function to trigger// Any status codes that falls outside the range of 2xx cause this function to trigger
		// await retry(3, unreliablePromise(3, log('Error'))).then(log('Resolved'))

		// validateStatus accepts 200-503, so a 401 normally reaches _validate, not here
		if (error && error.response && error.response.status === 401) {
			const correlationId = LibraryCommonUtility.correlationId();
			try {
				await this._refreshToken(correlationId, true);
			}
			catch (err) {
				this._logger.exception('AxiosRestCommunicationService', '_interceptorFailure', err, correlationId);
			}
		}

		return Promise.reject(error);
	}

	_interceptorSuccess(response) {
		// Any status code that lie within the range of 2xx cause this function to trigger
		return response;
	}

	_requestNewToken(correlationId, force) {
		// was this._serviceAuth.tokenUser, which no auth service defines
		return this._refreshToken(correlationId, force);
	}

	async _validate(correlationId, response) {
		if (response.status === 200) {
			// TODO: CRC
			// if (response.data.results && response.data.results.data) {
			// 	const dataCheck = crc32(JSON.stringify(response.data.results)).toString(16)
			// 	if (!response.data.check != dataCheck)
			// 		return this._error('AxiosRestCommunicationService', '_validate')
			// }
			return response.data;
		}

		if (response.status === 401) {
			try {
				await this._refreshToken(correlationId, true);
			}
			catch (err) {
				this._logger.exception('AxiosRestCommunicationService', '_validate', err, correlationId);
			}
		}

		return this._error('AxiosRestCommunicationService', '_validate', null, null, null, null, correlationId);
	}
}

export default AxiosRestCommunicationService;
