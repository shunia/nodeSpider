var http = require('http'), 
	querystring = require('querystring');

var _crawler = function () {
	var c = this;
	c.opts = null;
	c.reqs = [];
	c.req = null;
	// quick if determine
	c.isGET = true;

	// set properties, this function will replace the whole 
	// opts object
	c.setProps = function (object) {
		c.opts = object;

		if (c.opts && c.opts.hasOwnProperty("method")) {
			c.isGET = c.opts["method"] === "GET";
		}
	};

	// set single property by key
	c.setProp = function (key, value) {
		if (!c.opts) return;
		c.opts[key] = value;
	};

	// send out request
	c.send = function (cb) {
		if (!c.opts) return;
		// url is the main property of the opts object
		if (!c.opts.hasOwnProperty("url")) return;
		_send(cb);
	};

	// close current request
	c.close = function () {
		// since there is no api for closing a working request,
		// leaves this function to be empty
	};

	// handle data and send out request
	var _send = function (cb) {
		// generate request
		var req = http.request(c.props, function (res) {
			_clearAfter(req, res);
			// apply for resolve
			if (cb) {
				cb.apply(null, [req, res]);
			}
		});
		// save it for now
		c.req = req;
		// listen for errors
		c.req.on('error', function (e) {
			_clearAfter(req, res);
			throw e;
		});
		// if is POST request, pipe data into stream
		if (!c.isGET && c.opts.data) {
			c.req.write(c.opts.data);
		}
		// end request and send it out
		c.req.end();
		// save for clear
		c.reqs.push(c.req);
	};

	// clear cached requests and responses
	var _clearAfter = function (req, res) {
		if (c.req === req) c.req = null;
		if (c.reqs.contains(req)) c.slice(c.indexOf(req), 1);
	};

};

module.exports = _crawler;