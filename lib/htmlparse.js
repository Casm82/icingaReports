// Функция парсинга html страницы и сохранения отчёта в MongoDB
function htmlparse (body, url, quarter, year) {
	var xpath = require('xpath'),
    	dom = require('xmldom').DOMParser;
	var doc = new dom().parseFromString(body);
	
	// Находим в отчёте диапозон анализа : "01-12-2013 00:00:00 to 10-12-2013 23:59:59"
	var htmlRange = 
		xpath.select("/html/body/table[1]/tr/td/div[@class='reportRange']", doc)[0].firstChild.nodeValue.replace(/\n/, " ");
	var reportMonth = Number(htmlRange.split("-")[1]);

	// Определяем продолжительность отчёта в виде "Duration: 28d 20h 11m 10s"
	var htmlduration = 
		xpath.select("/html/body/table[1]/tr/td/div[@class='reportDuration']", doc)[0].firstChild.nodeValue.replace(/\n/, " ");

	// Разбиваем по пробелам на массив
	var duration = htmlduration.split(" ");
	duration.shift(); // Убираем "Duration:"
	
	// Убираем буквы из массива и преобразуем в числовой тип
	for (var i in duration) { duration[i] = Number(duration[i].replace(/\D/g, "")) };

	// Вычисляем продолжительность в секундах
	var durationSec = duration[0]*60*60*24 + duration[1]*60*60 + duration[2]*60 + duration[3];

	var htmlobj = {	"date": { month: reportMonth, quarter: quarter, year: year },
			"url"	: url,
			"report": [],
			"duration": durationSec };

	var tablecontent = (xpath.select("/html/body/table[3]", doc)[0].childNodes);

	for (tr in tablecontent) {
	// tr - номер строки в таблице, включая \n
	
		if ( 
			// Если элемент ячейка (td) и есть потомки, значит имя хоста указано
			(tablecontent[tr].childNodes) &&
			(tablecontent[tr].childNodes[1].nodeName == 'td') &&
			// Проверка на наличие имени сервиса
			(tablecontent[tr].childNodes[3].firstChild) &&
			(tablecontent[tr].childNodes[3].firstChild.firstChild)
		   ) {

			// Создаём сервис
			// availability = 100 - % Time Critical
			var service = { 
				servicename: 
					tablecontent[tr].childNodes[3].firstChild.firstChild.nodeValue.replace(/\n/, ""),
				availability: 
					100-Number(tablecontent[tr].childNodes[11].firstChild.nodeValue.replace(/%(.*)/, ""))
				};
			// Расчитываем время простоя в минутах
			var timeIdleSec = (durationSec*(1-service.availability/100));
			var timeIdleHrs = Math.floor(timeIdleSec/3600);
			var timeIdleMin = Math.round(timeIdleSec/60 - timeIdleHrs*60);
			service.timeIdle = [timeIdleHrs, timeIdleMin, timeIdleSec];

			if ( 
				// Если есть ячейка с именем хоста, то вычисляем имя
				(tablecontent[tr].childNodes[1].firstChild) &&
				(tablecontent[tr].childNodes[1].firstChild.nodeValue != 'Average') &&
				(tablecontent[tr].childNodes[1].firstChild.firstChild)
			  ) 
			{ 
				var hostvalue = tablecontent[tr].childNodes[1].firstChild.firstChild.nodeValue.replace(/\n/g, "") 
			} else {
			// Если нет имени, то указываем null и после добавляем к предыдущему объекту отчёта
				var hostvalue = null;
			};

			// Добавляем объект в отчёт если есть имя хоста (1) или имя сервиса (3)
		
			// Если указано имя хоста, помещаем объект состояния службы хоста в отчёт
			if (hostvalue) {
				// Создаём массив служб хоста
				var hostservices = [];
				// Создаём объект состояния службы хоста и помещаем его в отчёт
				hostservices.push(service);
				
				// Создаём отчёт по серверу
				var server = { host: hostvalue, services: hostservices };
				// Помещаем отчёт по серверу в массив отчётов
				htmlobj.report.push(server);
			} else {
			// Если нет имени хоста, то отыскиваем предыдущий сервер и добавляем отчёт по службе в него
				var reportlength = htmlobj.report.length;
				htmlobj.report[reportlength - 1].services.push(service);
			}
		}
	}
return htmlobj;
}

module.exports = htmlparse;
