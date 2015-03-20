var query = require('querystring'), 
	i = 0, 
	form = query.stringify({
								homCur:'CNY', 
								forCur:'USD', 
								fee:0, 
								date:'01/19/2015', 
								rate:0, 
								submit:{x:140, y:6}, 
								submit:'Calculate Exchange Rates', 
								firstDate:'01/20/2014', 
								lastDate:'01/19/2015', 
								actualDate:'01-19-2015'
							}), 
	opt = function () {
		console.log(this);
		i ++;
		optDefault.flag = i;
		return optDefault;
	}, 
	optDefault = {
		hostname: 'usa.visa.com', 
		port: 80, 
		path: '/personal/card-benefits/travel/exchange-rate-calculator-results.jsp', 
		method: 'POST', 
		headers: {
			'Content-Length': form.length, 
			'Origin': 'http://usa.visa.com', 
			'Referer': 'http://usa.visa.com/personal/card-benefits/travel/exchange-rate-calculator.jsp', 
			'Cookie': 'visaAnonCookie=0fbff64888600000b3a1bc54fe70090020950000; visaCookie=0fbff64888600000b3a1bc540071090021950000; visaAnonCookie=0ebff64841740000b6a1bc548f7f0800f41f0000; _ga=GA1.3.1106275972.1421648315; __CT_Data=gpv=13&apv_13_www15=13; WRUID=0', 
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
		}, 
		data: form
	};

module.exports.base = {};
module.exports.params = opt;
module.exports.resolve = {};