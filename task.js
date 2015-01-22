
var task = function (conf) {
	var t = this;

	if (!valid(conf)) {
		t.valid = false;
	} else {
		t.valid = true;

		t._conf = conf;

		var result = merge(_base(conf.base), _params(conf.params));
		Object.keys(result).forEach(function (key) {
			Object.defineProperty(t, key, {
				"writeable": true, 
				"enumerable": false, 
				"value": result[key]
			});
		});
	}
}

function valid(conf) {
	return conf.base || conf.params;
}

function _base(conf) {
	return conf;
}

function _params(conf) {
	return conf;
}

function merge(base, params) {
	var r = {};
	for (var key in base) {
		r[key] = base[key];
	}
	Object.keys(params).forEach(function (key) {
		r[key] = params[key];
	});
	return r;
}

module.exports = task;