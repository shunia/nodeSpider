var util = require('util'), 
	fs = require('fs'), 
	events = require('events');

// constructor for watching task
var watch = function () {

	var w = this;
	// root folder for watching
	w.root = null;
	// count down id of folder checking, save for stop
	w.interval = null;
	// checking rate of given path, in miliseconds
	w.checkRate = null;

	this.start = function (intervel, folder) {
		w.root = folder;
		w.checkRate = interval;

		if (pathValid(folder)) {
			_start();
		}
	};

	this.stop = function () {
		clearInterval(w.interval);
	};

	var pathValid = function (p) {

	};

	var _start = function () {
		w.interval = setInterval(function () {
			_scan(w.root);
		}, w.checkRate);
	};

	var _scan = function (p) {
		fs.readdir(p, function (err, files) {
			if (err) throw err;

			
		})
	};

};

// actual watcher to trigger events for listening
var file = function () {

};

util.inherits(watch, events.EventEmitter);

module.exports = watch;