// Node modules
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var express      = require('express');
var favicon      = require('serve-favicon');
var fs           = require('fs');
var http         = require('http');
var https        = require('https');
var logger       = require('morgan');
var mongoose     = require('mongoose');
var mongoStore   = require('connect-mongodb');
var path         = require('path');
var session      = require('express-session');
var jwt          = require('jsonwebtoken');
var socketIo     = require('socket.io');
var socketioJwt  = require('socketio-jwt');

const i18next = require('./libs/i18next');
const middleware = require('i18next-express-middleware');
const i18nFsBackend = require('i18next-node-fs-backend');
const intervalPlural = require('i18next-intervalplural-postprocessor');

// Читаем конфиг
var extend        = require('extend');
var configExample = require('./config/config.example');

let lang = require('./config/locale');

try {
    var config = require('./config/config');
} catch (e) {
    throw new Error('Not found config file! Copy ./config/config.example.js to ./config/config.js and edit it.');
}

global.config = config = extend(true, configExample, config, {
    get: function(name, def) {
        var namePath = name.split('.');
        var result = this;

        namePath.forEach(function(key){
            if (undefined === result) {
                return false;
            }

            result = result[key];
            return true;
        });

        if (undefined === result) {
            return def;
        }

        return result;
    }
});

// инициализация i18n
i18next
    .use(i18nFsBackend)
    .use(middleware.LanguageDetector)
    .use(intervalPlural)
    .init({
        backend: {
            loadPath: path.join(__dirname, 'public') + '/locales/{{lng}}.json',
        },
        fallbackLng: lang.fallbackLng,
        lowerCaseLng: true,
        preload: lang.locales,
        interpolation: {
            escapeValue: false
        },

        parseMissingKeyHandler: function(key, options) {
            const regex = /^(\w+\.\w+\.)/;

            if (regex.exec(key) !== null) {
                let resultKey = key.replace(regex, '');
                return i18next.t(resultKey, options);
            }

            return key;

        },

        detection: config.detection
    });

global.defaultTranslator = i18next.getFixedT(lang.defaultLanguage);

var models = require('./models/');

models.setCallback(function() {

    models.project.validateProjectsConfig();
    models.project.checkResponsible();

    var indexController   = require('./controllers/index');
    var ticketController  = require('./controllers/ticket');
    var messageController = require('./controllers/message');
    var userController    = require('./controllers/user');

    var app = express();

    app.set('port', config.port || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    // Использование сессий
    app.use(session({
        cookie: {maxAge: config.session.maxAge},
        secret: config.session.secret,
        store: new mongoStore({db: mongoose.connection.db}),
        resave: true,
        saveUninitialized: true
    }));

    app.use(
        middleware.handle(i18next, {
            removeLngFromUrl: false
        })
    );

    //app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded());
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/ticket',  ticketController);
    app.use('/message', messageController);
    app.use('/user',    userController);
    app.use('/',        indexController);

    /// catch 404 and forwarding to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    /// error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);

            if (req.headers['accept'] == 'application/json' || req.headers['x-requested-with'] && (req.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest')) {
                res.end(JSON.stringify({result: false, message: err.message, error: err}));
            } else {
                res.render('error', {
                    message: err.message,
                    error: err
                });
            }
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);

        if (req.headers['x-requested-with'] && (req.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest')) {
            res.end(JSON.stringify({result: false, message: err.message, error: err}));
        } else {
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });

    var httpServer;

    if (config.ssl && config.ssl.enabled) {
        var privateKey = fs.readFileSync(config.ssl.key);
        var certificate = fs.readFileSync(config.ssl.cert);
        var credentials = {key: privateKey, cert: certificate};
        httpServer = https.createServer(credentials, app);
    } else {
        httpServer = http.createServer(app);
    }

    var io = socketIo.listen(httpServer);
    io.sockets
        .on('connection', socketioJwt.authorize({
            secret: global.config.socketIo.secret,
            timeout: global.config.socketIo.timeout
        })).on('authenticated', function(socket) {
            var userEmail = socket.decoded_token;
            var projectsList = models.project.getResponsibleProjectsList(userEmail);

            if (projectsList.length) {
                // ТП
                for (var i = 0; i < projectsList.length; i++) {
                    socket.join(projectsList[i].code);
                }
            } else {
                // Клиент
                socket.join(userEmail);
            }
        }
    );

    global.io = io;

    models.mail.startCheckTimeout();

    httpServer.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });
});
