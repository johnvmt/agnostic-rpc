/**
 * Created by jmurphy on 11/27/16.
 */
var UrlRouter = require('agnostic-router');
var Utils = require('./Utils');

function Rpc(nodeRouter) {
	this._requestRouter = UrlRouter();
	this._nodeRouter = nodeRouter;
	this._addressManager = nodeRouter._addressManager;
	this._requests = {};
}

Rpc.prototype.request = function() {
	var parsedArgs = Utils.parseArgs(
		arguments,
		[
			{name: 'connection', level: 0, validate: function(arg, allArgs) { return typeof arg == 'object'; }},
			{name: 'path', level: 0, validate: function(arg, allArgs) { return typeof arg == 'string'; }},
			{name: 'query', level: 1,  validate: function(arg, allArgs) { return typeof arg == 'object'; }, default: {}},
			{name: 'callback', level: 1,  validate: function(arg, allArgs) { return typeof(arg) === 'function'; }},
			{name: 'multipleResponses', level: 1,  validate: function(arg, allArgs) { return typeof arg == 'boolean'; }, default: false}
		]
	);

	var requestId = Utils.uniqueId();

	if(typeof parsedArgs.callback == 'function')
		this._requests[requestId] = {callback: parsedArgs.callback, multipleResponses: parsedArgs.multipleResponses};

	console.log(parsedArgs);

	parsedArgs.connection.emit({
		type: 'router',
		message: {
			requestId: requestId,
			path: parsedArgs.path,
			query: parsedArgs.query
		}
	});
};

Rpc.prototype.handleResponse = function(connection, message) {
	if(typeof this._requests)

		};

Rpc.prototype.handleRequest = function(connection, message) {
	//console.log("AMAN", this._addressManager.allocate());

	// change to respond?

	//console.log("HREQ", connection, path, query, requestId);

	/*
	 // TODO move into agnostic-router
	 switch(path) {
	 case "dhcprequest":
	 connection.emit({
	 type: 'routing',
	 requestId: requestId,
	 response: this._addressManager.allocate()
	 });
	 break;
	 }
	 */

};

Rpc.prototype.handle = function(connection, message) {
	if(typeof message.response != 'undefined') // response to request from this node
		this.handleResponse(connection, message);
	else // request to this node
		this.handleRequest(connection, message);
};

module.exports = function(nodeRouter) {
	return new Rpc(nodeRouter);
};