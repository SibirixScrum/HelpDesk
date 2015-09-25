const extend = require('extend');

const ActionTypes = require('../constants/action-types');
const ActionTickets = require('./tickets');

function logoutSuccess() {
    return dispatch => {
        dispatch({
            type: ActionTypes.LOGOUT_SUCCESS
        });

        dispatch(ActionTickets.resetState());
    }
}

function updateCounters(ticket, isNew = false) {
    return {
        type: ActionTypes.UPDATE_COUNTERS,
        isNew,
        ticket
    };
}

function loginSuccess(data) {
    return dispatch => {
        dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            user: extend({}, data.user, {token: data.token}),
            countTickets: data.countTickets,
            isLoading: false
        });

        dispatch(ActionTickets.activeProjects(data.countTickets));
    }
}

module.exports = {
    loginSuccess,
    logoutSuccess,
    updateCounters
};
