/*
 * Модель проектов
 */

var mongoose = require('mongoose');
var collectionName = 'ticket';
var messageModel = require('./message');
var projectModel = require('./project');
var mailModel = require('./mail');
var userModel = require('./user');
var autoIncrement = require('mongoose-auto-increment');
var fileModel = require('./file');

autoIncrement.initialize(global.mongooseConnection);

var ticketSchema = new mongoose.Schema({
    opened:   Boolean,  // Флаг открытости тикета
    lastDate: Date,     // Дата последнего сообщения в тикете
    title:    String,   // Заголовок
    project:  String,   // Код проекта (project.code)
    autoCounter: Number, // Номер тикета
    number:   Number,   // Номер тикета
    author:   String,   // привязка к пользователю - по емейлу
    messages: [messageModel.scheme]  // Массив сообщений в тикете
});

ticketSchema.plugin(autoIncrement.plugin, { model: collectionName, field: 'autoCounter' });

var pageSize = global.config.get('tickets.page.limit', 1000);
exports.scheme = ticketSchema;
exports.model  = mongoose.model(collectionName, ticketSchema);

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
            text = text.replace(/<base[^>]*>/ig, '');
        } else {
            text = mailObject.text.replace(/\r?\n/g, '<br>');
        }

        if (author.address != ticket.author && author.address != project.responsible) {
            //text += '\n\n-- Отправлено с ' + author.address + ' <' + author.name + '>';
            return false;
        }

        if (!ticket.opened) {
            return false;
        }

        var messageObj = new messageModel.model({
            date: mailObject.date,
            author: author.address,
            text: text,
            files: fileModel.proceedMailAttachments(project.code + '-' + ticket.number, mailObject.attachments)
        });

        if (mailObject.attachments && mailObject.attachments.length != messageObj.files.length) {
            messageObj.text += '<br><br>Внимание! Некоторые файлы не прошли валидацию и не будут отображены в сообщении.';
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
 */
function sendMailOnTicketAdd(project, ticket) {
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;
    var subject = 'Helpdesk создан новый тикет: "' + ticket.title + '" [#' + ticketNumber + ']';
    var text = '<p>Сообщение:</p><br>\n<br>\n';
    text += ticket.messages[0].text;
    mailModel.sendMail(to, subject, text, true, project, ticket.messages[0].getFilesForMail());

    to = ticket.author;
    subject = 'Helpdesk: тикет "' + ticket.title + '"  [#' + ticketNumber + ']';
    text = 'Добрый день. Вы подавали обращение в систему поддержки проекта ' + project.name + '.<br>\n';
    text += 'Вы можете отслеживать статус вашего обращения из <a href="http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to) + '">личного кабинета</a>, либо общаясь в этой цепочке писем (пожалуйста, не удаляйте номер тикета из темы письма при переписке).';
    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 */
function sendMailOnTicketClose(project, ticket) {
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;
    var subject = 'Helpdesk тикет "' + ticket.title + '" закрыт: [#' + ticketNumber + ']';
    var text = 'Тикет "' + ticket.title + '" закрыт.';
    mailModel.sendMail(to, subject, text, true, project);

    to = ticket.author;
    subject = 'Helpdesk: тикет "' + ticket.title + '" закрыт [#' + ticketNumber + ']';
    text = 'Добрый день. Ваше обращение в систему поддержки проекта ' + project.name + ' было закрыто.<br>\n';
    text += 'Вы можете переоткрыть ваше обращение из <a href="http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to) + '">личного кабинета</a>.';
    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 */
function sendMailOnTicketOpen(project, ticket) {
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;
    var subject = 'Helpdesk тикет "' + ticket.title + '" переоткрыт: [#' + ticketNumber + ']';
    var text = 'Тикет "' + ticket.title + '" переоткрыт.';
    mailModel.sendMail(to, subject, text, true, project);

    to = ticket.author;
    subject = 'Helpdesk: тикет "' + ticket.title + '" переоткрыт [#' + ticketNumber + ']';
    text = 'Добрый день. Ваше обращение в систему поддержки проекта ' + project.name + ' было переоткрыто.<br>\n';
    text += 'Вы можете отслеживать статус вашего обращения из <a href="http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to) + '">личного кабинета</a>, либо общаясь в этой цепочке писем (пожалуйста, не удаляйте номер тикета из темы письма при переписке).';
    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 * @param pass
 */
function sendMailOnTicketAddUserCreate(project, ticket, pass) {
    var ticketNumber = project.code + '-' + ticket.number;

    var to = project.responsible;
    var subject = 'Helpdesk создан новый тикет: "' + ticket.title + '" [#' + ticketNumber + ']';
    var text = '<p>Сообщение:</p>\n\n';
    text += ticket.messages[0].text;
    mailModel.sendMail(to, subject, text, true, project, ticket.messages[0].getFilesForMail());

    to = ticket.author;
    subject = 'Helpdesk: тикет "' + ticket.title + '"  [#' + ticketNumber + ']';
    text = 'Добрый день. Вы подавали обращение в систему поддержки проекта ' + project.name + '.<br>\n';
    text += 'Вы можете отслеживать статус вашего обращения из <a href="http://' + project.domain + '/tickets/' + ticketNumber + '?login=' + encodeURIComponent(to) + '">личного кабинета</a>, либо общаясь в этой цепочке писем (пожалуйста, не удаляйте номер тикета из темы письма при переписке).\n';
    text += 'Логин для доступа: ' + ticket.author + '\n';
    text += 'Пароль: ' + pass + '\n';
    mailModel.sendMail(to, subject, text, true, project);
}

/**
 *
 * @param project
 * @param ticket
 * @param message
 */
function sendMailOnMessageAdd(project, ticket, message, filesSkiped) {
    var ticketNumber = exports.compileTicketNumber(project, ticket.number);

    var to = project.responsible == message.author ? ticket.author : project.responsible;
    var subject = 'Helpdesk тикет "' + ticket.title + '"  [#' + ticketNumber + ']: новое сообщение';
    var text = 'Новое сообщение в тикете:<br>\n<br>\n';
    text += message.text;

    mailModel.sendMail(to, subject, text, true, project, message.getFilesForMail());
}

/**
 * Генерация текстового номера тикета
 * @param project
 * @param ticketNumber
 * @returns {string}
 */
exports.compileTicketNumber = function(project, ticketNumber) {
    return project.letters + '-' + ticketNumber;
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
                    name:  userNames[ticket.author]
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
