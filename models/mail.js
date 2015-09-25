var config = global.config;

var projectModel = require('./project');
var ticketModel = require('./ticket');

var nodemailer  = require('nodemailer'),
    transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: config.email.login,
            pass: config.email.password
        }
    });

var Imap       = require('imap'),
    inspect    = require('util').inspect,
    MailParser = require('mailparser').MailParser;

var timeoutSetted = false;

/**
 *
 */
exports.startCheckTimeout = function() {
    if (timeoutSetted) {
        return;
    }

    timeoutSetted = true;
    setTimeout(checkInbox, config.email.checkInterval * 1000);
};

/**
 *
 * @param to
 * @param subject
 * @param text
 * @param isHtml
 */
exports.sendMail = function(to, subject, text, isHtml) {
    var mailOptions = {
        from: 'Helpdesk <' + config.email.login + '>',
        to: to,
        subject: subject
    };

    if (isHtml) {
        text += '<br>\n<br>\n-- ' + config.email.sign;
        mailOptions.html = text;
    } else {
        text += '\n\n-- ' + config.email.sign;
        mailOptions.text = text;
    }

    transporter.sendMail(mailOptions, function (error, info) {
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

function checkInbox() {
    var imap = new Imap({
        user: config.email.login,
        password: config.email.password,
        host: config.email.host,
        port: config.email.port,
        tls: config.email.tls
    });

    timeoutSetted = false;

    function openInbox(cb) {
        imap.openBox('INBOX', false, cb);
    }

    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) {
                console.log('openinbox', err);
                exports.startCheckTimeout();
                imap.end();
                return;
            }

            imap.search(['UNSEEN'], function(err, results) {
                if (err) {
                    console.log('search unseen', err);
                    exports.startCheckTimeout();
                    imap.end();
                    return;
                }

                if (!results.length) {
                    exports.startCheckTimeout();
                    imap.end();
                    return;
                }

                var f = imap.fetch(results, { bodies: '', markSeen: true });

                f.on('message', function(msg, seqno) {
                    var mailParser = new MailParser();
                    mailParser.on('end', function(mailObject) {
                        var ticketCode = parseSubject(mailObject.subject);

                        if (ticketCode) {
                            var codeParts = ticketCode.split('-');
                            var projectLetters = codeParts[0];
                            var ticketId = parseInt(codeParts[1], 10);
                            var project = projectModel.getProjectByLetters(projectLetters);

                            if (project && ticketId) {
                                // не нравится мне эта хуйня
                                // надо каким то образом обойти асинхронность, чтобы не было вероятности,
                                // что одновременно два письма для одного тикета смогут переписать друг друга
                                ticketModel.addMessageFromMail(project, ticketId, mailObject);
                            }
                        }
                    });

                    msg.on('body', function(stream, info) {
                        stream.on('data', function(chunk) {
                            mailParser.write(chunk.toString('utf8'));
                        });
                    });
                    msg.once('end', function() {
                        mailParser.end();
                    });
                });
                f.once('error', function(err) {
                    console.log('Fetch error: ' + err);
                    exports.startCheckTimeout();
                });
                f.once('end', function() {
                    exports.startCheckTimeout();
                    imap.end();
                });
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
        exports.startCheckTimeout();
    });

    imap.once('close', function() {
        console.log('Mail sync close');
        exports.startCheckTimeout();
    });

    imap.once('end', function() {
        console.log('Mail sync end');
        exports.startCheckTimeout();
    });

    imap.connect();
}
