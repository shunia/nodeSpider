var util = require('util'), 
	utils = require('./utils'), 
	crawler = require('./_crawler');

var task = function (name, conf) {
	var t = this;
	t.name = name;
	t.conf = {};
	t.running = false;

	t.update = function (conf) {
		t.validate.apply(null, [conf]);

		if (t.valid) {
			utils.merge(t.conf, _base(t._conf.base), _params(t._conf.params));
			// console.log(t.name + ": ");
			// console.log(t.conf);
			this.setProps(t.conf);
		}
	};

	t.validate = function (conf) {
		t.valid = conf.base || conf.params;
		t._conf = t.valid ? conf : null;
	};

	t.start = function () {
		t.running = true;
		console.log("task starting: " + t.name);
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

	var _base = function (conf) {
		return conf;
	};

	var _params = function (conf) {
		return conf;
	};

	if (conf) {
		t.update.apply(null, [conf]);
	}
}

util.inherits(task, crawler);

module.exports = task;