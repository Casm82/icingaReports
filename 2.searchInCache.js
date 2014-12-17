// Функция проверяет наличие отчёта в кэше
module.exports = function (reqId, reportEm) {
	var mongoose = require('mongoose');
	var Reports = mongoose.model("Report");
	var sendRequest = require('./3.sendRequest');
		
	if (reqId.retryRequest)
	{ // если запрос для текушего месяца, то делаем запрос в Icinga
		sendRequest(reqId, reportEm);
	} else { // иначе, смотрим наличие в кэше
	Reports.count({
		'date.month':	reqId.month,
		'date.quarter':	reqId.quarter,
		'date.year': 	reqId.year
		}, function(err, numDocs) {
			// Если отчётов нет, то выполняем запрос в Icinga
			if (numDocs) { 
				reportEm.emit('reportInDB', reqId.month);
			} else {
				sendRequest(reqId, reportEm); 
			};
		});
	} // <--- else
}
