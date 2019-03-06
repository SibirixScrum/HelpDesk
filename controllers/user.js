var express = require('express');
var jsonwebtoken = require('jsonwebtoken');
var router = express.Router();

var models = require('../models/');
var userModel = models.user;
var projectModel = models.project;

let templateString = require('../services/template-string');
const i18nService = require('../services/i18n');
let i18nHelper = new i18nService.i18n();

/**
 * Авторизация
 */
router.post('/login', function (req, res) {
    var email = req.body.email.trim();
    var pass  = req.body.password.trim();

    if (!email.length || !pass.length) {
        res.json({ result: false, error: 'no auth data' });
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    userModel.setI18nHelper(i18nHelper);
    userModel.setTemplateBuilder(templateString);

    projectModel.setI18nHelper(i18nHelper);
    projectModel.setTemplateBuilder(templateString);

    // Ищем пользователя
    userModel.model.find({ email: email }, function(err, data) {
        if (err || !data || !data.length) {
            res.json({ result: false, error: 'no user' });
            return;
        }

        var user = data[0];
        // Проверяем пароль
        if (userModel.validatePassword(user.password, pass)) {
            var token = jsonwebtoken.sign(email, global.config.socketIo.secret, { expiresIn: global.config.socketIo.expire * 60 });

            req.session.user = {
                email: email,
                name:  user.name,
                token: token,
                lng: user.lng || i18nHelper.language
            };

            var answer = {
                result: true,
                user: {
                    name:   user.name,
                    email:  email,
                    lng: user.lng || i18nHelper.language
                },
                token: token,
                countTickets: false
            };

            projectModel.getTicketCount(email, function(err, countTickets) {
                if (!err && countTickets) {
                    answer.countTickets = countTickets;
                }

                res.json(answer);
            });

        } else {
            res.json({ result: false, error: 'wrong pass' });
        }
    });
});

router.post('/reset', function(req, res) {
    var email = req.body.email.trim();

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    userModel.setI18nHelper(i18nHelper);
    userModel.setTemplateBuilder(templateString);

    userModel.sendResetEmail(email, function(response) {
        res.json(response);
    })
});

/**
 * Логаут
 */
router.all('/logout', function (req, res) {
    req.session.user = null;
    res.json({ result: true });
});

router.post('/change-lang', function(req, res) {
    if (!req.session.user) {
        res.json({ result: false, error: 'no auth' });
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    userModel.changeLng(req.session.user.email, req.body.lng);

    res.json({ result: true});

});

module.exports = router;
