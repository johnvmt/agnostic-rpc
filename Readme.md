# Agnostic RPC #

Basic RPC handler for server and client, written in JavaScript. Useful, for example, when transmitting requests and responses over Socket.io to ensure responses are returned to the function that made the request.

## Requirements ##

None

## Quick Start ##

	// Client Node
	var rpcClient = require('agnostic-rpc')();
	var requestMessage = rpcClient.request("node-request",
		function(error, response) {
			console.log(error, response);	
		}
	);

	// Server Node
	var rpcServer = require('agnostic-rpc')();
	function requestCallback(request, respond) {
		// Do something with the request
		respond("node-response");
	}

	rpcServer.handleRequest(requestMessage, requestCallback, responseEmitter);

	// Transmission would happen here
	function responseEmitter(responseMessage) {
		rpcClient.handleResponse(responseMessage);
	}

## TODOs ##

- Timeouts
- Passing options between client and server