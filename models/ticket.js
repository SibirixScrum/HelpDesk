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

autoIncrement.initialize(global.mongooseConnection);

var ticketSchema = new mongoose.Schema({
    opened:   Boolean,  // Флаг открытости тикета
    lastDate: Date,     // Дата последнего сообщения в тикете
    title:    String,   // Заголовок
    project:  String,   // Код проекта (project.code)
    number:   Number,   // Номер тикета
    author:   String,   // привязка к пользователю - по емейлу
    messages: [messageModel.scheme]  // Массив сообщений в тикете
});

ticketSchema.plugin(autoIncrement.plugin, { model: collectionName, field: 'number' });

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
        var text = mailObject.text;

        if (author.address != ticket.author && author.address != project.responsible) {
            text += '\n\n-- Отправлено с ' + author.address + ' <' + author.name + '>';
        }

        var messageObj = new messageModel.model({
            date: mailObject.date,
            author: author.address,
            text: text
            // todo: attachments: mailObject.attachments
        });

        ticket.messages.push(messageObj);
        ticket.save();
        // Отправить ПУШ-оповещение
        self.prepareTicketsForClient([ticket], function(err, data) {
            var ticket = data[0];
            global.io.to(project.code       ).emit('ticketMessage', { ticket: ticket });
            global.io.to(ticket.author.email).emit('ticketMessage', { ticket: ticket });
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
        callback && callback(null, res[0]);
    });
};

/**
 * Получить сортировку
 * @param textSort
 * @returns {*}
 */
exports.getSort = function(textSort) {
    if (textSort == 'date asc') {
        return { lastDate: -1 };
    } else if (textSort == 'date desc') {
        return { lastDate: 1 };
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

/**
 *
 * @param project
 * @param ticket
 */
function sendMailOnTicketAdd(project, ticket) {
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;
    var subject = '<p>Helpdesk создан новый тикет: <b>[#' + ticketNumber + ']</b></p>';
    var text = '<p>Сообщение:</p>\n\n';
    text += ticket.messages[0].text;
    mailModel.sendMail(to, subject, text, true);

    to = ticket.author;
    subject = 'Helpdesk: тикет [#' + ticketNumber + ']';
    text = 'Добрый день. Вы подавали обращение в систему поддержки проекта ' + project.name + '.<br>\n';
    text += 'Вы можете отслеживать статус вашего обращения из <a href="http://' + project.domain + '">личного кабинета</a>, либо общаясь в этой цепочке писем (пожалуйста, не удаляйте номер тикета из переписки).';
    mailModel.sendMail(to, subject, text, true);
}

/**
 *
 * @param project
 * @param ticket
 * @param pass
 */
function sendMailOnTicketAddUserCreate(project, ticket, pass) {
    var ticketNumber = this.compileTicketNumber(project, ticket.number);

    var to = project.responsible;
    var subject = '<p>Helpdesk создан новый тикет: <b>[#' + ticketNumber + ']</b></p>';
    var text = '<p>Сообщение:</p>\n\n';
    text += ticket.messages[0].text;
    mailModel.sendMail(to, subject, text, true);

    to = ticket.author;
    subject = 'Helpdesk: тикет [#' + ticketNumber + ']';
    text = 'Добрый день. Вы подавали обращение в систему поддержки проекта ' + project.name + '.<br>\n';
    text += 'Вы можете отслеживать статус вашего обращения из <a href="http://' + project.domain + '">личного кабинета</a>, либо общаясь в этой цепочке писем (пожалуйста, не удаляйте номер тикета из переписки).\n';
    text += 'Логин для доступа: ' + ticket.author + '\n';
    text += 'Пароль: ' + pass + '\n';
    mailModel.sendMail(to, subject, text, true);
}

/**
 *
 * @param project
 * @param ticket
 * @param message
 */
function sendMailOnMessageAdd(project, ticket, message) {
    var ticketNumber = exports.compileTicketNumber(project, ticket.number);

    var to = project.responsible == message.author ? ticket.author : project.responsible;
    var subject = 'Helpdesk тикет [#' + ticketNumber + ']: новое сообщение';
    var text = 'Новое сообщение в тикете:\n\n';
    text += message.text;
    mailModel.sendMail(to, subject, text, true);
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
