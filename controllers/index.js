var express = require('express');
var router = express.Router();

var models = require('../models/');

function renderHome(req, res, countTickets) {
    var projects = models.project.getAll(req.session.user);
    models.ticket.getTagsReference(function(tags) {
        res.render('index', {
            title:        'Helpdesk',
            files:        global.config.files,
            passChanged:  req.body.passChanged,
            user:         req.session.user ? req.session.user : false,
            countTickets: countTickets,
            projects:     projects,
            tagsReference: tags
        });
    });
}

router.get('/tickets', function (req, res) {
    if (req.session.user) {
        models.project.getTicketCount(req.session.user.email, function(err, countTickets) {
            renderHome(req, res, err ? false : countTickets);
        });
    } else {
        res.redirect('/');
    }
});

router.get('/agreement/', function (req, res) {
    res.render('agreement');
});

/* GET home page. */
router.get('*', function (req, res) {
    if (req.session.user) {
        models.project.getTicketCount(req.session.user.email, function(err, countTickets) {
            renderHome(req, res, err ? false : countTickets);
        });
    } else {
        if (req.query.reset && req.query.login) {
            models.user.resetPassword(req.query.login, req.query.reset, function(success) {
                req.body.passChanged = success;
                renderHome(req, res, false);
            });

            return;
        }

        renderHome(req, res, false);
    }
});

module.exports = router;
