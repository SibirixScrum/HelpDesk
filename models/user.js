/*
 * Модель проектов
 */

var mongoose = require('mongoose');
var crypto = require('crypto');
var mailModel = require('./mail');
var collectionName = 'user';

var userSchema = new mongoose.Schema({
    name:     String,  // Выводимое имя
    email:    String,  // Email
    password: String   // Хеш пароля
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
            callback(err);
            return;
        }

        if (data && data.length) {
            callback && callback(null, data);

        } else {
            var pass = this.generatePassword();
            var user = new userModel({
                name:     'Техническая поддержка',
                email:    email,
                password: this.hashPassword(pass)
            });

            user.save(function() {
                console.log('TP account created', email, pass, projects);
                mailModel.sendMail(email, 'Создан аккаунт для ТП', "Логин: " + email + "\nПароль\n:" + pass, false);
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
