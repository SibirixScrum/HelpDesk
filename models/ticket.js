/*
 * Модель проектов
 */

var mongoose = require('mongoose');
var collectionName = 'ticket';
var striptags    = require('striptags');
var messageModel = require('./message');
var projectModel = require('./project');
var mailModel = require('./mail');
var userModel = require('./user');
var autoIncrement = require('mongoose-auto-increment');
var fileModel = require('./file');
let lang = require('../config/locale');


let templateString = require('../services/template-string');
const i18nService = require('../services/i18n');
let i18nHelper = new i18nService.i18n();

let templateBuilder = templateString;

exports.setI18nHelper = (helper) => {
    i18nHelper = helper;
};

exports.setTemplateBuilder = (builder) => {
    templateBuilder = builder;
};


autoIncrement.initialize(global.mongooseConnection);

var ticketSchema = new mongoose.Schema({
    opened:   Boolean,  // Флаг открытости тикета
    lastDate: Date,     // Дата последнего сообщения в тикете
    title:    String,   // Заголовок
    project:  String,   // Код проекта (project.code)
    autoCounter: Number, // Номер тикета
    number:   Number,   // Номер тикета
    author:   String,   // привязка к пользователю - по емейлу
    authorName: String,   // Имя
    tags: [String],
    messages: [messageModel.scheme]  // Массив сообщений в тикете
});

ticketSchema.plugin(autoIncrement.plugin, { model: collectionName, field: 'autoCounter' });

var pageSize = global.config.get('tickets.page.limit', 1000);
exports.scheme = ticketSchema;
exports.model  = mongoose.model(collectionName, ticketSchema);

exports.getTagsReference = function(cb) {
    var countByTag = {}, result = [];
    this.model.find({}, {tags: true}, function(err, tickets) {
        if (err) {
            cb([]);
            return;
        }

        tickets.map(function(ticket) {
            if (ticket.tags) {
                ticket.tags.map(function(tag) {
                    if (!countByTag[tag]) {
                        countByTag[tag] = 0;
                    }

                    countByTag[tag]++;
                });
            }
        });

        Object.keys(countByTag).map(function(tag) {
            result.push({ tag: tag, count: countByTag[tag] });
        });

        cb(result.sort(function(a, b) {
            var field = a.count == b.count ? 'tag' : 'count';
            return a[field] < b[field] ? 1 : (a[field] > b[field] ? -1 : 0);
        }).map(function(tag) { return tag.tag; }));
    });
};

/**
 * Проверка прав доступа на тикет. Изменять может открывший и ТП (добавить сообщение, открыть, закрыть)
 * @param ticket
 * @param user
 * @returns {boolean}
 */
exports.hasRightToWrite = function(ticket, user) {
    if (!user) return false;

    if (ticket.author == user.email) {
        return true;

    } else {
        var projects = projectModel.getResponsibleProjectsList(user.email);
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].code == ticket.project) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Проверка прав доступа как сотрудника на тикет
 * @param ticket
 * @param user
 * @returns {boolean}
 */
exports.hasRightToSupport = function(ticket, user) {
    if (!user) return false;

    var projects = projectModel.getResponsibleProjectsList(user.email);
    for (var i = 0; i < projects.length; i++) {
        if (projects[i].code == ticket.project) {
            return true;
        }
    }

    return false;
};

/**
 *
 * @param project
 * @param number
 * @param mailObject
 */
exports.addMessageFromMail = function(project, number, mailObject) {
    var self = this;
    this.model.find({ project: project.code, number: number }, function(err, res) {
        if (err) { console.log(err); return; }
        if (!res || !res.length) { return; }

        var ticket = res[0];
        var author = mailObject.from[0];
        var text = mailObject.html;

        if (text) {
            text = text.replace(/<base[^>]*>/ig, '').replace('<style[^>]*>.*?</style>', '');
        } else {
            text = mailObject.text.replace(/\r?\n/g, '<br>');
        }
        text = striptags(text, global.config.tickets.editor.allowedTags);

        var authorEmail = author.address.toLowerCase();
        if (authorEmail === ticket.author.toLowerCase()) {
            authorEmail = ticket.author;
        } else if (authorEmail === project.responsible.toLowerCase()) {
            authorEmail = project.responsible;
        } else {
            console.log(new Date() + ': message not added, author address: ' + author.address);
            return false;
        }

        if (!ticket.opened) {
            ticket.opened = true;
            sendMailOnTicketOpen(project, ticket);

            // Отправить ПУШ-оповещение
            self.prepareTicketsForClient([ticket], function(err, data) {
                var ticket = data[0];
                global.io.to(project.code        ).emit('ticketOpened', { ticket: ticket, source: authorEmail });
                global.io.to(ticket.author.email).emit('ticketOpened', { ticket: ticket, source: authorEmail });
            });
        }

        var messageObj = new messageModel.model({
            date: mailObject.date,
            author: authorEmail,
            text: text,
            files: fileModel.proceedMailAttachments(project.code + '-' + ticket.number, mailObject.attachments)
        });

        if (mailObject.attachments && mailObject.attachments.length != messageObj.files.length) {
            messageObj.text += i18nHelper.translator(`${templateBuilder.getStartCode()}.ticket.addMessageFromMail.attachmentsText`);
        }

        if (messageObj.author != project.responsible) {
            ticket.lastDate = new Date();
        }

        ticket.messages.push(messageObj);
        ticket.save();

        sendMailOnMessageAdd(project, ticket, messageObj, mailObject.attachments && mailObject.attachments.length != messageObj.files.length);

        // Отправить ПУШ-оповещение
        self.prepareTicketsForClient([ticket], function(err, data) {
            var ticket = data[0];
            global.io.to(project.code).emit('ticketMessage', {
                ticket: ticket,
                source: project.responsible == messageObj.author ? project.responsible : ticket.author.email
            });
            global.io.to(ticket.author.email).emit('ticketMessage', {
                ticket: ticket,
                source: project.responsible == messageObj.author ? project.responsible : ticket.author.email
            });
        });
    });
};

