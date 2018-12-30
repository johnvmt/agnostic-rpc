# Agnostic RPC #

Attach an ID to remote procedure call to return results to the function that requested them.
Useful, for example, when transmitting multiple requests and responses to a remote server over websockets, where the responses may come back out of order.

## Quick Start ##

### Single request, single response, with Promise ###

	const rpcServer = new AgnosticRpcServer();
	const rpcClient = new AgnosticRpcClient();

	rpcServer.on('request', function({request, options, respond}) {
		// Server logic goes here
		respond('response-message');
	});

	rpcServer.on('response', function(encodedResponse) {
		// Transmission of encoded response from server to client goes here
		// In this example, they're directly connected
		rpcClient.handleResponse(encodedResponse);
	});

	rpcClient.on('request', function(encodedRequest) {
		// Transmission of encoded request from client to server goes here
		// In this example, they're directly connected
		rpcServer.handleRequest(encodedRequest);
	});

	rpcClient.request('request-message')
		.then(function(response) {
			// Response should equal 'response-message'

		});


### Single request, multiple responses, with Promise ###

	const rpcServer = new AgnosticRpcServer();
	const rpcClient = new AgnosticRpcClient();

	rpcServer.on('request', function({request, options, respond}) {
		// Server logic goes here
		respond('response-message-1');
		respond('response-message-2');
	});

	rpcServer.on('response', function(encodedResponse) {
		// Transmission of encoded response from server to client goes here
		// In this example, they're directly connected
		rpcClient.handleResponse(encodedResponse);
	});

	rpcClient.on('request', function(encodedRequest) {
		// Transmission of encoded request from client to server goes here
		// In this example, they're directly connected
		rpcServer.handleRequest(encodedRequest);
	});

	rpcClient.request('request-message', {
		multipleResponses: true
	}, function(response) {
		// First response should equal 'response-message-1'
		// Second response should equal 'response-message-2'
	})
	.then(function(response) {
		// This will not execute until the request is canceled
	});

### Single request, multiple responses, with controller ###

	const rpcServer = new AgnosticRpcServer();
	const rpcClient = new AgnosticRpcClient();

	rpcServer.on('request', function({request, options, respond}) {
		// Server logic goes here
		respond('response-message-1');
		respond('response-message-2');
		respond('response-message-last');
	});

	rpcServer.on('response', function(encodedResponse) {
		// Transmission of encoded response from server to client goes here
		// In this example, they're directly connected
		rpcClient.handleResponse(encodedResponse);
	});

	rpcClient.on('request', function(encodedRequest) {
		// Transmission of encoded request from client to server goes here
		// In this example, they're directly connected
		rpcServer.handleRequest(encodedRequest);
	});

	let rpcRequest = rpcClient.requestController({
		multipleResponses: true
	});

	rpcRequest.request('request-message');

	rpcRequest.on('response', function(response) {
		// First response should equal 'response-message-1'
        // Second response should equal 'response-message-2'
        if(response === 'response-message-last')
        	rpcRequest.cancel();
	});

	rpcRequest.on('end', function() {
		// Called right after cancel
	});

## TODOs ##

- Timeouts
