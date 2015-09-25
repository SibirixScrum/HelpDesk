var express = require('express');
var router = express.Router();

var models = require('../models/');
var projects = models.project.getAll();

function renderHome(req, res, countTickets) {
    res.render('index', {
        title: 'Helpdesk',
        user: req.session.user ? req.session.user : false,
        countTickets: countTickets,
        projects: projects
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

/* GET home page. */
router.get('*', function (req, res) {
    if (req.session.user) {
        models.project.getTicketCount(req.session.user.email, function(err, countTickets) {
            renderHome(req, res, err ? false : countTickets);
        });
    } else {
        renderHome(req, res, false);
    }
});

module.exports = router;
