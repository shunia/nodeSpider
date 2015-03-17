var http = require('http'), 
	querystring = require('querystring');

/*
 * Official api documents for http request options: 
 *
 *	Options:
 *
 *	host: A domain name or IP address of the server to issue the request to. Defaults to 'localhost'.
 *	hostname: To support url.parse() hostname is preferred over host
 *	port: Port of remote server. Defaults to 80.
 *	localAddress: Local interface to bind for network connections.
 *	socketPath: Unix Domain Socket (use one of host:port or socketPath)
 *	method: A string specifying the HTTP request method. Defaults to 'GET'.
 *	path: Request path. Defaults to '/'. Should include query string if any. E.G. '/index.html?page=12'. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future.
 *	headers: An object containing request headers.
 *	auth: Basic authentication i.e. 'user:password' to compute an Authorization header.
 *	agent: Controls Agent behavior. When an Agent is used request will default to Connection: keep-alive. Possible values:
 *	undefined (default): use global Agent for this host and port.
 *	Agent object: explicitly use the passed in Agent.
 *	false: opts out of connection pooling with an Agent, defaults request to Connection: close.
 *	keepAlive: {Boolean} Keep sockets around in a pool to be used by other requests in the future. Default = false
 *	keepAliveMsecs: {Integer} When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Default = 1000. Only relevant if keepAlive is set to true.
 *		
 */
var _crawler = function () {
	_crawler.init.apply(this, arguments);
};

module.exports = _crawler;

_crawler.init = function () {
	this.opts = null;
	this.reqs = [];
	this.req = null;
	// quick if determine
	this.isGET = true;
};

// set properties, this function will replace the whole 
// opts object
_crawler.prototype.setProps = function (object) {
	this.opts = object;

	if (this.opts && this.opts.hasOwnProperty("method")) {
		this.isGET = this.opts["method"] === "GET";
	}
};

	// set single property by key
_crawler.prototype.setProp = function (key, value) {
	if (!this.opts) return;
	this.opts[key] = value;
};

	// send out request
_crawler.prototype.send = function (cb) {
	if (!this.opts) return;
	// url is the required property of the opts object
	if (!this.opts.hasOwnProperty("url")) return;
	_crawler._send.apply(this, cb);
};

// close current request
_crawler.prototype.close = function () {
	// since there is no api for closing a working request,
	// leaves this function to be empty
};

// handle data and send out request
_crawler._send = function (cb) {
	console.log(this.opts);
	// generate request
	var req = http.request(this.opts, function (res) {
		console.log(res);
		_crawler._clearAfter(req, res);
		// apply for resolve
		if (cb) {
			cb.apply(null, [req, res]);
		}
	});
	// save it for now
	this.req = req;
	// listen for errors
	this.req.on('error', function (e) {
		_crawler._clearAfter(req, res);
		throw e;
	});
	// if is POST request, pipe data into stream
	if (!this.isGET && this.opts.data) {
		this.req.write(this.opts.data);
	}
	// end request and send it out
	this.req.end();
	// save for clear
	this.reqs.push(this.req);
};

// clear cached requests and responses
_crawler._clearAfter = function (req, res) {
	if (this.req === req) this.req = null;
	if (this.reqs.contains(req)) this.slice(this.indexOf(req), 1);
};
