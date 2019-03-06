var express = require('express');
var striptags = require('striptags');
var multer = require('multer');
var jsonwebtoken = require('jsonwebtoken');
var fs = require('fs');
var router = express.Router();

var models = require('../models/');
var projectModel = models.project;
var ticketModel = models.ticket;
var messageModel = models.message;
var fileModel = models.file;
var userModel = models.user;


let templateString = require('../services/template-string');
const i18nService = require('../services/i18n');
let i18nHelper = new i18nService.i18n();

/**
 * Получение списка тикетов
 */
router.get('/list', function(req, res) {
    if (!req.session.user) {
        res.json({ result: true, list: [] });
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);
    ticketModel.setTemplateBuilder(templateString);
    ticketModel.setI18nHelper(i18nHelper);

    var userEmail = req.session.user.email;
    var offset = req.query.offset ? req.query.offset : 0;
    var sort = req.query.sort ? req.query.sort : 'date asc';
    var state = req.query.state ? req.query.state : 'SHOW_ALL';
    var projectsFilter = (req.query.projects !== undefined) ? req.query.projects.split(',') : false;
    var emailFilter = req.query.email ? req.query.email : false;
    var tagsFilter = req.query.tags ? req.query.tags.split(',') : false;

    var projectList = i18nHelper.translateProjects(projectModel.getResponsibleProjectsList(userEmail));

    var filter = {};
    if (projectList.length) {
        var projectCodes = projectList.map(function(obj) { return obj.code; } );
        filter = { project: { $in: projectCodes } };
    } else {
        filter = { author: userEmail };
    }

    if (emailFilter && !filter.author) {
        filter.author = new RegExp('^.*' + emailFilter + '.*$', 'i');
    }

    if (tagsFilter && tagsFilter.length) {
        filter.tags = { $in: tagsFilter };
    }

    if (state == 'SHOW_CLOSED') {
        filter.opened = false;
    } else if (state == 'SHOW_OPENED') {
        filter.opened = true;
    }

    if (typeof projectsFilter !== 'object') {
        projectsFilter = [];
    }
    filter.project = { $in: projectsFilter };

    ticketModel.getTickets(filter, offset, sort, resultCallback);

    function resultCallback(err, data) {
        if (err) {
            res.json({result: false, error: 'some error'});
            return;
        }

        ticketModel.prepareTicketsForClient(data, function(err, data) {
            for (var i = 0; i < data.length; i++) {
                data[i].messages = [];
            }
            res.json({ result: true, list: data });
        });
    }
});

/**
 * Детальная информация по тикету
 */
router.get('/detail/:projectCode/:number', function(req, res) {
    var projectCode = req.params.projectCode;
    var number = parseInt(req.params.number, 10);

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);
    ticketModel.setTemplateBuilder(templateString);
    ticketModel.setI18nHelper(i18nHelper);

    if (!projectCode || !number) {
        res.json({ result: false, error: 'no params' });
        return;
    }

    if (!req.session.user) {
        res.json({ result: false, error: 'no auth' });
        return;
    }

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err || !ticket) {
            res.json({result: false, error: 'no ticket'});
            return;
        }

        if (!ticketModel.hasRightToWrite(ticket, req.session.user)) {
            res.json({ result: false, error: 'no rights' });
            return;
        }

        // Отправить ПУШ-оповещение
        ticketModel.prepareTicketsForClient([ticket], function(err, data) {
            var ticket = data[0];
            res.json({ result: true, ticket: ticket });
        });
    });
});

/**
 * Создание нового тикета
 */
var storage = multer.memoryStorage();
var upload = multer({ storage: storage, fileFilter: fileModel.fileFilter, limits: { fileSize: global.config.files.maxSize } });
var cpUpload = upload.fields([{ name: 'files[]', maxCount: global.config.files.maxCount }]);

router.post('/add', cpUpload, function (req, res) {

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    userModel.setI18nHelper(i18nHelper);
    userModel.setTemplateBuilder(templateString);

    ticketModel.setI18nHelper(i18nHelper);
    ticketModel.setTemplateBuilder(templateString);


    var project, projectCode = req.body.projectCode;
    if (!req.files) req.files = {};

    if (projectCode) {
        project = projectModel.getProjectByCode(projectCode);
    }

    if (!project) {
        project = projectModel.getProjectByDomain(req.get('host'));
    }

    if (!project) {
        fileModel.cleanupFiles(req.files['files[]']);
        res.json({
            result: false,
            error: 'Неизвестный домен'
        });
        return;
    }

    var email = req.body.email ? req.body.email.trim() : false;
    var name  = req.body.name  ? req.body.name.trim()  : false;
    var title = req.body.title ? req.body.title.trim() : false;
    var text  = req.body.text  ? req.body.text.trim()  : '';
    text = striptags(text, global.config.tickets.editor.allowedTags);

    // todo нормальная валидация
    if (!email || !name || !title || !text) {
        fileModel.cleanupFiles(req.files['files[]']);
        res.json({ result: false, error: 'no data' });
        return;
    }

    var ticket = new ticketModel.model({
        opened: true,
        lastDate: new Date(),
        authorName: name,
        title: title,
        project: project.code,
        author: email,
        messages: []
    });

    ticket.save(function(err, ticket) {
        if (err) {
            res.json({ result: false, error: 'save ticket error', errorOjbect: err });
            return;
        }

        ticket.number = projectModel.getBigUniqueNumber(ticket.autoCounter);

        // Загрузка файлов
        var files = fileModel.proceedUploads(project.code + '-' + ticket.number, req.files, 'files[]');

        // Сохранение тикета
        var message = new messageModel.model({
            date:   new Date(),
            author: email,
            text:   text,
            files:  files
        });

        ticket.messages = [message];

        ticket.save();

        // проверить/создать пользователя и отправить уведомление
        userModel.createGetUser(email, name, function(err, user, pass) {
            // Если передан пароль - пользователь создан
            if (pass) {
                ticketModel.sendMailOnTicketAddUserCreate(project, ticket, user, pass);
            } else {
                ticketModel.sendMailOnTicketAdd(project, ticket, user);
            }

            var result = {
                project: project.code,
                number: ticket.number
            };

            if (pass) {
                var token = jsonwebtoken.sign(email, global.config.socketIo.secret, { expiresIn: global.config.socketIo.expire * 60 });

                req.session.user = {
                    email: email,
                    name:  user.name,
                    token: token
                };

                result.user = {
                    name:  name,
                    email: email
                };
                result.token = token;
                result.countTickets = false;

                projectModel.getTicketCount(email, function(err, countTickets) {
                    if (!err && countTickets) {
                        result.countTickets = countTickets;
                    }

                    res.json(result);
                });
            } else {
                res.json(result);
            }

            // Отправить ПУШ-оповещение
            ticketModel.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(project.code).emit('newTicket', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
                global.io.to(email       ).emit('newTicket', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
            });
        });
    });
});

