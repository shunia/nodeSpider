var reader = require('./dirreader'), 
	util = require('util'), 
	
	path = require('path'), 
	events = require('events');

// constructor for watching task
var watcher = function (confs) {
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

	// asynchrous and recrusive directory reader
	var rd = new reader(true, w.async);

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
					// start scan
					rd.read(w.root, function (files) {
						// handle all files read.
						_handle.apply(null, [files]);
					});
				};
			w.__start.apply();
		} else {
			w.interval = setInterval(w.__start, w.checkRate);
		}
	};

	var _handle = function (files) {
		// constructs new structure for compare
		w.originalStructure = w.currentStructure;
		w.currentStructure = new structure(files.shift());
		// first record all files into item object and store
		// into structure
		var l = files.length;
		for (var i = l - 1; i >= 0; i--) {
			w.currentStructure.add(files[i]);
		};
		// start structure compare
		_compare.apply();
		// resart
		_start.apply();
	}

	var _stop = function () {
		// clear interval if exists
		if (w.interval) {
			clearInterval(w.interval);
			w.interval = -1;
		}
	};

	var _compare = function () {
		// console.log("watcher: Structure: \n" + w.currentStructure.rootSt);
		var o = w.currentStructure.compare(w.originalStructure);
		// console.log(o);
		if (o.length > 0) w.emit("update", o);
	};

};

var structure = function (rootItem) {
	var s = this;

	s.rootSt = null;
	s.rootItem = rootItem;

	s.compare = function (strc) {
		var result = [], 
		    resultWrapper = function (a, i1, i2) {
				return {"mode": a, "item": i1, "old": i2};
			}, 
			sls_compare_item = function (storage1, storage2) {
				var compareItem = function (it1, it2) {
					return it1.name === it2.name 
							&& it1.isFile === it2.isFile 
							&& it1.path === it2.path;
				};
				var checkItemModified = function (it1, it2) {
					return !(it1.size === it2.size && 
							it1.atime.getTime() === it2.atime.getTime() && 
							it1.mtime.getTime() === it2.mtime.getTime() && 
							it1.ctime.getTime() === it2.ctime.getTime());
				};

				var it1 = storage1.item, it2 = storage2.item;
				if (compareItem(it1, it2)) {
					// same file/dir

					// if dir compare, check has childs first, because dir which
					// has childs means there are files in it to be modified, not 
					// the dir itself.So dir compare only happens when they have 
					// no childs.
					if (!it1.isFile && !storage1.childs && !storage2.childs) {
						return checkItemModified(it1, it2);
					}
					// files should always check modification.
					if (it1.isFile) 
						return checkItemModified(it1, it2);
				}
				return false;
			}, 
			sls_deep_in = function (storage, cb) {
				var arr = (cb !== null) ? null : [], 
					_del = function (itm, cb, arr, i) {
						// item not exists, or item is dir but is ignored.
						var notValid = itm == null || (!itm.isFile && i);
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
					defineProp = Object.defineProperty, 
					defineProps = Object.defineProperties, 
					savedToDefine = {};
				var leftChild = null, 
					rightChild = null;
				for (var k in storage1.childs) {
					if (storage2.hasChild(k)) {
						leftChild = storage1.childs[k];
						rightChild = storage2.childs[k];
						if (sls_compare_item(leftChild, rightChild)) {
							results.push(resultWrapper("modify", rightChild.item, leftChild.item));
						}
						// save it now, and after the loop is completed,
						// all the props saved will be redefined.
						savedToDefine[k] = {"configurable": true, "enumerable": true, "writable": true, "value": rightChild};
						// has same key means nothing happend to the 
						// item which corresponds to the key, so remove
						// it from storage2's enumerable lists.
						defineProp.apply(
							storage2.childs, 
							[storage2.childs, k, 
								{"configurable": true, "enumerable": false}]);
						// recrusive
						sls_compare_childs(leftChild, rightChild, results);
					} else {
						// can not find key means this item is deleted
						// and deleted item does not need recrusive search
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
					defineProps.apply(storage2.childs, 
						[storage2.childs, savedToDefine]);
				}
			};
		// all changes
		if (strc === null) {
			for (k in s.rootSt.childs) {
				sls_deep_in(s.rootSt.childs[k], function (item) {
					result.push(resultWrapper("add", item));
				});
			}
		} else {
			sls_compare_childs(strc.rootSt, s.rootSt, result);
		}
		return result;
	};

	s.add = function (item) {
		_add(item);
	};

	var _init = function () {
		s.rootSt = new storage(s.rootItem);
	}

	var _add = function (item) {
		var c = s.rootSt, tmp = c, 
			pathRelative = _resolve(item.path, c.item.path), 
			p;
		// console.log("Adding: ");
		// console.log("  " + item.path);
		while (pathRelative.length) {
			p = pathRelative.shift();
			if (!p || p.length == 0) continue;
			if (tmp.hasChild(p)) {
				// console.log("    continue: " + p);
				tmp = tmp.getChild(null, p);
			} else if (p != item.name) {
				// console.log("    adddir: " + p);
				tmp = tmp.addChild(null, p);
			}
		}

		if (tmp) {
			if (item.name == tmp.key) {
				// console.log("    insert: " + item.name + " to " + tmp.key + ", p=" + p);
				tmp.insertItem(item);
			} else {
				// console.log("    addchild: " + item.name + " to " + tmp.key + ", p=" + p);
				tmp.addChild(item);
			}
		}
	};

	var _resolve = function (n, o) {
		var r = path.relative(o, n);
		return r.replace("..", "").split(path.sep);
	};

	var storage = function (item, key) {
		var st = this;

		st.hasChild = function (it, key) {
			var k = _toKey(it, key);
			return st.childs && st.childs.hasOwnProperty(k);
		}

		st.addChild = function (it, key) {
			if (!st.childs) st.childs = {};
			//console.log(st.key, st.item.name, st.item.path, it.name);
			var newSt = new storage(it, key);
			newSt.parent = st;
			st.childs[newSt.key] = newSt;
			return newSt;
		};

		st.getChild = function (it, key) {
			if (!st.childs) return null;

			var k = _toKey(it, key);
			return st.childs.hasOwnProperty(k) ? 
						st.childs[k] : null;
		};

		st.insertItem = function (it) {
			st.item = it;
			st.key = _toKey(it);
		};

		st.toString = function () {
			return _toString(st, 0);
		};

		var _cpl = function (c, d) {
			var r = "";
			while (c) {
				r += d;
				c --;
			}
			return r;
		}

		var _toString = function (stc, len) {
			var s = "", 
				a = _cpl(len, " ");
			a += stc.parent ? path.sep : "";
			a += stc.item ? stc.item.name : "_empty_storage_";
			s += a;

			if (stc.childs) {
				for (var k in stc.childs) {
					s += "\n" + _toString(stc.childs[k], a.length);
				}
			}

			return s;
		}

		var _toKey = function (it, key) {
			var i = it ? it : key;
			if (!i) {
				return "__empty__";
			} else if (typeof(i) === "string") {
				return k = i;
			} else {
				return i.name ? i.name : "empty";
			}
		};

		st.item = item;
		st.key = _toKey(item, key);
		st.parent = null;
		st.childs = null;
	};

	_init();
}

util.inherits(watcher, events.EventEmitter);

module.exports = watcher;