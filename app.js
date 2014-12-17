var appSettings = require('./settings.json'),
	express = require('express'),
	expressMiddlewares = require('express-middlewares'),
	mongoose = require('mongoose'),
	models = require('./models'),
	https = require('https'),
	path = require('path'),
	routes = require('./routes'),
	fs = require('fs'),
	app = express();

var sslcert = {
    key: fs.readFileSync(__dirname + '/cert/icinga.pem'),
    cert: fs.readFileSync(__dirname + '/cert/icinga-cert.pem') };    

// Параметры Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('x-powered-by', false);
app.use(expressMiddlewares.favicon());
app.use(expressMiddlewares.bodyParser());
app.use(express.static(path.join(__dirname, 'static')));

var crypto = require('crypto');
var cookieSecret = crypto.randomBytes(32).toString("base64");

app.use(expressMiddlewares.cookieParser(cookieSecret));
app.use(expressMiddlewares.session(
    {	secret: cookieSecret,
		cookie: { maxAge: 28800000, secure: true } }));

// Подключаемся к MongoDB
mongoose.connect("mongodb://localhost/icinga", function (err) {
	if (err) throw err;
	routes(app);
});		// <--- mongoose.connect()


https.createServer(sslcert, app).listen(appSettings.port, function(){
  console.log('Express server listening on https://'+ process.env.HOSTNAME + ':' + appSettings.port);
});