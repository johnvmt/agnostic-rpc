/* global describe, it, before */

const chai = require('chai');
let {AgnosticRpcServer, AgnosticRpcClient} = require('../index');

chai.expect();

const expect = chai.expect;

describe('Using requestController', () => {
	describe('Single request, single response', () => {
		it('should check the first and only response', () => {
			const rpcServer = new AgnosticRpcServer();
			const rpcClient = new AgnosticRpcClient();

			rpcServer.on('request', function({request, options, respond}) {
				if(request === 'request-message')
					respond('response-message');
				else
					respond('unknown-response');
			});

			rpcServer.on('response', function(response) {
				// Transmit encoded request from client to server here
				rpcClient.handleResponse(response.encoded);
			});

			rpcClient.on('request', function(request) {
				// Transmit encoded request from client to server here
				rpcServer.handleRequest(request.encoded);
			});

			let rpcRequest = rpcClient.requestController();

			rpcRequest.request('request-message');

			rpcRequest.on('response', function(response) {
				expect(response).to.be.equal('response-message');
			});

			rpcRequest.on('end', function() {
				throw new Error('Ended before response');
			});
		});
	});
});

describe('Using request', () => {
	describe('Single request, single response', () => {
		it('should check the first and only response', () => {
			const rpcServer = new AgnosticRpcServer();
			const rpcClient = new AgnosticRpcClient();

			rpcServer.on('request', function({request, options, respond}) {
				if(request === 'request-message')
					respond('response-message');
				else
					respond('unknown-response');
			});

			rpcServer.on('response', function(response) {
				// Transmit encoded request from client to server here
				rpcClient.handleResponse(response.encoded);
			});

			rpcClient.on('request', function(request) {
				// Transmit encoded request from client to server here
				rpcServer.handleRequest(request.encoded);
			});

			rpcClient.request('request-message')
				.then(function(response) {
					expect(response).to.be.equal('response-message');
				});

		});
	});

	describe('Single request, multiple response', () => {
		it('should check 5 responses, spaced 100ms apart', (done) => {
			const rpcServer = new AgnosticRpcServer();
			const rpcClient = new AgnosticRpcClient();

			let responsesSent = 0;
			let responsesReceived = 0;
			let responsesMax = 5;
			let responseInterval;

			rpcServer.on('request', function({request, options, respond}) {
				if(request === 'request-message') {
					responseInterval = setInterval(function() {
						responsesSent++;
						respond({response: responsesSent});
					}, 100);
				}
				else
					respond('unknown-response');
			});

			rpcServer.on('response', function(response) {
				// Transmit encoded request from client to server here
				rpcClient.handleResponse(response.encoded);
			});

			rpcClient.on('request', function(request) {
				// Transmit encoded request from client to server here
				rpcServer.handleRequest(request.encoded);
			});

			rpcClient.request('request-message', {
				multipleResponses: true
			}, function(response) {
				responsesReceived++;
				if(responsesReceived !== responsesSent)
					throw new Error('Mismatch between number of responses sent and received');
				else if(response.response !== responsesSent)
					throw new Error('Wrong response');
				else if(responsesReceived === responsesMax) {
					clearInterval(responseInterval);
					done();
				}
			});
		});
	});
});
