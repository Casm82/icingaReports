// Функция определяет минимальное значение доступности служб по месяцам за квартал
module.exports = function (req, res, reqDate) {
// reqDate = {quarter: quarterReq, year: yearReq}
	var mongoose = require('mongoose');
	var Reports = mongoose.model("Report");
	var	writeAvgPercent = require('./5.writeAvgPercent.js');

	var report = {};

	// Функция выпускает значения {дата, [{отчёт},{отчёт},{отчёт}...] }
	report.map = function () { 
	var duration = this.duration;
	for (var i in this.report) {		//  <--- сервер со службами
		var hostReport =  this.report[i];	//<--- службы сервера
		for (var j in hostReport.services) {
			var unwindService = {
					host: hostReport.host,
					servicename: hostReport.services[j].servicename,
					availability: hostReport.services[j].availability,
					timeIdle: hostReport.services[j].timeIdle,
					duration: duration
				};
			emit ( this.date, unwindService) 
		}
	}
	};

	// Функция для каждого значения {дата, [{отчёт},{отчёт},{отчёт}...] }
	// считает среднее значение {отчёт}
	report.reduce = function(date, reports) { 
		var availability = 0;
		var timeIdleSec = 0;
		for (var i in reports)
		{
			availability += reports[i].availability;		// Сумма availability сервисов за месяц
			timeIdleSec += reports[i].timeIdle[2];	// Сумма времени простоя за месяц в секундах
		};
	
		var avgAvailability = availability/reports.length;	 // Среднее значение availability сервисов за месяц
		var avgTimeIdleSec = timeIdleSec/reports.length; // Среднее время простоя за месяц в секундах

		var avgTimeIdleHrs = Math.floor(avgTimeIdleSec/3600);
		var avgTimeIdleMin = Math.round(avgTimeIdleSec/60 - avgTimeIdleHrs*60);
		var avgTimeIdle = [avgTimeIdleHrs, avgTimeIdleMin];		// Время простоя [часы, минуты]

	return {avgAvailability: avgAvailability, avgTimeIdle: avgTimeIdle};
	};

	report.verbose = false;

	report.query = {'date.quarter': reqDate.quarter, 'date.year': reqDate.year } ;

	// Выполняем свертку
	// Получаем месяц и среднее значение доступности служб в этот месяц в виде массива
	// Для каждого элемента массива вызываем функцию writeAvgAvailability, которая записывает в БД
	// среднее значение доступности служб за месяц и помечает отчёт с наименьшими показателями
	// меткой leastQuarterly = true;
	// После вызываем publishReport, которая публикует отчёт
	Reports.mapReduce(report, function (err, mapOut) {
	// 	{ _id: { month: 1, quarter: 1, year: 2013 }, value: {"avgAvailability":99.98851219512194,"avgTimeIdle":[0,2]} },
		writeAvgPercent(mapOut, req, res, reqDate);
	});

};
