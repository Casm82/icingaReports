// Функция получает отчёт или из кэша или из Icinga
module.exports = function (req, res, currentMonth, currentYear, quarterReq, yearReq){
var appSettings = require('./settings.json');

var getLastMonthDay = require('./lib/getLastMonthDay'),
	searchInCache = require('./2.searchInCache'),
	calcAvgPercent = require('./4.calcAvgPercent');

// Параметры запроса в Icinga
  // Аутентификация	
	var authparam = {'auth': {'user': 'user', 'pass': 'monitor', 'sendImmediately': false } };

  // Параметры запроса
	var sday=1,syear=yearReq,shour=0,smin=0,ssec=0,		// Начальные временные интервалы запроса
		eyear=yearReq,ehour=23,emin=59,esec=59;

// Переменная,expectedDocs хранит ожидаемое кол-во документов в БД
// если расчёт выполняется для текущего квартала
// когда нет полной статистики
// savedDocs - количество сохранённых документов
// Переменная retryRequest - метка, что повторно выполняется запрос для текущего месяца
// reportEm - источник событий, используется для оповещения о завершении запроса в Icinga
	var expectedDocs = 0;
	var savedDocs = 0;
	var EventEmitter = require('events').EventEmitter;
    var reportEm= new EventEmitter();
	var retryRequest = false;
	
	reportEm.on('reportInDB', function(url) {
		console.log("emmiter № %d, month %s", savedDocs, url);
		savedDocs++;
		if ( savedDocs == expectedDocs ) { 
			console.log("\nquarter completed!");
			calcAvgPercent(req, res, {quarter: quarterReq, year: yearReq} );
		};
	});
	

// Делаем запрос для каждого месяца квартала
for ( var i = 1; i <= 3; i++)
{
	var smon = emon = i + 3*(quarterReq - 1);		// Месяц расчёта
	var eday = getLastMonthDay(smon, yearReq);		// Последний день месяца
	// Адрес запроса
	var url = appSettings.icingaURL + "/cgi-bin/avail.cgi?" + 
		"show_log_entries=&servicegroup=" + appSettings.serviceGrp +
		"&timeperiod=custom" + 
		"&smon=" + smon + "&sday=" + sday + "&syear=" + syear + "&shour=" + shour + "&smin=" + smin + "&ssec=" + ssec + 
		"&emon=" + emon + "&eday=" + eday + "&eyear=" + eyear + "&ehour=" + ehour + "&emin=" + emin + "&esec=" + esec + 
		"&rpttimeperiod=" + appSettings.reportTimePeriod + 
		"&assumeinitialstates=yes&assumestateretention=yes" +
		"&assumestatesduringnotrunning=yes" + 
		"&includesoftstates=no" +
		"&initialassumedhoststate=3" + 
		"&initialassumedservicestate=6" + 
		"&backtrack=4";

	// Создаём идентификатор документа по введённым данным квартала и года
	// retryRequest - если выполняется запрос для текущего месяца, то принудительно 
	// отправить запрос в Icinga и обновить существующий документ в БД
	var reqId = { 
			month: smon, quarter: quarterReq, year: yearReq,
			url: url,
			auth: authparam,
			retryRequest: ((smon == currentMonth) && (syear == currentYear)) 
		};

	// Ищем существующие отчёты в БД
	// Выполняем запрос в Icinga для каждого месяца квартала
	// если запращиваемый момент времени не больше текущего 
	// и увеличиваем счётчик ожидаемых в БД документов

	if ((yearReq < currentYear) || (smon <= currentMonth)) {
		searchInCache(reqId, reportEm);
		expectedDocs++;
	}; // <--- if
}  // <---	for
};
