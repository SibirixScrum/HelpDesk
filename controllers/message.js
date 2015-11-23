var express = require('express');
var striptags = require('striptags');
var multer = require('multer');
var fs = require('fs');
var router = express.Router();

var models = require('../models/');
var projectModel = models.project;
var ticketModel = models.ticket;
var messageModel = models.message;
var fileModel = models.file;
var mailModel = models.mail;

/**
 * Добавление сообщения в тикет
 */
var storage = multer.memoryStorage();
var upload = multer({ storage: storage, fileFilter: fileModel.fileFilter, limits: { fileSize: global.config.files.maxSize } });
var cpUpload = upload.fields([{ name: 'files[]', maxCount: global.config.files.maxCount }]);

router.post('/add', cpUpload, function (req, res) {
    var projectCode = req.body.projectCode;
    var number = req.body.number;
    var text   = req.body.text ? req.body.text.trim() : '';
    text = striptags(text, global.config.tickets.editor.allowedTags);

    if (!req.files) req.files = {};

    if (!text) {
        fileModel.cleanupFiles(req.files['files[]']);
        res.json({ result: false, error: 'no text' });
        return;
    }

    if (!req.session.user) {
        fileModel.cleanupFiles(req.files['files[]']);
        res.json({ result: false, error: 'no auth' });
        return;
    }

    ticketModel.findTicket(projectCode, number, function(err, ticket) {
        if (err) {
            fileModel.cleanupFiles(req.files['files[]']);
            res.json({result: false, error: 'no ticket'});
            return;
        }

        if (!ticketModel.hasRightToWrite(ticket, req.session.user)) {
            fileModel.cleanupFiles(req.files['files[]']);
            res.json({ result: false, error: 'no rights' });
            return;
        }

        // загрузка файлов
        var files = fileModel.proceedUploads(ticket.project + '-' + ticket.number, req.files, 'files[]');
        var project = projectModel.getProjectByCode(projectCode);

        // Добавить сообщение
        var message = new messageModel.model({
            date:   new Date(),
            author: req.session.user.email,
            text:   text,
            files:  files
        });

        if (message.author != project.responsible) {
            ticket.lastDate = new Date();
        }

        ticket.messages.push(message);
        ticket.save();

        ticketModel.sendMailOnMessageAdd(project, ticket, message);

        // Отправить ПУШ-оповещение
        ticketModel.prepareTicketsForClient([ticket], function(err, data) {
            var ticket = data[0];
            global.io.to(projectCode        ).emit('ticketMessage', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
            global.io.to(ticket.author.email).emit('ticketMessage', { ticket: ticket, source: req.session.user ? req.session.user.email : false });
        });

        res.json({ result: true });
    });
});

module.exports = router;
