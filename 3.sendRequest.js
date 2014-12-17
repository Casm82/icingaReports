// Функция выполняет HTTP запрос на страницу Icinga
module.exports = function sendRequest(reqId, reportEm) {
var request = require('request'),
	tidy = require('htmltidy').tidy,
	htmlparse = require('./lib/htmlparse'),
	mongoose = require('mongoose');
var Reports = mongoose.model("Report");

	request.get(reqId.url, reqId.auth, function(err, res, icingaOutput) {
		if (err) throw err;
		if (!err && res.statusCode == 200) {
			// Приводим HTML страницу вывода icinga к стандартам W3C
			// с помощью htmltidy
			tidy(icingaOutput.toString(), function(err, body) { 
				var report = htmlparse(body, reqId.url, reqId.quarter, reqId.year); 
				Reports.findOneAndUpdate(
					{date: {month: reqId.month, quarter: reqId.quarter, year: reqId.year}},
					report, {upsert: true}, 
					function (err, abc) { 
						if (err) { throw err; }
						reportEm.emit('reportInDB', reqId.month);
					}
				);
			});
		}
	});
}
