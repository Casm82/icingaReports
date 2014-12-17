module.exports = function(app) {
var appSettings = require('./settings.json');
var getReport = require('./1.getReport');
var checkAuth = require('./lib/checkAuthentication');

    //////////////////////////////////////////////////////////////////////////////////////////
	app.get('/', function(req, res){
        if (req.session.user) { res.redirect('/selectDate')
		} else {
		  res.render('login',
            {	title: "Вход",
                session: req.session
            });
		}
    });
    //////////////////////////////////////////////////////////////////////////////////////////
	app.get('/logout', checkAuth, function(req, res){
        if (req.session.user) {
		  req.session.destroy();
		  res.redirect('/')
		}
    });
	//////////////////////////////////////////////////////////////////////////////////////////
	app.post('/session', function(req, res) {
        var user = {
                username: req.body.username.toString(),
                password: req.body.password.toString(),
                granted: null
            };

        var authProc = require('child_process').fork(__dirname + '/lib/auth.js');

        authProc.send(user);

        authProc.on('message', function(authResult) {
			authResult.ip = req.ip;
			/* authResult: {
				"time":"Tue Aug 05 2014 09:37:48 GMT+0400 (Арабское время (зима))",
				"error":null,"username":"user123","authed":true,"grantedUser":true,
				"ip":"172.16.1.25"}
			*/
			console.log("\nauthResult: %j", authResult);
			
            if (authResult.authed) {
                if(authResult.grantedUser){
                // авторизован и есть доступ
                    user.granted = true;
                    req.session.user = {username: user.username, granted: user.granted};
                    //  "user":{"username":"user123","granted":true}}
                    res.redirect('/selectDate');
                } else {
                // авторизован, но нет в группе для доступа
                    req.session.user = null;
                    res.render("authError",
                        {
                            username: user.username,
                            code: "notPermited",
                            group:  appSettings.groupName
                        });
                }
            } else {
                // ошибка авторизации
                req.session.user = null;
                res.render("authError", { username: user.username, code: "notAuthed"});
            }
            authProc.kill();
            });
    });
    //////////////////////////////////////////////////////////////////////////////////////////
	app.get('/selectDate', checkAuth, function(req, res) {
		// Дата на момент запрос
		var currentDate = new Date();
		var currentYear = currentDate.getFullYear();
		var currentMonth = currentDate.getMonth() + 1;	// Текущий месяц, начало отсчёта с нуля
		var currentQuarter = Math.ceil(currentMonth/3);	// Текущий квартал года

		var yearsArray = []; 
		for (var i = currentYear; i >= 2014; i--) { yearsArray.push(i) };

		res.render('selectDate',
		  {	title: "Анализ отчётов Icinga", 
			quarter: currentQuarter, years: yearsArray,
			session: req.session.user
		  });
	});
	
    /////////////////////////////////////////////////////////////////////////////////////////
	app.post('/getReport',checkAuth, function(req, res) {
		var currentDate = new Date();
		var currentYear = currentDate.getFullYear();
		var currentMonth = currentDate.getMonth() + 1;	// Текущий месяц, начало отсчёта с нуля
		var currentQuarter = Math.ceil(currentMonth/3);	// Текущий квартал года

		var yearsArray = []; 
		for (var i = currentYear; i >= 2014; i--) { yearsArray.push(i) };

		if (( req.body.year < currentYear ) || ( req.body.quarter <= currentQuarter ))
			{	// если выбран отчёт за прошежшие месяцы, то считаем отчёт
				getReport(req, res, currentMonth, currentYear, Number(req.body.quarter), Number(req.body.year));
			} else {	// если будущие, то сообщаем об ошибке
				res.render('msg', {msg: "Статистика по будущему отсутствует"});
			}
	});

    ////////////////////////////////////////////////////////////////////////////////////////
	app.post('/prePrintReport',checkAuth, function(req, res) {
		require('./7.prePrintReport')(req, res, req.body);
	});

    ////////////////////////////////////////////////////////////////////////////////////////
	app.post('/printReport',checkAuth, function(req, res) {
		require('./8.printReport')(res, req.body);
	});
   
    ////////////////////////////////////////////////////////////////////////////////////////
    // 404s
    app.use(function (req, res, next) {
        if (req.accepts('html')) {
			return res.status(404).send("<h2>Извините, но я не могу найти эту страницу.</h2>");
        }

        if (req.accepts('json')) {
            return res.json({ error: 'Not found' });
        }

        // default response type
        res.type('txt');
		res.status(404).send("Не могу найти страницу.");
    })

    // 500
    app.use(function (err, req, res, next) {
        console.error('error at %s\n', req.url, err.stack);
		res.status(500).send("Обнаружена ошибка в работе сервера. Обратитесь к Администратору.");
    })

};		// <--- app()
