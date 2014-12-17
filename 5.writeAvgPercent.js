module.exports = function (array, req, res, reqDate){
// Получаем массив пар {_id: дата, value: "среднее availability"} как array
// [
// 	{ _id: { month: 1, quarter: 1, year: 2013 }, value: {"avgAvailability":99.98851219512194,"avgTimeIdle":[0,2]} },
// 	{ _id: { month: 2, quarter: 1, year: 2013 }, value: {"avgAvailability":99.98851219512194,"avgTimeIdle":[0,3]} },
// 	{ _id: { month: 3, quarter: 1, year: 2013 }, value: {"avgAvailability":99.98851219512194,"avgTimeIdle":[0,4]} },
// ]
	var mongoose = require('mongoose'),
		Reports = mongoose.model("Report"),
		publishReport = require('./6.publishReport');
		
	var EventEmitter = require('events').EventEmitter;
    var avgSavedEm = new EventEmitter();
	var	numSaved = 0;

	// Месяц с минимальными показателями сохраним в minTimeReport
	var minTimeReport = { "_id": null, "value": {"avgAvailability": Infinity, "avgTimeIdle": []}};
	// Для каждого месяца в квартале
	for ( var i in array) {
		// Сохраняем среднее значение в БД
		var docId = array[i]._id;
		var avgAvailability = (array[i].value.avgAvailability).toFixed(4);
		var avgTimeIdle =(array[i].value.avgTimeIdle);
		Reports.findOneAndUpdate( 
			{'date': docId}, 
			{$set: {avgAvailability: avgAvailability, avgTimeIdle: avgTimeIdle}},
			function (err) { 
				if (err) return err; 
				avgSavedEm.emit('saved', docId);
			}
		);
		
		if (avgAvailability < minTimeReport.value.avgAvailability) { minTimeReport = array[i]; };
		// Ищем минимальное значение доступности служб за месяц
	};

	avgSavedEm.on('saved', function() {
		numSaved++;
		if (numSaved == array.length) {
			// Для месяца с минимальными показателями сохраняем в БД метку
			// Предварительно, очищаем старые метки
			Reports.update({"leastQuarterly": true}, {$set: {"leastQuarterly": false}}, 
				function (err){
					if (err) return err;
					Reports.
						update({"date.month":	 minTimeReport._id.month,
								"date.quarter":	 minTimeReport._id.quarter,	
								"date.year":	 minTimeReport._id.year },
						{$set: {"leastQuarterly": true}}, 
						function (err) { 
							if (err) return err;
							publishReport(req, res, reqDate);
						}); 
			});
		}
	});

};
