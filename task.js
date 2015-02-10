var util = require('util'), 
	utils = require('./utils'), 
	crawler = require('./_crawler');

var task = function (name, conf) {
	var t = this;
	t.name = name;
	t.conf = {};
	t.running = false;
	// saved dynamic variables
	t.sdv = null;

	t.update = function (conf) {
		t.validate.apply(null, [conf]);

		if (t.valid) {
			utils.merge(t.conf, _base(t._conf.base), _params(t._conf.params));
			// console.log(t.name + ": ");
			// console.log(t.conf);
			t.sdv = _filterFuncs(t.conf);
			this.setProps(t.conf);
		}
	};

	t.validate = function (conf) {
		t.valid = conf.base || conf.params;
		t._conf = t.valid ? conf : null;
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
		return conf;
	};

	var _params = function (conf) {
		return conf;
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

	// initialize
	if (conf) {
		t.update.apply(null, [conf]);
	}

	var resolver = function (req, res) {
		if (!t.conf.hasOwnProperty("resolve")) return;

		var r = t.conf.resolve;
	};
}

util.inherits(task, crawler);

module.exports = task;