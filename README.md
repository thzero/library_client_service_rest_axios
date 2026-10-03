![GitHub package.json version](https://img.shields.io/github/package-json/v/thzero/library_client_service_rest_axios)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# library_client_service_rest_axios

The REST communication service for [library_client](https://github.com/thzero/library_client), built on [axios](https://axios-http.com). [library_client_service_rest_fetch](https://github.com/thzero/library_client_service_rest_fetch) is the same service on the browser's `fetch`, with no dependencies.

## Requirements

### NodeJs

[NodeJs](https://nodejs.org) version 22+.

## Installation

[![NPM](https://nodei.co/npm/@thzero/library_client_service_rest_axios.png?compact=true)](https://npmjs.org/package/@thzero/library_client_service_rest_axios)

```
npm install @thzero/library_client_service_rest_axios
```

It installs `axios`, and requires `@thzero/library_client` and `@thzero/library_common` as peers.

## Usage

Register it in the application's services boot:

```js
import restCommunicationService from '@thzero/library_client_service_rest_axios';

class ServiceBoot extends RootServicesBoot {
	_initializeCommunicationRest() {
		return new restCommunicationService();
	}
}
```

A service then calls it with the `key` of a `backend` entry from the configuration (see [library_client](https://github.com/thzero/library_client#configuration)):

```js
const response = await this._serviceCommunicationRest.getById(correlationId, LibraryClientConstants.ExternalKeys.BACKEND, 'launches', id);
```

| Method | |
|---|---|
| `get(correlationId, key, url, options)` | |
| `getById(correlationId, key, url, id, options)` | `id` is appended to `url` |
| `post(correlationId, key, url, body, options)` | |
| `postById(correlationId, key, url, id, body, options)` | |
| `delete(correlationId, key, url, options)` | |
| `deleteById(correlationId, key, url, id, options)` | |

Each request sends the backend's `apiKey`, the correlation id, the signed-in user's token, and JSON accept and content types. Each returns the server's JSON response on a 200, or an error response otherwise. On a 401 it refreshes the user's token first, so the caller can try again. The backend's `timeout` setting, if present, becomes the axios timeout.

### Options

| Option | |
|---|---|
| `headers` | extra headers; they override the defaults |
| `acceptType`, `contentType` | instead of `application/json` |
| `ignoreCorrelationId` | send no correlation id |
| `ignoreToken` | send no authorization token |
| `replacements` | values for `{name}` placeholders in the backend's `baseUrl` |

Any other option is passed to `axios.create` as part of its configuration.

## Development

```
npm install
npm test
npm run lint
```

Tests use [Vitest](https://vitest.dev); the `test` folder and the configuration files are not published.

## License

[MIT](license.md)
