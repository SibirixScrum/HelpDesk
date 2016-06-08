var config = global.config;

var projectModel = require('./project');
var ticketModel  = require('./ticket');
var fileModel    = require('./file');
var userModel    = require('./user');
var messageModel = require('./message');

var nodemailer   = require('nodemailer');
var striptags    = require('striptags');
var jsonwebtoken = require('jsonwebtoken');

var Imap       = require('imap'),
    MailParser = require('mailparser').MailParser;

var timeoutSetted = {};

/**
 *
 */
exports.startCheckTimeout = function() {
    var emailListening = [];
    for (var i = 0; i < config.projects.length; i++) {
        var project = config.projects[i];
        if (project.email && -1 === emailListening.indexOf(project.email.login)) {
            emailListening.push(project.email.login);
            if (project.email.keepAlive === true) {
                startProjectEmailListener(project);
            } else {
                startProjectCheckTimeout(project);
            }
        }
    }
};

function startProjectCheckTimeout(project) {
    if (timeoutSetted[project.code]) {
        return;
    }

    timeoutSetted[project.code] = true;
    setTimeout(function() {
        checkInbox(project);
    }, project.email.checkInterval * 1000);
}

/**
 * Start IMAP listener
 * @param project
 */
function startProjectEmailListener(project) {
    var imap = new Imap({
        user: project.email.login,
        password: project.email.password,
        host: project.email.host,
        port: project.email.port,
        tls: project.email.tls
    });

    function parseUnread() {
        imap.search(['UNSEEN'], function(err, results) {
            if (err) {
                return console.log(err);
            }

            if (!results.length) {
                return console.log('INBOX is empty');
            }

            var f = imap.fetch(results, {bodies: '', markSeen: true});

            f.on('message', function(msg, seqno) {
                var mailParser = new MailParser();

                mailParser.on('end', processMailObject);

                msg.on('body', function(stream, info) {
                    stream.on('data', function(chunk) {
                        mailParser.write(chunk);
                    });
                });

                msg.once('end', function() {
                    mailParser.end();
                });
            });

            f.once('error', function(err) {
                console.log('Fetch error: ' + err);
            });

            f.once('end', function() {
                console.log('Fetch end');
            });
        });
    }

    imap.on('ready', function() {
        imap.openBox('INBOX', false, function(err, box) {
            if (err) {
                imap.end();
                return console.log(err);
            }

            parseUnread();

            imap.on('mail', parseUnread);
        });
    });

    imap.on('error', function(err) {
        console.error(err);
    });

    imap.on('end', function() {
        console.log('Connection ended');

        // try to reconnect every 30 seconds
        setTimeout(function() {
            imap.connect();
        }, 30000);
    });

    imap.connect();
}

/**
 *
 * @param to
 * @param subject
 * @param text
 * @param isHtml
 * @param project
 * @param attachments
 */
exports.sendMail = function(to, subject, text, isHtml, project, attachments) {
    var transporter = nodemailer.createTransport({
        host: project.email.smtpHost,
        port: project.email.smtpPort,
        secure: project.email.smtpSecure,
        auth: {
            user: project.email.login,
            pass: project.email.password
        }
    });

    var mailOptions = {
        from: 'Helpdesk <' + project.email.login + '>',
        to: to,
        subject: subject
    };

    if (isHtml) {
        text += '<br>\n<br>\n------------<br>\n' + project.email.sign;
        mailOptions.html = text;
    } else {
        text += '\n\n------------\n' + project.email.sign;
        mailOptions.text = text;
    }

    if (attachments && attachments.length) {
        mailOptions.attachments = attachments;
    }

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            return console.log('Message dont send', error);
        }

        console.log('Message sent: ' + info.response);
    });
};

