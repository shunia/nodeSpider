var util = require('util'), 
	utils = require('./utils'), 
	crawler = require('./_crawler');

var task = function (name, conf) {
	// to init super class
	task.super_.apply(this, arguments);
	// definetion below
	var t = this;
	t.name = name;
	t.conf = null;
	t.running = false;
	t.times = 0;
	// secheduded task interval
	t.interval = 0;
	t.valid = false;
	// saved dynamic variables
	t.sdv = null;

	t.update = function (conf) {
		t.conf = t.validate(conf);
		if (t.valid && t.conf) {
			console.log(t.name + ": ");
			console.log(t.conf);
			t.sdv = _filterFuncs(t.conf);
			t.setProps(t.conf);
		}
	};

	t.validate = function (conf) {
		t.valid = conf.base !== undefined || conf.params !== undefined;
		return t.valid ? 
				utils.merge(_base(conf.base), _params(conf.params)) : null;
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
		if (typeof conf === "function") {
			return conf.call(t);
		} else {
			return conf;
		}
	};

	var _params = function (conf) {
		if (typeof conf === "function") {
			return conf.call(t);
		} else {
			return conf;
		}
	};

	var _resolve = function (conf) {

	};

	var _preSend = function (resolver) {
		if (t.sdv) {
			for (var k in t.sdv) {
				t.setProp(k, t.sdv[k].call());
			}
		}
		// super.send
		t.send(resolver);
	};

	var resolver = function (req, res) {
		if (!t.conf.hasOwnProperty("resolve")) return;

		var r = t.conf.resolve;
	};

	// initialize
	if (conf) {
		t.update(conf);
	}
};

util.inherits(task, crawler);

// console.log(utils.merge({"a":1}, {"b":2}));

module.exports = task;