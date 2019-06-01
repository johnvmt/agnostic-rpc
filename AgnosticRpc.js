import EventEmitter from 'wolfy87-eventemitter';

class AgnosticRpc extends EventEmitter {
	constructor() {
		super();
	}

	static messageIsResponse(encodedMessage) {
		return (AgnosticRpc._validEncodedMessage(encodedMessage) && typeof encodedMessage.response !== 'undefined');
	}

	static messageIsRequest(encodedMessage) {
		return (AgnosticRpc._validEncodedMessage(encodedMessage) && typeof encodedMessage.request !== 'undefined');
	}

	static _validEncodedMessage(encodedMessage) {
		return (typeof encodedMessage === 'object' && encodedMessage !== null && typeof encodedMessage.id !== 'undefined');
	}

	static _uniqueId() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
}

class AgnosticRpcServerRequestController extends EventEmitter {
	constructor(rpcServer, encodedRequest) {
		super();
		const self = this;

		self.rpcServer = rpcServer;
		self.encoded = encodedRequest;
		self.requestId = encodedRequest.id;
		self.request = encodedRequest.request;
		self.options = (encodedRequest.options || {});
		self._canceled = false;

		const onServerRequestEnd = (requestId) => {
			if(requestId === self.requestId) {
				if(!self._canceled) {
					self._canceled = true;
					self.emit('end');
					self.rpcServer.off('end', onServerRequestEnd);
				}
			}
		};

		self.rpcServer.on('end', onServerRequestEnd);

		self.cancel = () => {
			if(self._canceled)
				throw new Error('rpc_canceled');
			else
				self.emit('end');
		};

		self.respond = (response) => {
			self.rpcServer.emit('response', {
				encoded: {
					id: self.requestId,
					response: response
				},
				response: response
			});
		};
	}
}

class AgnosticRpcClientRequestController extends EventEmitter {
	constructor(options) {
		super();
		this._canceled = false;
		this._sentRequest = false;
		this.options = options;
	}

	respond(response) {
		if(this._canceled)
			throw new Error('rpc_canceled');
		else {
			this.emit('response', response);
			if(!this.options.multipleResponses)
				this.cancel();
		}
	}

	request(requestMessage) {
		const self = this;

		if(self._sentRequest && !self.options.multipleRequests)
			throw new Error('multiple_requests_prohibited');
		else {
			self.emit('request', {
				request: requestMessage,
				options: self.options
			});
		}
	}

	cancel() {
		this._canceled = true;
		this.emit('end');
	}
}

class AgnosticRpcServer extends AgnosticRpc {
	constructor() {
		super();
	}

	/**
	 * Handle incoming message of unknown type
	 * If it's a request, process it
	 * Otherwise, ignore it
	 */
	handleMessage(encodedMessage) {
		if(AgnosticRpc.messageIsRequest(encodedMessage))
			return this.handleRequest(encodedMessage);
	}

	/**
	 * Handle incoming request from client
	 * @param encodedRequest
	 */
	handleRequest(encodedRequest) {
		const self = this;

		if(typeof encodedRequest.id === 'undefined')
			throw new Error('id_undefined');
		else {
			const requestId = encodedRequest.id;

			const requestController = new AgnosticRpcServerRequestController(self, encodedRequest);

			requestController.on('end', () => {
				self.emit('end', requestId);
			});

			self.emit('request', requestController);
		}
	}
}

class AgnosticRpcClient extends AgnosticRpc {
	constructor() {
		super();
		this.requests = new Map();
	}

	requestController(passedOptions) {
		const self = this;

		let options = Object.assign({
			multipleResponses: false,
			multipleRequests: false,
			id: AgnosticRpc._uniqueId()
		}, (passedOptions || {}));

		const requestController = new AgnosticRpcClientRequestController(options);

		self.requests.set(options.id, requestController);

		requestController.once('end', function() {
			self.requests.delete(options.id);
		});

		requestController.on('request', function({request, options}) {
			self.emit('request', {
				encoded: {
					id: options.id,
					request: request
				},
				requestId: options.id,
				request: request,
				options: options
			});
		});

		return requestController;
	}

	/**
	 * Send a request
	 * Returns a promise that resolves when request controller ends
	 * @param requestMessage
	 * @param passedOptionsOrResponseCallback
	 * @param responseCallback
	 * @returns {Promise}
	 */
	request(requestMessage, passedOptionsOrResponseCallback, responseCallback) {
		let passedOptions = {};

		if(typeof passedOptionsOrResponseCallback === 'function') // requestMessage, responseCallback
			responseCallback = passedOptionsOrResponseCallback;
		else // requestMessage, passedOptions, [responseCallback]
			passedOptions = passedOptionsOrResponseCallback;

		let requestController = this.requestController(passedOptions);

		return new Promise(function(resolve, reject) {
			let lastResponse;

			requestController.on('response', function(response) {
				lastResponse = response;
				if(typeof responseCallback === 'function')
					responseCallback(response);
			});

			requestController.once('end', function() {
				resolve(lastResponse);
			});

			try {
				requestController.request(requestMessage);
			}
			catch(error) {
				reject(error);
			}
		});
	}

	/**
	 * Handle incoming message of unknown type
	 * If it's a response, process it
	 * Otherwise, ignore it
	 * @param encodedMessage
	 * @returns {*}
	 */
	handleMessage(encodedMessage) {
		if(AgnosticRpc.messageIsResponse(encodedMessage))
			return this.handleResponse(encodedMessage);
	}

	/**
	 * Handle incoming request from client
	 * @param encodedResponse
	 */
	handleResponse(encodedResponse) {
		if(typeof encodedResponse !== 'object' || encodedResponse === null || typeof encodedResponse.response === 'undefined')
			throw new Error('invalid_response');
		else if(typeof encodedResponse.id === 'undefined')
			throw new Error('id_undefined');
		else if(!this.requests.has(encodedResponse.id))
			throw new Error('id_not_found');
		else
			this.requests.get(encodedResponse.id).respond(encodedResponse.response);
	}
}

export {AgnosticRpc, AgnosticRpcClient, AgnosticRpcServer, AgnosticRpcClientRequestController};
