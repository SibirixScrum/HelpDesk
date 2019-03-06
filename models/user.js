/*
 * Модель проектов
 */

var mongoose = require('mongoose');
var crypto = require('crypto');
var mailModel = require('./mail');
var collectionName = 'user';
var ticketModel = require('./ticket');

let templateString = require('../services/template-string');
const i18nService = require('../services/i18n');
let i18nHelper = new i18nService.i18n();

var userSchema = new mongoose.Schema({
    name:       String,  // Выводимое имя
    email:      String,  // Email
    resetHash:  String,
    password:   String,   // Хеш пароля
    lng:        String  // язык пользователя
});

let templateBuilder = templateString;

exports.setI18nHelper = (helper) => {
    i18nHelper = helper;
};

exports.setTemplateBuilder = (builder) => {
    templateBuilder = builder;
};

exports.scheme = userSchema;
exports.model  = mongoose.model(collectionName, userSchema);

/**
 * Создать ответственного
 * @param email
 * @param projects
 * @param callback
 */
exports.createResponsible = function(email, projects, callback) {
    var userModel = this.model;

    userModel.find({email: email}, function(err, data) {
        if (err) {
            callback && callback(err);
            return;
        }

        if (data && data.length) {
            callback && callback(null, data);

        } else {
            var pass = this.generatePassword();

            var user = new userModel({
                name:     i18nHelper.translator(`${templateBuilder.getStartCode()}.user.createResponsible.name`),
                email:    email,
                password: this.hashPassword(pass),
                lng: i18nHelper.language
            });

            user.save(function() {
                let projectNames = projects.map(function(obj) { return obj.name; } );

                console.log('TP account created', email, pass, projectNames);

                let subject = i18nHelper.translator(`${templateBuilder.getStartCode()}.user.createResponsible.subject`);
                let text = i18nHelper.translator(
                    `${templateBuilder.getStartCode()}.user.createResponsible.text`,
                    {
                        projectCount: projectNames.length,
                        projectNames: i18nHelper.translator(projectNames.join(', ')),
                        link: 'http://' + projects[0].domain + '/?login=' + encodeURIComponent(email),
                        login: email,
                        pass: pass
                    }
                );

                mailModel.sendMail(email, subject, text, true, global.config.projects[0]);
            });
        }
    }.bind(this));
};

/**
 * Найти/создать пользователя
 * @param email
 * @param name
 * @param callback
 */
exports.createGetUser = function(email, name, callback) {
    var userModel = this.model;

    userModel.find({email: email}, function(err, data) {
        if (err) { callback(err); return; }

        if (data && data.length) {
            callback && callback(null, data[0], false);

        } else {
            var pass = this.generatePassword();
            console.log(email, pass);
            var user = new userModel({
                name:     name,
                email:    email,
                password: this.hashPassword(pass),
                lng: i18nHelper.language
            });

            user.save(function() {
                callback && callback(null, user, pass);
            });
        }
    }.bind(this));
};

/**
 * Сгенерировать пароль
 * @returns {string}
 */
exports.generatePassword = function() {
    return Math.random().toString(36).slice(-8);
};

/**
 * Хешировать пароль
 * @param pass
 * @param salt
 * @returns {string}
 */
exports.hashPassword = function(pass, salt) {
    if (typeof salt === 'undefined') {
        salt = this.generatePassword();
    }

    var shasum = crypto.createHash('sha1');
    shasum.update(pass);
    shasum.update(salt);
    var text = shasum.digest('hex');

    return salt + text;
};

/**
 * Проверить пароль по хешу
 * @param hash
 * @param pass
 * @returns {boolean}
 */
exports.validatePassword = function(hash, pass) {
    var salt = hash.substr(0, 8);
    var shasum = crypto.createHash('sha1');
    shasum.update(pass);
    shasum.update(salt);
    var newHash = salt + shasum.digest('hex');

    return (hash == newHash);
};

exports.sendResetEmail = function(email, cb) {
    var userModel = this.model;

    userModel.find({email: email}, function(err, data) {
        if (err || !data || !data.length) {
            cb({ result: false, error: 'no user' })
            return;
        }

        var user = data[0];

        var hash = crypto.createHash('sha1').update(Date.now().toString()).digest('hex');

        ticketModel.getTickets({author: email}, 0, 'date desc', function(err, tickets) {
            if (err || !tickets.length) {
                cb({result: false, error: 'no user'});
                return;
            }

            var project = global.config.projects.filter(function(p) {return p.code === tickets[0].project})[0];

            if (!project) {
                cb({result: false, error: 'no user'});
                return;

            }

            userModel.update({email: email}, {resetHash: hash}, function(err, raw) {
                if (err) {
                    cb({result: false, error: 'no user'});
                    return;
                }

                var to = email;
                var subject = i18nHelper.translator(`${templateBuilder.getStartCode()}.user.sendResetEmail.subject`);

                var text = i18nHelper.translator(
                    `${templateBuilder.getStartCode()}.user.sendResetEmail.text`,
                    {
                        link: `http://${project.domain}/?reset=${hash}&login=${encodeURIComponent(email)}`
                    });

                mailModel.sendMail(to, subject, text, true, project);

                cb({result: true});
            })
        });
    });
}

exports.resetPassword = function(email, hash, cb) {
    this.model.find({email: email}, function(err, data) {
        if (err || !data || !data.length) {
            cb(false)
            return;
        }

        var user = data[0];

        if (!user.resetHash || hash !== user.resetHash) {
            cb(false);
            return;
        }
        
        var pass = this.generatePassword();

        this.model.update({email: email}, {resetHash: '', password: this.hashPassword(pass)}, function(err) {
            if (err) {
                cb(false);
                return;
            }

            ticketModel.getTickets({author: email}, 0, 'date desc', function(err, tickets) {
                if (err) {
                    cb(false);
                    return;
                }

                var project = global.config.projects.filter(function(p) {return p.code === tickets[0].project})[0];

                var to = email;
                var subject = i18nHelper.translator(`${templateBuilder.getStartCode()}.user.resetPassword.subject`);
                var text = i18nHelper.translator(`${templateBuilder.getStartCode()}.user.resetPassword.text`, {pass: pass});

                mailModel.sendMail(to, subject, text, true, project);

                cb(true);
            });
        });
    }.bind(this));
}

exports.changeLng = (userEmail, lng) => {
    let userModel = this.model;

    userModel.find({email: userEmail}, (err, data) => {
        if (err) { return; }

        if (data && data.length) {
            userModel.update({email: userEmail}, {lng: lng}, () => {});
        }
    });
};