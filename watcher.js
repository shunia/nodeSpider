var util = require('util'), 
	fs = require('fs'), 
	path = require('path'), 
	events = require('events');

// constructor for watching task
var watch = function (confs) {
	// save for conflicts
	var w = this;
	// flag to indicate whether inited or not
	w.__init = false;
	// confs to define optional branch in the codes
	w.confs = confs || {};
	// whether async or not
	w.async = ("async" in w.confs) ? w.confs["async"] : true;
	// root folder for watching
	w.root = null;
	// count down id of folder checking, save for stop
	w.interval = null;
	// checking rate of given path, in miliseconds
	w.checkRate = null;
	// original or last file stat infos
	w.originalStructure = null;
	// new file stat infos
	w.currentStructure = null;

	w.start = function (intervel, folder) {
		w.root = folder;
		w.checkRate = intervel ? intervel : 5000;

		if (pathValid(w.root)) {
			console.log("watcher: Watching on '" + w.root + "' start, async: " + w.async);

			_start();
		}
	};

	w.stop = function () {
		_stop();
	};

	var pathValid = function (p) {
		return true;
	};

	var _start = function () {
		if (!w.__init) {
			w.__init = true;

			w.__start =  
				function () {
					// stop first, and wait for file stat finished
					_stop();
					// constructs new structure for compare before 
					// _scan starts
					w.originalStructure = w.currentStructure;
					w.currentStructure = new structure(w.root);
					// start scan
					_scan(w.root);
				};
			w.__start.apply();
		} else {
			w.interval = setInterval(w.__start, w.checkRate);
		}
	};

	var _stop = function () {
		// clear interval if exists
		if (w.interval) {
			clearInterval(w.interval);
			w.interval = -1;
		}
	};

	var _scan = function (p) {
		fs.readdir(p, function (err, files) {
			// throw error away
			if (err) throw err;

			if (files.length) console.log("watcher: Files founded -> " + files)

			// async or not
			var f = w.async ? _asyncScan : _syncScan;
			f.apply(null, [p, files, function () {
				// start compare
				_compare();
				// retrigger scan to check modification
				_start();
			}]);
		});
	};

	var _asyncScan = function (p, files, cb) {
		var l = files.length;

		for (var i = files.length - 1; i >= 0; i--) {
			_stat(p, files[i], true, function () {
				l --;
				if (l == 0) {
					if (cb != null) cb.apply();
				}
			});
		};
	};

	var _syncScan = function (p, files, cb) {
		for (var i = files.length - 1; i >= 0; i--) {
			_stat(p, files[i], false);
		};

		if (cb != null) cb.apply();
	}

	// record every file's detail,use fs.stat for file info.
	// because we need to count files which has been stat,
	// since there will be a lot IO operation here, if the IO 
	// operations are asynchronous, and chances that when IO time is 
	// longer than watch interval, the next _scan call may interrupt 
	// the process of all the other operations(record, compare, etc.),
	// the _stat function should have options for async or not, and 
	// the branch can be configed in constructor configs.
	var _stat = function (p, n, a, cb) {
		var fp = path.resolve(p, n);

		if (a) {
			fs.stat(fp, function(err, stats) {
				if (err) throw err;

				_record(p, n, stats);

				cb.apply();
			});
		} else {
			_record(p, n, fs.statSync(fp));
		}
	};

	var _record = function (p, n, stats) {
		var item = w.currentStructure.create();
		if (stats.isFile()) {
			item.type = "f";
			item.name = n;
			item.path = p;
			item.size = stats.size;
			item.atime = stats.atime;
			item.mtime = stats.mtime;
			item.ctime = stats.ctime;
		} else {
			item.name = path.basename(p);
			item.type = "d";
			item.path = p;
		}
		w.currentStructure.add(item);
	};

	var _compare = function () {
		console.log("watcher: Structure: \n" + w.currentStructure.rootSt);
		var o = w.currentStructure.compare(w.originalStructure);
		w.emit("update", o);
	};

};

var structure = function (strRoot) {
	var s = this;

	s.rootStr = strRoot;
	s.rootSt = null;
	s.rootItem = null;

	s.create = function () {
		return new item();
	};

	s.compare = function (strc) {
		if (s.rootStr == strc.rootStr) {
			var result = [], 
				resultWrapper = function (a, i) {
					result.push({"mode": a, "item": i});
				};
			// first level check, if the original structure
			// does not has childs but the comparing one has,
			// it means all the files in the comparing structure
			// are added, we need to loop into the bottom to
			// find out every item of the comparing structure.
			if (!s.childs && strc.childs) {

			}
			// search for every depth
			for (var i = s.childs.length - 1; i >= 0; i--) {
				var lvCache = [];
				for (var j = strc.childs.length - 1; j >= 0; jjj--) {
					strc.childs[j]
				};
			};
		}
		return null;
	};

	s.add = function (item) {
		_add(item);
	};

	var _init = function () {
		s.rootItem = s.create();
		s.rootItem.path = s.rootStr;
		s.rootItem.type = "d";
		s.rootItem.name = s.rootStr;
		s.rootSt = new storage(s.rootItem);
	}

	var _add = function (item) {
		var it, n, 
			c = s.rootSt, 
			pathRelative = _resolve(item.path, c.item.path);

		for (var i = 0; i < pathRelative.length; i++) {
			if (i == (pathRelative.length - 1)) {
				// the last one, just add
				c.addChild(item);
			} else {
				it = s.create();
				it.type = "d";
				it.name = pathRelative[i];
				it.path = path.resolve(c.item.path, it.name);
				c.addChild(it);
				c = c.getChild(it.name);
			}
		};
	};

	var _resolve = function (n, o) {
		var r = path.relative(o, n);
		return r.replace("..", "").split(path.sep);
	};

	var item = function () {
		var i = this;
		// file name, only works when type == 'f'
		i.name = null;
		// 'd' for directory, 'f' for file
		i.type = null;
		// current file path
		i.path = null;

		i.atime = null;
		i.mtime = null;
		i.ctime = null;

		i.size = null;

		i.compare = function (it) {
			return i.name === it.name && i.type === it.type && i.path === it.path;
		}
	};

	var storage = function (item) {
		var st = this;

		st.parent = null;
		st.childs = null;
		st.item = item;
		st.broken = false;

		st.hasChild = function (item) {
			if (st.childs) {
				st.childs.forEach(function (stc) {
					if (stc.item && stc.item.compare(item)) {
						return true;
					}
				});
			}
			return false;
		}

		st.addChild = function (it) {
			if (!st.childs) st.childs = [];

			var newSt = new storage(it);
			newSt.parent = st;
			st.childs.push(newSt);
		};

		st.getChild = function (name) {
			if (st.childs) {
				st.childs.forEach(function (stc) {
					if (stc.item && stc.item.name === name) {
						return i;
					}
				});
			}
			return null;
		};

		st.toString = function () {
			return _toString(st);
		};

		var _cpl = function (c, d) {
			var r = "";
			while (c) {
				r += d;
				c --;
			}
			return r;
		}

		var _toString = function (stc, h) {
			var s = "", 
				a = "", 
				h = h || 0;
			a += stc.parent ? "/" : "";
			a += stc.item ? stc.item.name : "_empty_storage_";
			s += a;

			if (stc.childs) {
				h ++;
				for (var i = 0; i < stc.childs.length; i++) {
					s += "\n" + _cpl(a.length, " ") + _toString(stc.childs[i], h);
				};
			}

			return s;
		}
	};

	_init();
}

util.inherits(watch, events.EventEmitter);

module.exports = watch;