function parseSubject(subject) {
    var matches = subject.match(/\[#([^\-]+-\d+)\]/i);
    if (!matches) {
        return false;
    }
    return matches[1];
}

function checkInbox(project) {
    var imap = new Imap({
        user: project.email.login,
        password: project.email.password,
        host: project.email.host,
        port: project.email.port,
        tls: project.email.tls
    });

    timeoutSetted[project.code] = false;

    function openInbox(cb) {
        imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) {
                console.log('openinbox', err);
                startProjectCheckTimeout(project);
                imap.end();
                return;
            }

            imap.search(['UNSEEN'], function(err, results) {
                if (err) {
                    console.log('search unseen', err);
                    startProjectCheckTimeout(project);
                    imap.end();
                    return;
                }

                if (!results.length) {
                    startProjectCheckTimeout(project);
                    imap.end();
                    return;
                }

                var f = imap.fetch(results, {bodies: '', markSeen: true});

                f.on('message', function(msg, seqno) {
                    var mailParser = new MailParser();

                    mailParser.on('end', processMailObject);

                    msg.on('body', function(stream, info) {
                        stream.on('data', function(chunk) {
                            mailParser.write(chunk);
                        });
                    });
                    msg.once('end', function() {
                        mailParser.end();
                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                    startProjectCheckTimeout(project);
                });
                f.once('end', function() {
                    startProjectCheckTimeout(project);
                    imap.end();
                });
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
        startProjectCheckTimeout(project);
    });

    imap.once('close', function() {
        console.log('Mail sync close');
        startProjectCheckTimeout(project);
    });

    imap.once('end', function() {
        console.log('Mail sync end');
        startProjectCheckTimeout(project);
    });

    imap.connect();
}

/**
 * Обработка пришедшего письма
 * @param mailObject
 */
function processMailObject(mailObject) {
    var ticketCode = parseSubject(mailObject.subject);
    var project;

    if (ticketCode) {
        var codeParts      = ticketCode.split('-');
        var projectLetters = codeParts[0];
        var ticketId       = parseInt(codeParts[1], 10);
        project            = projectModel.getProjectByLetters(projectLetters);

        if (project && ticketId) {
            // не нравится мне эта хуйня
            // надо каким то образом обойти асинхронность, чтобы не было вероятности,
            // что одновременно два письма для одного тикета смогут переписать друг друга
            ticketModel.addMessageFromMail(project, ticketId, mailObject);
        }

    } else if (config.createTicketFromEmail && config.ticketFromEmailProject) {
        project = projectModel.getProjectByLetters(config.ticketFromEmailProject);

        if (!project) return;

        // new ticket creation
        var author = mailObject.from[0];
        var email  = author.address;
        var name   = author.name || author.address;
        var title  = mailObject.subject || 'Новый тикет из почты';
        var text   = mailObject.html;

        if (text) {
            text = text.replace(/<base[^>]*>/ig, '');
        } else {
            text = mailObject.text.replace(/\r?\n/g, '<br>');
        }
        text = striptags(text, global.config.tickets.editor.allowedTags);

        if (!email || !name || !title || !text) return;

        var ticket = new ticketModel.model({
            opened: true,
            lastDate: new Date(),
            title: title,
            project: project.code,
            author: email,
            messages: []
        });

        ticket.save(function(err, ticket) {
            if (err) return;

            ticket.number = projectModel.getBigUniqueNumber(ticket.autoCounter);

            // Сохранение тикета
            var message = new messageModel.model({
                date: new Date(),
                author: email,
                text: text,
                files: fileModel.proceedMailAttachments(project.code + '-' + ticket.number, mailObject.attachments)
            });

            ticket.messages = [message];
            ticket.save();

            // проверить/создать пользователя и отправить уведомление
            userModel.createGetUser(email, name, function(err, user, pass) {
                // Если передан пароль - пользователь создан
                if (pass) {
                    ticketModel.sendMailOnTicketAddUserCreate(project, ticket, pass);
                } else {
                    ticketModel.sendMailOnTicketAdd(project, ticket);
                }

                var result = {
                    project: project.code,
                    number: ticket.number
                };

                if (pass) {
                    var token = jsonwebtoken.sign(email, global.config.socketIo.secret, {expiresIn: global.config.socketIo.expire * 60});

                    result.user = {
                        name: name,
                        email: email
                    };

                    result.token        = token;
                    result.countTickets = false;

                    projectModel.getTicketCount(email, function(err, countTickets) {
                        if (!err && countTickets) {
                            result.countTickets = countTickets;
                        }
                    });
                }

                global.io.to(project.code).emit('newTicket', {
                    ticket: ticket,
                    source: project.responsible
                });
            });
        });
    }
}