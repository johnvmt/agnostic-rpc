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

class AgnosticRpcRequestController extends EventEmitter {
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

			self.emit('request', {
				encoded: encodedRequest,
				request: encodedRequest.request,
				options: (encodedRequest.options || {}),
				respond: function(response) {
					self.emit('response', {
						encoded: {
							id: requestId,
							response: response
						},
						response: response
					});
				}
			});
		}
	}
}

class AgnosticRpcClient extends AgnosticRpc {
	constructor() {
		super();
		this._requests = {};
	}

	requestController(passedOptions) {
		const self = this;

		let options = Object.assign({
			multipleResponses: false,
			multipleRequests: false,
			id: AgnosticRpc._uniqueId()
		}, (passedOptions || {}));

		self._requests[options.id] = new AgnosticRpcRequestController(options);

		self._requests[options.id].once('end', function() {
			delete self._requests[options.id];
		});

		self._requests[options.id].on('request', function({request, options}) {
			self.emit('request', {
				encoded: {
					id: options.id,
					request: request
				},
				request: request,
				options: options
			});
		});

		return self._requests[options.id];
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
		else if(typeof this._requests[encodedResponse.id] !== 'object')
			throw new Error('id_not_found');
		else
			this._requests[encodedResponse.id].respond(encodedResponse.response);
	}
}

export {AgnosticRpc, AgnosticRpcClient, AgnosticRpcServer, AgnosticRpcRequestController};
