var express = require('express');
var router = express.Router();

var models = require('../models/');
let templateString = require('../services/template-string');
const i18nService = require('../services/i18n');
let i18nHelper = new i18nService.i18n();

function renderHome(req, res, countTickets) {
    let projects = i18nHelper.translateProjects(models.project.getAll(req.session.user));
    let curProject = models.project.getProjectByDomain(req.get('host'));
    models.ticket.getTagsReference(function(tags) {
        res.render('index', {
            title:        req.i18n.t(templateString.getTitleCode()),
            files:        global.config.files,
            passChanged:  req.body.passChanged,
            user:         req.session.user ? req.session.user : false,
            countTickets: countTickets,
            projects:     projects,
            tagsReference: tags,
            lngData: req.i18n.store.data,
            translateStartCode: templateString.getStartCode(),
            className: curProject.bodyClass
        });
    });
}

router.get('/tickets', function (req, res) {
    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

    if (req.session.user) {
        models.project.getTicketCount(req.session.user.email, function(err, countTickets) {
            renderHome(req, res, err ? false : countTickets);
        });
    } else {
        res.redirect('/');
    }
});

router.get('/agreement/', function (req, res) {
    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);
    let curProject = models.project.getProjectByDomain(req.get('host'));

    res.render(i18nHelper.translator('agreement'), {
        title: req.i18n.t(templateString.getTitleCode()),
        lngData: req.i18n.store.data,
        translateStartCode: templateString.getStartCode(),
        className: curProject.bodyClass
    });
});

/* GET home page. */
router.get('*', function (req, res) {
    templateString.setCurrentProjectByDomain(req.get('host'));
    i18nHelper.setConfig(req);

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
