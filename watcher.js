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

			// if (files.length) console.log("watcher: Files founded -> " + files)

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

				_record(fp, n, stats);

				cb.apply();
			});
		} else {
			_record(fp, n, fs.statSync(fp));
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
		console.log(o);
		if (o.length > 0) w.emit("update", o);
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
		var result = [], 
		    resultWrapper = function (a, i1, i2) {
				return {"mode": a, "item": i, "old": i2};
			}, 
			sls_compare_item = function (storage1, storage2) {
				var it1 = storage1.item, it2 = storage2.item;
				if (it1.compare(it2)) {
					// same file/dir

					// if dir compare, check has childs first, because dir which
					// has childs means there are files in it to be modified, not 
					// the dir itself.So dir compare only happens when they have 
					// no childs.
					if (it1.type == "d" && (!storage1.childs || !storage1.childs))
						return it1.modified(it2);
					// files should always check modification.
					if (it1.type == "f") 
						return it1.modified(it2);
				}
				return false;
			}, 
			sls_deep_in = function (storage, cb) {
				var arr = (cb !== null) ? null : [], 
					_del = function (itm, cb, arr, i) {
						// item not exists, or item is dir but is ignored.
						var notValid = item == null || (item.type == "d" && i);
						if (!notValid) {
							if (cb != null) cb.apply(null, [itm]);
							else arr.push(itm);
						}
					}, 
					_deepIn = function (storage, cb) {
						var st, isLast;
						for (var k in storage.childs) {
							st = storage.childs[k];
							isLast = st.childs ? false : true;
							cb.apply(storage, [st, isLast]);
							if (!isLast) _deepIn(st, cb);
						}
					};
				// root directory can not be ignored.
				_del(storage.item, cb, arr, false);
				_deepIn(storage, function (itm, isLast) {
					_del(itm, cb, arr, !isLast);
				});
				return arr;
			}, 
			sls_compare_childs = function (storage1, storage2, saveTo) {
				var results = saveTo, 
					defineProp = Object.definePorperty, 
					defineProps = Object.defineProperties, 
					savedToDefine = {};
				var leftChild = null, 
					rightChild = null;
				for (var k in storage1.childs) {
					if (storage2.hasChild(k)) {
						leftChild = storage1.childs[k];
						rightChild = storage2.childs[k];
						if (sls_compare_item(leftChild, rightChild)) {
							results.push(resultWrapper("modify", rightChild, leftChild));
						}
						// save it now, and after the loop is completed,
						// all the props saved will be redefined.
						savedToDefine[k] = {"configurable": true, "enumerable": true, "writable": true, "value": rightChild};
						// has same key means nothing happend to the 
						// item which corresponds to the key, so remove
						// it from storage2's enumerable lists.
						defineProp.call(
							storage2.childs, k, 
							{"configurable": true, "enumerable": false});
						// recrusive
						sls_compare_childs(leftChild, rightChild, results);
					} else {
						// can not find key means this item is deleted
						// and deleted item do not need recrusive search
						/*sls_deep_in(storage1, function (item) {
							results.push(resultWrapper("remove", item));
						});*/
						results.push(resultWrapper("remove", storage1.childs[k].item));
					}
				}
				// loop other keys in storage2, these are files or 
				// dirs beening added.
				for (k in storage2.childs) {
					sls_deep_in(storage2.childs[k], function (item) {
						results.push(resultWrapper("add", item));
					});
				}
				// unmodify all the props
				if (storage2.childs) {
					defineProps.call(storage2.childs, savedToDefine);
				}
			};
		// all changes
		if (strc == null) {
			for (k in s.childs) {
				sls_deep_in(s.childs[k], function (item) {
					results.push(resultWrapper("add", item));
				});
			}
		} else {
			sls_compare_childs(strc.rootStr, s.rootStr, result);
		}
		return result;
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
				c = c.getChild(it);
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

		i.getKey = function () {
			return (i.name ? i.name : "empty") + "_" + i.type;
		}

		i.compare = function (it) {
			return i.name === it.name && i.type === it.type && i.path === it.path;
		}

		i.modified = function (it) {
			return i.size === it.size && 
					i.atime.getTime() === it.atime.getTime() && 
					i.mtime.getTime() === it.mtime.getTime() && 
					i.ctime.getTime() === it.ctime.getTime();
		}
	};

	var storage = function (item) {
		var st = this;

		st.hasChild = function (i) {
			var k = _toKey(i);
			return st.childs && st.childs.hasOwnProperty(k);
		}

		st.addChild = function (it) {
			if (!st.childs) st.childs = {};
			//console.log(st.key, st.item.name, st.item.path, it.name);
			var newSt = new storage(it);
			newSt.parent = st;
			st.childs[_toKey(it)] = newSt;
		};

		st.getChild = function (i) {
			if (!st.childs) return null;

			var k = _toKey(i);
			return st.childs.hasOwnProperty(k) ? 
						st.childs[k] : null;
			/*if (st.childs) {
				st.childs.forEach(function (stc) {
					if (stc.item && stc.item.name === name) {
						return i;
					}
				});
			}
			return null;*/
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

		var _toString = function (stc) {
			var s = "", 
				a = "";
			a += stc.parent ? "/" : "";
			a += stc.item ? stc.item.name : "_empty_storage_";
			s += a;

			if (stc.childs) {
				for (var k in stc.childs) {
					//console.log(stc.childs);
					s += "\n" + _cpl(a.length - 1, " ") + _toString(stc.childs[k]);
				}
			}

			return s;
		}

		var _toKey = function (i) {
			var k;
			if (typeof(i) === "string") {
				k = i;
			} else {
				k = i.getKey();
			}
			return k;
		};

		st.item = item;
		st.key = _toKey(st.item);
		st.parent = null;
		st.childs = null;
		st.broken = false;
	};

	_init();
}

util.inherits(watch, events.EventEmitter);

module.exports = watch;