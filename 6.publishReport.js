// Функция получает из БД отчёты по месяцам и выводит в браузер сводную таблицу
module.exports = function (req, res, reqDate) {
var mongoose = require('mongoose');
var Reports = mongoose.model("Report");
	Reports.find(
		{'date.quarter': reqDate.quarter,
		 'date.year': reqDate.year},
		null, 
		{sort: {'date.month': 1}},
		function (err, reports) {
			var jadeObject = {
				title: "Отчёт о доступности служб за " + reports[0].date.quarter + 
				" квартал " +	reports[0].date.year + " года", 
				documents: reports,
				state: "publishedQuarter",
				session: req.session.user,
				date: {quarter: reqDate.quarter, year: reqDate.year}
			};

			res.render('publishReports', jadeObject);
		});
};
