/*
 * Модель проектов
 */

var mongoose = require('mongoose');
var crypto = require('crypto');
var mailModel = require('./mail');
var collectionName = 'user';
var ticketModel = require('./ticket');

var userSchema = new mongoose.Schema({
    name:       String,  // Выводимое имя
    email:      String,  // Email
    resetHash:  String,
    password:   String   // Хеш пароля
});

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
            console.log(email, pass);
            var user = new userModel({
                name:     'Техническая поддержка',
                email:    email,
                password: this.hashPassword(pass)
            });

            user.save(function() {
                var projectNames = projects.map(function(obj) { return obj.name; } );
                console.log('TP account created', email, pass, projectNames);
                var subject = 'Helpdesk — новый пароль администратора';
                var text = '<p>';
                text += ((projects.length > 1) ? 'Для проектов ' : 'Для проекта ') + projectNames.join(', ');
                var url = 'http://' + projects[0].domain + '/?login=' + encodeURIComponent(email);
                text += ' создан новый администратор. Список тикетов доступен <a href="' + url + '">по ссылке</a><br>';
                text += "Логин: " + email + "<br>\nПароль: " + pass;
                text += "</p>";
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
                password: this.hashPassword(pass)
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

            userModel.update({email: email}, {resetHash: hash}, function(err, raw) {
                if (err) {
                    cb({result: false, error: 'no user'});
                    return;
                }

                var to = email;
                var subject = 'Helpdesk восстановление пароля';
                var text = 'Добрый день. Вы оставили запрос на смену пароля. Если вы этого не делали, просто проигнорируйте это письмо.<br>\n Чтобы поменять пароль, перейдите по этой <a href="http://' + project.domain + '/?reset='+hash+'&login='+encodeURIComponent(email)+'">ссылке</a>.';

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
                var subject = 'Helpdesk ваш пароль был изменен';
                var text = 'Добрый день. </br>\n Ваш пароль был успешно изменен. Новый пароль &mdash; ' + pass;

                mailModel.sendMail(to, subject, text, true, project);

                cb(true);
            });
        });
    }.bind(this));
}