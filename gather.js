var Task = require("./task"), 
	dict = {};

function gather(n, conf) {
	if (has(n)) return;

	if (conf) {
		var task = new Task(n, conf);
		if (task.valid) {
			dict[n] = task;
		}
		task.start();
	}
}

function remove(n) {
	var task = get(n);
	if (task) {
		task.stop();
		delete dict[n];
	}
}

function modify(n, conf) {
	var task = get(n);
	if (task) {
		task.stop();
		task.update(conf);
	}
	task.start();
}

function has(n) {
	return dict.hasOwnProperty(n);
}

function get(n) {
	return has(n) ? dict[n] : null;
}

module.exports.g = gather;
module.exports.r = remove;
module.exports.m = modify;