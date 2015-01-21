var Task = require("./task"), 
	tasks = [];

function gather(n, conf) {
	if (conf) {
		var task = new Task(conf);
		if (task.valid) {
			tasks.push(task);
		}
	}
}

function remove(n) {

}

function modify(n, conf) {

}

module.exports.tasks = tasks;
module.exports.g = gather;
module.exports.r = remove;
module.exports.m = modify;