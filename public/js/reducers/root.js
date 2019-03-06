const extend = require('extend');
const ActionTypes = require('../constants/action-types');
const {translate, getCurLang, translateWithoutCode, i18n} = require('../i18n');


let project;

if (0 !== APP.projects.length) {
    project = APP.projects.filter(function(p) {
        return p.domain === document.location.host;
    }).shift();

    if (undefined === project) {
        document.location.href = '//' + APP.projects[0].domain;
    }
}


const initialState = {
    modal: false,
    user: window.APP.user,
    allowedProjects: window.APP.countTickets,
    tagsReference: window.APP.tagsReference,
    lng: getCurLang(),
    curProject: project
};

function root(state = initialState, action={type: ''}) {
    switch (action.type) {
        case ActionTypes.UPDATE_COUNTERS:
            let allowedProject = extend({}, state.allowedProjects);
            let ticketProject = allowedProject[action.ticket.project];

            if (action.ticket.opened) {
                ticketProject.opened++;
                if (false === action.isNew)
                    ticketProject.closed--;
            } else {
                ticketProject.closed++;
                if (false === action.isNew)
                    ticketProject.opened--;
            }

            allowedProject[action.ticket.project] = ticketProject;
            return extend({}, state, {allowedProjects: allowedProject});

        case ActionTypes.SHOW_MODAL:
            return extend({}, state, {
                modal: action.content
            });
        case ActionTypes.HIDE_MODAL:
            return extend({}, state, {
                modal: false
            });

        case ActionTypes.LOGIN_SUCCESS:
            return extend({}, state, {
                user: action.user,
                allowedProjects: action.countTickets
            });

        case ActionTypes.LOGOUT_SUCCESS:
            return extend({}, state, {
                user: false,
                allowedProjects: false
            });

        case ActionTypes.CHANGE_LANG:
            return extend({}, state, {
                lng: action.lng
            });

        default:
            return state;
    }
}

module.exports = root;