/**
 * Список тикетов пользователя
 * @param filter
 * @param offset
 * @param sort
 * @param callback
 */
exports.getTickets = function(filter, offset, sort, callback) {
    var sorting = this.getSort(sort);
    this.model
        .find(filter)
        .sort(sorting)
        .skip(offset)
        .limit(pageSize)
        .exec(function(err, res) {
                if (err) { callback && callback(err); return; }
                callback && callback(null, res);
            }
        );
};

/**
 * Список тикетов пользователя
 * @param email
 * @param offset
 * @param sort
 * @param callback
 */
exports.getUserTickets = function(email, offset, sort, callback) {
    this.getTickets({ author: email }, offset, sort, callback);
};

/**
 * Список тикетов по проектам
 * @param projectCodes
 * @param offset
 * @param sort
 * @param callback
 */
exports.getProjectTickets = function(projectCodes, offset, sort, callback) {
    this.getTickets({ project: { $in: projectCodes } }, offset, sort, callback);
};

/**
 * Найти тикет по проекту и номеру
 * @param projectCode
 * @param number
 * @param callback
 */
exports.findTicket = function(projectCode, number, callback) {
    this.model.find({ project: projectCode, number: number }, function(err, res) {
        if (err) { callback && callback(err); return; }
        callback && callback(null, res ? res[0] : false);
    });
};

/**
 * Получить сортировку
 * @param textSort
 * @returns {*}
 */
exports.getSort = function(textSort) {
    if (textSort == 'date asc') {
        return { opened: -1, lastDate: -1 };
    } else if (textSort == 'date desc') {
        return { opened: -1, lastDate: 1 };
    } else if (textSort == 'opened asc') {
        return { opened: 1, lastDate: -1 };
    } else if (textSort == 'opened desc') {
        return { opened: -1, lastDate: -1 };
    } else {
        return { lastDate: 1 };
    }
};

exports.sendMailOnTicketAdd = sendMailOnTicketAdd;
exports.sendMailOnTicketAddUserCreate = sendMailOnTicketAddUserCreate;
exports.sendMailOnMessageAdd = sendMailOnMessageAdd;
exports.sendMailOnTicketClose = sendMailOnTicketClose;
exports.sendMailOnTicketOpen = sendMailOnTicketOpen;

/**
 *
 * @param project
 * @param ticket
 * @param user
 */
function sendMailOnTicketAdd(project, ticket, user) {
    mailModel.setI18nHelper(i18nHelper);
    var ticketNumber = this.compileTicketNumber(project, ticket.number);
    var to = project.responsible;

    var subject = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAdd.subjectForResponsible`,
        {
            title: ticket.title,
            ticketNumber: ticketNumber
        }
    );

    var text = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAdd.textForResponsible`,
        {
            authorName: ticket.authorName,
            title: ticket.title,
            text: ticket.messages[0].text
        }
    );

    mailModel.sendMail(to, subject, text, true, project, ticket.messages[0].getFilesForMail());

    //change language to user
    to = ticket.author;

    let userTranslator = i18nHelper.getTranslatorForUser(user);

    subject = userTranslator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAdd.subjectForAuthor`,
        {
            title: ticket.title,
            ticketNumber: ticketNumber
        }
    );

    text = userTranslator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAdd.textForAuthor`,
        {
            projectName: userTranslator(project.name),
            link: 'http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to),
            text: ticket.messages[0].text
        }
    );

    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 */
function sendMailOnTicketClose(project, ticket) {
    mailModel.setI18nHelper(i18nHelper);
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;

    var subject = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketClose.subject`,
        {
            title: ticket.title,
            ticketNumber: ticketNumber
        }
    );

    var text = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketClose.textForResponsible`,
        {
            title: ticket.title,
        }
    );

    mailModel.sendMail(to, subject, text, true, project);

    to = ticket.author;

    let userTranslator = i18nHelper.getTranslatorForEmail(to);
    text = userTranslator(`${templateBuilder.getStartCode()}.ticket.sendMailOnTicketClose.textForAuthor`,
        {
            projectName: userTranslator(project.name),
            link: 'http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to),
        }
    );

    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 */
