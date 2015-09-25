const extend = require('extend');
const ActionTypes = require('../constants/action-types');

const initialState = {
    user: window.APP.user,
    allowedProjects: window.APP.countTickets
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

        default:
            return state;
    }
}

module.exports = root;