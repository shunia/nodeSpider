var fs = require('fs'), 
	path = require('path'), 
	fw = require('./module/fswatcher/fswatcher'), 
	gather = require('./gather'), 
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

	var fi, // file object invoked by fswatcher
		fc, // file content
		toItemName = 
			function (item) {
				var re = path.relative(confs_path, item.path), 
					p = re.split(path.sep), 
					result = p.join("-");
				return result;
			}, 
		handler = 
			function (fileStatus) {
				// fileStatus is an array contains multiple objects which
				// have properties to 
				// 	identify file type(directory or file),
				// 	file change mode(add, remove, modify), 
				// 	file name
				// 	etc.
				// console.log(fileStatus);
				var l = fileStatus.length;
				for (var i = 0; i < l; i++) {
					fi = fileStatus[i];
					// console.log("file index: " + i + ", file item: ");
					// console.log(fi);
					// accepts file only
					if (fi.item.isFile) {
						// different mode will cause different action,
						// the 'gather' has all needed functions to handle
						// these file changes.
						switch (fi.mode) {
							// file(s) or folder(s) is(are) added
							case "add" : 
								fc = match(fi.item.path);
								if (fc) {
									gather.g(toItemName(fi.item), fc);
								}
							break;
							// file(s) or folder(s) is(are) deleted
							case "remove" : 
								gather.r(toItemName(fi.item));
							break;
							// file(s) is(are) modified, only file(s) change 
							// can trigger this mode
							case "modify" : 
								fc = match(fi.item.path);
								gather.m(toItemName(fi.item), fc);
							break;
						}
					}
				}
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
function match(filePath) {
	var ext = safeExt(filePath), 
		content = null;
	if (ext === "js") {
		content = require(filePath);
	} else if (ext === "json") {
		content = JSON.parse(fs.readFileSync(filePath, "utf8"));
	}

	// console.log("file content at " + filePath);
	// console.log(content);

	return content;
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
