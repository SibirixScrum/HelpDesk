/*
 * Модель моделей
 */

var mongoose = require('mongoose');
mongoose.connect(global.config.db.connectString);

var initCallback = null;
var inited = false;

var db = mongoose.connection;
global.mongooseConnection = db;
db.on('error', function(err) {
    throw 'connection error: ' + err;
});

db.once('open', function callback () {
    exports.project = require('./project.js');
    exports.ticket  = require('./ticket.js');
    exports.user    = require('./user.js');
    exports.message = require('./message.js');
    exports.file    = require('./file.js');
    exports.mail    = require('./mail.js');

    if (typeof initCallback === 'function') {
        initCallback();
        inited = true;
        initCallback = null;
    }
});

/**
 *
 * @param cb
 */
exports.setCallback = function(cb) {
    if (inited) {
        cb();
    } else {
        initCallback = cb;
    }
};
