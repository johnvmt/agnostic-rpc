# Agnostic RPC #

Attach an ID to remote procedure call to return results to the function that requested them.
Useful, for example, when transmitting multiple requests and responses to a remote server over websockets, where the responses may come back out of order.

## Quick Start ##

### Single request, single response, with Promise ###

```js
const rpcServer = new AgnosticRpcServer();
const rpcClient = new AgnosticRpcClient();

rpcServer.on('request', function({request, options, respond}) {
	// Server logic goes here
	respond('response-message');
});

rpcServer.on('response', function(response) {
	let encodedResponse = response.encoded;
	// Transmission of encoded response from server to client goes here
	// In this example, they're directly connected
	rpcClient.handleResponse(encodedResponse);
});

rpcClient.on('request', function(request) {
	let requestEncoded = request.encoded;
	// Transmission of encoded request from client to server goes here
	// In this example, they're directly connected
	rpcServer.handleRequest(requestEncoded);
});

rpcClient.request('request-message')
	.then(function(response) {
		// Response should equal 'response-message'

	});
```

### Single request, multiple responses, with Promise ###

```js
const rpcServer = new AgnosticRpcServer();
const rpcClient = new AgnosticRpcClient();

rpcServer.on('request', function({request, options, respond, cancel}) {
	// Server logic goes here
	respond('response-message-1');
	respond('response-message-2');
	cancel(); // Cancel after two responses sent
});

rpcServer.on('response', function(response) {
	let encodedResponse = response.encoded;
	// Transmission of encoded response from server to client goes here
	// In this example, they're directly connected
	rpcClient.handleResponse(encodedResponse);
});

rpcClient.on('request', function(request) {
	let requestEncoded = request.encoded;
	// Transmission of encoded request from client to server goes here
	// In this example, they're directly connected
	rpcServer.handleRequest(requestEncoded);
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
```

### Single request, multiple responses, with controller ###

```js
const rpcServer = new AgnosticRpcServer();
const rpcClient = new AgnosticRpcClient();

rpcServer.on('request', function({request, options, respond}) {
	// Server logic goes here
	respond('response-message-1');
	respond('response-message-2');
	respond('response-message-last');
});

rpcServer.on('response', function(response) {
	let encodedResponse = response.encoded;
	// Transmission of encoded response from server to client goes here
	// In this example, they're directly connected
	rpcClient.handleResponse(encodedResponse);
});

rpcClient.on('request', function(request) {
	let requestEncoded = request.encoded;
	// Transmission of encoded request from client to server goes here
	// In this example, they're directly connected
	rpcServer.handleRequest(requestEncoded);
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
```

## Changes ##

- v1.2.0: RPCServer's 'request' event now emits requestController with a cancel function

## TODOs ##

- Timeouts
