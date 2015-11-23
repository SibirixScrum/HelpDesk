/*
 * Модель проектов
 */

var projectsList = global.config.projects;
var ticketModel = require('./ticket');
var userModel = require('./user');
var extend = require('extend');

validateProjectsConfig();

/**
 * Валидация конфига проектов
 * @returns {boolean}
 */
function validateProjectsConfig() {
    if (!projectsList || !projectsList.length) {
        throw "No projects in config";
    }

    var i, responsibles = {};
    var colorLength = global.config.projectColors.length;
    for (i = 0; i < projectsList.length; i++) {
        var p = projectsList[i];
        p.color = '#' + global.config.projectColors[i % colorLength];
        if (!p.code || !p.name || !p.domain || !p.responsible) {
            throw "Projects config are invalid! Required fields: code, name, domain, responsible.";
        }

        if (!responsibles[p.responsible]) responsibles[p.responsible] = [];
        responsibles[p.responsible].push(p);
    }

    // Проверить, что ответственные созданы
    for (var email in responsibles) {
        if (!responsibles.hasOwnProperty(email)) continue;
        userModel.createResponsible(email, responsibles[email]);
    }

    return true;
}

/**
 *
 * @param x
 * @returns {*}
 */
exports.getBigUniqueNumber = function(x) {
    var prime = 9999667;
    var gap = 100;
    var n = x + gap;
    if (n >= prime) return n;
    var residue = (n * n) % prime;
    return (n <= prime / 2) ? residue : prime - residue;
};

/**
 * Получить проект по его коду
 * @param code
 * @returns {*}
 */
exports.getProjectByCode = function(code) {
    for (var i = 0; i < projectsList.length; i++) {
        if (projectsList[i].code == code) {
            return projectsList[i];
        }
    }

    return false;
};

/**
 * Получить проект по его домену
 * @param domain
 * @returns {*}
 */
exports.getProjectByDomain = function(domain) {
    for (var i = 0; i < projectsList.length; i++) {
        if (projectsList[i].domain == domain) {
            return projectsList[i];
        }
    }

    return false;
};

/**
 *
 * @param letters
 * @returns {*}
 */
exports.getProjectByLetters = function(letters) {
    for (var i = 0; i < projectsList.length; i++) {
        if (projectsList[i].letters == letters) {
            return projectsList[i];
        }
    }

    return false;
};

/**
 *
 * @param responsible
 * @returns {Array}
 */
exports.getResponsibleProjectsList = function(responsible) {
    var projects = [];

    for (var i = 0; i < projectsList.length; i++) {
        if (projectsList[i].responsible == responsible) {
            projects.push(projectsList[i]);
        }
    }

    return projects;
};

/**
 * Количество тикетов по статусам по доступным проектам
 * @param email
 * @param callback
 */
exports.getTicketCount = function(email, callback) {
    var projectList = this.getResponsibleProjectsList(email);

    var count = {};
    if (projectList.length) {
        // ТП
        var projectCodes = [];

        for (var i = 0; i < projectList.length; i++) {
            projectCodes.push(projectList[i].code);
            count[projectList[i].code] = {
                opened: 0,
                closed: 0
            };
        }

        ticketModel.model.aggregate([
            {
                $match: { project: { $in: projectCodes } }
            },
            {
                $group : {
                    _id : { project: "$project", opened: "$opened" },
                    count: { $sum: 1 }
                }
            }
        ], function (err, result) {
            if (result && result.length) {
                for (var i = 0; i < result.length; i++) {
                    var key = result[i]._id.opened ? 'opened' : 'closed';
                    count[result[i]._id.project][key] = result[i].count;
                }
            }
            callback(err, count);
        });

    } else {
        // Клиент
        ticketModel.model.aggregate([
            {
                $match: { author: email }
            },
            {
                $group : {
                    _id : { project: "$project", opened: "$opened" },
                    count: { $sum: 1 }
                }
            }
        ], function (err, result) {
            for (var i = 0; i < result.length; i++) {
                var project = result[i]._id.project;
                var key = result[i]._id.opened ? 'opened' : 'closed';

                if (!count[project]) {
                    count[project] = {
                        opened: 0,
                        closed: 0
                    };
                }

                count[project][key] = result[i].count;
            }
            callback(err, count);
        });
    }
};

/**
 * Получить проект по его коду
 * @returns {*}
 */
exports.getAll = function() {
    return projectsList.map(function(project){

        var pr = extend({}, project);
        delete pr.responsible;
        delete pr.email;

        return pr;
    });
};

