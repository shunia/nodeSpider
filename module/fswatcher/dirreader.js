var fs = require('fs'), 
	path = require('path'), 
	util = require('util');

var dirreader = function (recrusive, async) {
	var d = this;
	d.recrusive = (recrusive === null || recrusive === undefined) ? true : recrusive;
	d.async = (async === null || async === undefined) ? true : async;

	d.read = function (dir, cb) {
		return new scanner(dir, cb);
	};

	d.item = function (p, n, stats) {
		var i = this;

		i.name = n ? n : p;
		i.path = p;
		i.size = stats.size;
		i.atime = stats.atime;
		i.mtime = stats.mtime;
		i.ctime = stats.ctime;
		i.isFile = stats.isFile();
	};

	var scanner = function (dir, cb) {
		var s = this;

		s.dir = dir;
		s.callback = cb;

		var init = function () {
			var sc = d.async ? _asyncScanner : _syncScanner;
			sc.apply(null, [s.dir, s.callback]);
		};

		var _asyncScanner = function (dir, cb) {
			var results = [];

			var _readdir = function (dir, cp) {
				var l = 0;
				fs.readdir(dir, function (err, files) {
					// throw error away
					if (err) throw err;
					// console.log(files);
					l = files.length;
					if (l == 0) {
						cp.apply();
					} else {
						// handle files and if is directory, deep in
						for (var i = l - 1; i >= 0; i--) {
							_stat(dir, files[i], function (p, item) {
								results.push(item);
								if (!item.isFile) {
									_readdir.apply(null, [p, function () {
										l --;
										if (l == 0) {
											cp.apply();
										}
									}]);
								} else {
									l --;
									if (l == 0) {
										cp.apply();
									}
								}
							});
						}
					}
				});
			};

			var _stat = function (p, n, cb) {
				var fp = path.resolve(p, n);
				fs.stat(fp, function(err, stats) {
					// throw error away
					if (err) throw err;
					// callback
					cb.apply(null, [fp, new d.item(fp, n, stats)]);
				});
			};

			_readdir.apply(null, [dir, function () {
				// after read complete, put the root dir into results
				_stat(dir, "", function (p, item) {
					// put root dir into first
					results.unshift(item);
					// call back
					cb.apply(null, [results]);
				});
				
			}]);
			
		};

		var _syncScanner = function () {

		};

		init();
	};

};

module.exports = dirreader;