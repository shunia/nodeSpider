var util = require('util'), 
	utils = require('./utils'), 
	crawler = require('./_crawler');

var task = function (name, conf) {
	// to init super class to extend it's prototype functions
	task.super_.apply(this, arguments);
	// definetion below
	var t = this;
	t.name = name;
	// saved original config
	t._conf = null;
	t.conf = null;
	t.running = false;
	t.times = 0;
	// secheduded task interval
	t.interval = 0;
	t.valid = false;
	// saved dynamic variables
	t.sdv = null;
	// saved dynamic properties
	t.sdp = null;

	t.update = function (conf) {
		t._conf = conf;
		if (t.validate(t._conf)) {
			// _update();
			_updateTest();
		}
	};

	var _update = function () {
		// save conf functions first
		t.sdp = _filterFuncs(t._conf);
		// join config objects into one
		// if there were functions in base or params, it will be resolved into object
		t.conf = utils.merge(_base(t._conf.base), _params(t._conf.params));
		// save variables functions 
		t.sdv = _filterFuncs(t.conf);
	};

	var _updateTest = function () {
		if (t.sdp) {
			t.conf = utils.merge(_base(t._conf.base), _params(t._conf.params));
			t.sdv = _filterFuncs(t.conf);
		} else {
			t.sdp = _filterFuncs(t._conf);
		}
	};

	t.validate = function (conf) {
		t.valid = false;
		t.valid = conf.base || conf.params;
		return t.valid;
	};

	t.start = function () {
		if (!t.valid) return;
		t.running = true;
		console.log("task starting: " + t.name);
		_preSend(resolver);
	};

	t.restart = function () {
		console.log("task restarting: " + t.name);
		t.stop.apply();
		t.start.apply();
		console.log("task restarted: " + t.name);
	};

	t.stop = function () {
		t.running = false;
		console.log("task stopping: " + t.name);
	};

	var _filterFuncs = function (obj) {
		var result = null;
		for (var k in obj) {
			if (typeof obj[k] === "function") {
				if (!result) result = {};
				result[k] = obj[k];
			}
		}
		return result;
	};

	var _base = function (conf) {
		// if (typeof conf === "function") {
		// 	return null;
		// } else {
			return conf;
		// }
	};

	var _params = function (conf) {
		// if (typeof conf === "function") {
		// 	return null;
		// } else {
			return conf;
		// }
	};

	var _resolve = function (conf) {

	};

	var _preSend = function (resolver) {
		// check if config contains function call
		_releaseSavedProperties();
		// check variables contain function call
		_releaseSavedVariables();
		// wrap confs to http variables
		// and do it every time before send out
		// TO-DO
		t.setProps(new wrapper(t.conf));
		// super.send
		t.send(resolver);
	};

	var _releaseSavedProperties = function () {
		if (t.sdp) {
			// _update();
			_updateTest();
		}
	};

	var _releaseSavedVariables = function () {
		if (t.sdv) {
			for (var k in t.sdv) {
				t.conf[k] = t.sdv[k].call(t);
			}
		}
	};

	var resolver = function (req, res) {
		console.log("req: " + req);
		if (!t.conf.hasOwnProperty("resolve")) return;

		var r = t.conf.resolve;
	};

	// initialize
	if (conf) {
		t.update(conf);
	}

	var wrapper = function (conf) {
		console.log(conf);
	};
};

util.inherits(task, crawler);

module.exports = task;