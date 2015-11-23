const extend = require('extend');
const ActionTypes = require('../constants/action-types');

const initialState = {
    modal: false,
    user: window.APP.user,
    allowedProjects: window.APP.countTickets
};

function root(state = initialState, action={type: ''}) {
    console.log(action);
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

        default:
            return state;
    }
}

module.exports = root;