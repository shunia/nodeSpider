var http = require('http'), 
	querystring = require('querystring');

var _crawler = function () {
	var c = this;
	c.props = null;

	c.setProps = function (object) {
		c.props = object;
	};

	c.setProp = function (key, value) {
		if (!c.props) return;
		c.props[key] = value;
	};

	c.send = function () {
		
	};

	c.close = function () {

	};

};

module.exports = _crawler;