// Функция возвращает последний день месяца
function getLastMonthDay(month, year) {
	switch (month) {
		case  1: return 31; break;
		case  2: if (year%4) {var day=29} else {var day = 28};
				 return day;
				 break;
		case  3: return 31; break;
		case  4: return 30; break;
		case  5: return 31; break;
		case  6: return 30; break;
		case  7: return 31; break;
		case  8: return 31; break;
		case  9: return 30; break;
		case 10: return 31; break;
		case 11: return 30; break;
		case 12: return 31; break;
	}
};

module.exports = getLastMonthDay;
