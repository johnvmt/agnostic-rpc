var assert = require('assert');
var oms = require('../')(); // use defaults (localhost/test) as defined in defaults.js

describe('Send and receive', function() {
	it('should make a request, receive the request and respond', function(done) {

		var rpc1 = require('../')();
		var rpc2 = require('../')();

		// NODE 1
		var requestMessage = rpc1.request("node-request",
			function(error, response) {
			if(error)
				throw new Error(error);
			else if(response == "node-response")
				done();
			else
				throw new Error("Unexpected response " + response);
		});

		// NODE 2
		function requestCallback(request, respond) {
			if(request != "node-request")
				throw new Error("Wrong request " + request);
			else
				respond("node-response");
		}

		function responseEmitter(responseMessage) {
			rpc1.handleResponse(responseMessage);
		}

		rpc2.handleRequest(requestMessage, requestCallback, responseEmitter);
	});
});