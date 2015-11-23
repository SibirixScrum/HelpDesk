// Node modules
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var express      = require('express');
var favicon      = require('serve-favicon');
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

// Читаем конфиг
var extend        = require('extend');
var configExample = require('./config/config.example');

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

var models = require('./models/');
models.setCallback(function() {
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

    app.use(favicon(__dirname + '/public/favicon.ico'));
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

    var httpServer = http.createServer(app);

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
