var Utils = require('./Utils');

function Rpc() {
	this._requests = {};
}

Rpc.prototype.request = function() {
	var parsedArgs = Utils.parseArgs(
		arguments,
		[
			{name: 'query', level: 0,  validate: function(arg, allArgs) { return typeof arg == 'object'; }},
			{name: 'options', level: 1,  validate: function(arg, allArgs) { return typeof arg == 'object'; }, default: {}},
			{name: 'callback', level: 1,  validate: function(arg, allArgs) { return typeof(arg) === 'function'; }}
		]
	);

	var defaultOptions = {
		multipleResponses: false
	};

	// TODO add timeout option
	var options = Utils.objectMerge(defaultOptions, parsedArgs.options); // merge options with defaults

	if(typeof parsedArgs.callback == 'function') {
		var requestId = Utils.uniqueId();
		this._requests[requestId] = {callback: parsedArgs.callback, options: options};
	}

	var request = {
		query: parsedArgs.query
	};

	if(typeof requestId != 'undefined')
		request.id = requestId;

	return request;
};

Rpc.prototype.handleResponse = function(message) {
	if(typeof message.id == 'string') { // responding to a logged request
		if(typeof this._requests[message.id] == 'object') { // request is logged
			var request = this._requests[message.id];
			if(typeof request.callback == 'function') // valid callback is logged
				request.callback(null, message.response); // callback with no error
			if(!request.options['multipleResponses'])
				delete this._requests[message.id];
		}
	}
	// TODO trigger errors
};

Rpc.prototype.handleRequest = function(requestMessage, requestCallback, responseEmitter) {
	var onResponse = function(response) {
		var responseMessage = {
			response: response
		};

		if(typeof requestMessage.id == 'string')
			responseMessage.id = requestMessage.id;

		responseEmitter(responseMessage);
	};

	requestCallback(requestMessage.query, onResponse);

	// TODO trigger errors
};

Rpc.prototype.handle = function(message) {
	if(typeof message.response != 'undefined') // response to request from this node
		this.handleResponse(message);
	else // request to this node
		this.handleRequest(message);
};

module.exports = function(nodeRouter) {
	return new Rpc(nodeRouter);
};