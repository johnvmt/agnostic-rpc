var rpc1 = require('../')();
var rpc2 = require('../')();

// NODE 1
var requestMessage = rpc1.request({
	path: "somepath",
	query: {
		param: "value"
	}
}, function(error, response) {
	console.log("RESPONSE", error, response);
});

// NODE 2
function requestCallback(request, respond) {
	console.log(request);

	respond({
		response2: "response"
	});
}

function responseEmitter(responseMessage) {
	rpc1.handleResponse(responseMessage);
}

rpc2.handleRequest(requestMessage, requestCallback, responseEmitter);