/**
 * Закрыть тикет
 */
router.post('/close', function (req, res) {
    var projectCode = req.body.projectCode;
    var number = req.body.number;

    if (!req.session.user) {
        res.json({ result: false, error: 'no auth' });
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    ticketModel.setI18nHelper(i18nHelper);
    ticketModel.setTemplateBuilder(templateString);

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err) { res.json({ result: false, error: 'no ticket' }); return; }

        if (ticketModel.hasRightToWrite(ticket, req.session.user)) {
            ticket.opened = false;
            ticket.save();

            var project = projectModel.getProjectByCode(projectCode);
            ticketModel.sendMailOnTicketClose(project, ticket);

            // Отправить ПУШ-оповещение
            ticketModel.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(projectCode        ).emit('ticketClosed', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
                global.io.to(ticket.author.email).emit('ticketClosed', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
            });

            res.json({ result: true });

        } else {
            res.json({ result: false, error: 'no rights' });
        }
    });
});

/**
 * Переоткрыть тикет
 */
router.post('/open', function (req, res) {
    var projectCode = req.body.projectCode;
    var number = req.body.number;

    if (!req.session.user) {
        res.json({ result: false, error: 'no auth' });
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    ticketModel.setI18nHelper(i18nHelper);
    ticketModel.setTemplateBuilder(templateString);

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err) { res.json({ result: false, error: 'no ticket' }); return; }

        if (ticketModel.hasRightToWrite(ticket, req.session.user)) {
            ticket.opened = true;
            ticket.save();

            var project = projectModel.getProjectByCode(projectCode);
            ticketModel.sendMailOnTicketOpen(project, ticket);

            // Отправить ПУШ-оповещение
            ticketModel.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(projectCode        ).emit('ticketOpened', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
                global.io.to(ticket.author.email).emit('ticketOpened', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
            });

            res.json({ result: true });

        } else {
            res.json({ result: false, error: 'no rights' });
        }
    });
});

router.post('/tag-add', function(req, res) {
    var projectCode = req.body.projectCode;
    var number = req.body.number;
    var tag = req.body.tag;

    if (!req.session.user) {
        res.json({ result: false, error: 'no auth' });
        return;
    }

    if (!tag) {
        res.json({result: false, error: 'no tag'});
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    ticketModel.setI18nHelper(i18nHelper);
    ticketModel.setTemplateBuilder(templateString);

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err) {
            res.json({result: false, error: 'no ticket'});
            return;
        }

        if (ticketModel.hasRightToSupport(ticket, req.session.user)) {
            if (!ticket.tags) {
                ticket.tags = [];
            }

            ticket.tags.push(tag);
            ticket.save();

            // Отправить ПУШ-оповещение
            ticketModel.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(projectCode).emit('ticketChange', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
                res.json({ result: true, ticket: ticket });
            });
        } else {
            res.json({ result: false, error: 'no rights' });
        }
    });
});

router.post('/tag-remove', function(req, res) {
    var projectCode = req.body.projectCode;
    var number      = req.body.number;
    var index       = parseInt(req.body.index, 10);

    if (!req.session.user) {
        res.json({result: false, error: 'no auth'});
        return;
    }

    if (isNaN(index)) {
        res.json({result: false, error: 'no tag'});
        return;
    }

    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    ticketModel.setI18nHelper(i18nHelper);
    ticketModel.setTemplateBuilder(templateString);

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err) {
            res.json({result: false, error: 'no ticket'});
            return;
        }

        if (ticketModel.hasRightToSupport(ticket, req.session.user)) {
            ticket.tags.splice(index, 1);
            ticket.save();

            // Отправить ПУШ-оповещение
            ticketModel.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(projectCode).emit('ticketChange', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
            });

            res.json({ result: true });
        } else {
            res.json({ result: false, error: 'no rights' });
        }
    });
});

module.exports = router;
