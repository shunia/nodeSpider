var fw = require('./watcher'), 
	gather = require('./gather'), 
	scheduler = require('./scheduler'), 
    confs = [];

// configration folder to monitor
var confs_path = './tasks/';

// start spider excution
function start() {
	// create a watcher to monitor all file changes in the configration folder
	var watcher = new fw(confs_path);

	var fileItem, 
		fileContent, 
		handler = 
			function (fileStatus) {
				// fileStatus is an array contains multiple objects which
				// have properties to 
				// 	identify file type(directory or file),
				// 	file change mode(add, remove, modify), 
				// 	file name
				// 	etc.
				for (var i = fileStatus.length - 1; i >= 0; i--) {
					fileItem = fileStatus[i];
					// different mode will cause different action,
					// the 'gather' has all needed functions to handle
					// these file changes.
					switch (fileItem.mode) {
						// file(s) or folder(s) is(are) added
						case "add" : 
							if (fileItem.type === "file") {
								fileContent = match(fileItem.name, confs_path);
								if (fileContent) {
									gather.g(fileItem.name, fileContent);
								}
							}
						break;
						// file(s) or folder(s) is(are) deleted
						case "remove" : 
							if (fileItem.type === "file") {
								gather.r(fileItem.name);
							}
						break;
						// file(s) is(are) modified, only file(s) change 
						// can trigger this mode
						case "modify" : 
							fileContent = match(fileItem.name, confs_path);
							gather.m(fileItem.name, fileContent);
						break;
					}
				};

				// maintain updated tasks sequence
				scheduler.m(gather.tasks);
			};

	// event listener for changes
	watcher.on("update", handler);
	// watch for file changes every 1000 miliseconds
	watcher.start(1000);
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

	//  eg:/etc/hsots, ~/.npm  
	if (split.length == 1 || (split[0] === "" && split.length == 2)) {
		return "";
	} else {
		return split.pop().toLowerCase();
	}
}

start();