function sendMailOnTicketOpen(project, ticket) {
    mailModel.setI18nHelper(i18nHelper);
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;

    var subject = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketOpen.subject`,
        {
            title: ticket.title,
            ticketNumber: ticketNumber
        }
    );

    var text = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketOpen.textForResponsible`,
        {
            title: ticket.title,
        }
    );

    mailModel.sendMail(to, subject, text, true, project);

    to = ticket.author;

    let userTranslator = i18nHelper.getTranslatorForEmail(to);
    text = userTranslator(`${templateBuilder.getStartCode()}.ticket.sendMailOnTicketOpen.textForAuthor`,
        {
            projectName: userTranslator(project.name),
            link: 'http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to),
        }
    );
    console.log(text);

    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 * @param user
 * @param pass
 */
function sendMailOnTicketAddUserCreate(project, ticket, user, pass) {
    mailModel.setI18nHelper(i18nHelper);
    var ticketNumber = this.compileTicketNumber(project, ticket.number);
    var to = project.responsible;
    var subject = i18nHelper.translator(`${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAddUserCreate.subjectForResponsible`, {title: ticket.title, ticketNumber: ticketNumber});
    var text = i18nHelper.translator(`${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAddUserCreate.textForResponsible`, {text: ticket.messages[0].text});

    mailModel.sendMail(to, subject, text, true, project, ticket.messages[0].getFilesForMail());

    to = ticket.author;

    let userTranslator = i18nHelper.getTranslatorForUser(user);

    subject = userTranslator(`${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAddUserCreate.subjectForAuthor`, {title: ticket.title, ticketNumber: ticketNumber});
    text = userTranslator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnTicketAddUserCreate.textForAuthor`,
        {
            projectName: userTranslator(project.name),
            link: 'http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to),
            login: ticket.author,
            pass: pass
        }
    );

    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 * @param message
 */
function sendMailOnMessageAdd(project, ticket, message, filesSkiped) {
    mailModel.setI18nHelper(i18nHelper);
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible == message.author ? ticket.author : project.responsible;


    var subject = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnMessageAdd.subject`,
        {
            title: ticket.title,
            ticketNumber: ticketNumber
        }
    );

    var text = i18nHelper.translator(
        `${templateBuilder.getStartCode()}.ticket.sendMailOnMessageAdd.textForResponsible`,
        {
            title: ticket.title,
        }
    );

    let userTranslator = i18nHelper.translator;

    if (project.responsible == message.author) {
        userTranslator = i18nHelper.getTranslatorForEmail(to);
    }

    text = userTranslator(`${templateBuilder.getStartCode()}.ticket.sendMailOnMessageAdd.${project.responsible == message.author ? 'textForAuthor' : 'textForResponsible'}`,
        {
            authorName: ticket.authorName,
            title: ticket.title,
            text: message.text,
        }
    );

    mailModel.sendMail(to, subject, text, true, project, message.getFilesForMail());
}

/**
 * Генерация текстового номера тикета
 * @param project
 * @param ticketNumber
 * @returns {string}
 */
exports.compileTicketNumber = function(project, ticketNumber) {
    return project.code + '-' + ticketNumber;
};

/**
 * Подготовить тикеты к отправке на клиента
 * @param ticketList
 * @param callback
 */
exports.prepareTicketsForClient = function(ticketList, callback) {
    var userMails = {};

    for (var i = 0; i < ticketList.length; i++) {
        var ticket = ticketList[i];
        userMails[ticket.author] = true;
        for (var j = 0; j < ticket.messages.length; j++) {
            userMails[ticket.messages[j].author] = true;
        }
    }

    userMails = Object.keys(userMails);
    if (userMails.length) {
        userModel.model.find({ email: { $in: userMails } }, function(err, users) {
            if (err) { callback && callback(err); return; }

            var i, j, userNames = {};
            for (i = 0; i < users.length; i++) {
                userNames[users[i].email] = users[i].name;
            }

            for (i = 0; i < ticketList.length; i++) {
                var ticket = ticketList[i].toObject({});
                ticket.author = {
                    email: ticket.author,
                    name:  userNames[ticket.author],
                };

                for (j = 0; j < ticket.messages.length; j++) {
                    var message = ticket.messages[j];
                    message.author = {
                        email: message.author,
                        name:  userNames[message.author]
                    };
                    var lastMessage = ticket.messages[ticket.messages.length - 1];
                    ticket.isLastSupport = ticket.author.email !== lastMessage.author.email;
                    ticket.messages[j] = message;
                }
                ticketList[i] = ticket;
            }

            callback && callback(null, ticketList);
        });
    } else {
        callback(null, ticketList);
    }
};
