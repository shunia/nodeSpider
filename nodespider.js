var fw = require('./watcher'), 
	gather = require('./gather'), 
	scheduler = require('./scheduler'), 
    confs = [];

// configration folder to monitor
var confs_path = './tasks/', 
	confs;

// start spider excution
function start() {
	// init default configuration
	confs = initConf();
	// command line support
	argsReader();
	// create a watcher to monitor all file changes in the configration folder
	var watcher = new fw(confs);

	var fi, 
		fc, 
		handler = 
			function (fileStatus) {
				// fileStatus is an array contains multiple objects which
				// have properties to 
				// 	identify file type(directory or file),
				// 	file change mode(add, remove, modify), 
				// 	file name
				// 	etc.
				for (var i = fileStatus.length - 1; i >= 0; i--) {
					fi = fileStatus[i];
					// different mode will cause different action,
					// the 'gather' has all needed functions to handle
					// these file changes.
					switch (fi.mode) {
						// file(s) or folder(s) is(are) added
						case "add" : 
							if (fi.type === "f") {
								fc = match(fi.file.name, confs_path);
								if (fc) {
									gather.g(fi.file.name, fc);
								}
							}
						break;
						// file(s) or folder(s) is(are) deleted
						case "remove" : 
							if (fi.type === "f") {
								gather.r(fi.file.name);
							}
						break;
						// file(s) is(are) modified, only file(s) change 
						// can trigger this mode
						case "modify" : 
							fc = match(fi.name, confs_path);
							gather.m(fi.file.name, fc);
						break;
					}
				};

				// maintain updated task's sequence
				scheduler.m(gather.tasks);
			};

	// event listener for changes
	watcher.on("update", handler);
	// watch for file changes every 1000 miliseconds
	watcher.start(5000, confs_path);
}

function argsReader() {
	var args = process.argv.slice(2);
	if (args && args.length) {
		console.log("Main: Parameters -> " + args);
		// watching folder
		confs_path = _argsReader("-path", args) || confs_path;
		// async IO operations
		confs.async = _argsReader("-async", args) == "true";
	}
}

function _argsReader(prop, args) {
	var i = args.indexOf(prop);
	if (i != -1) {
		return args[i + 1];
	} else {
		return null;
	}
}

function initConf() {
	var c = {};
	c.folder = confs_path;
	c.async = true;
	return c;
}

// match given path and filename, and try to resolve it's content.
// since we will only accept "js" and "json" file for excution,
// when "js" file matched, dynamiclly require it to be handled,
// when "json" file matched, read the content of the json file 
// and parse it to object to be handled.
function match(fileName, _path) {
	var ext = safeExt(fileName);
	if (ext === "js") {
		return require(path.join(_path, fileName));
	} else if (ext === "json") {
		return JSON.parse(fs.readFileSync(path.join(_path + fileName), "utf8"));
	} else {
		return null;
	}
}

// handy function to get extension(in string) of given file name,
// and lower-case it.
function safeExt(fileName) {
	var split = fileName.split(".");

	//  eg:/etc/hsots, ~/.bashrc  
	if (split.length == 1 || (split[0] === "" && split.length == 2)) {
		return "";
	} else {
		return split.pop().toLowerCase();
	}
}

start();
