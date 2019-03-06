const extend = require('extend');

const ActionTypes = require('../constants/action-types');
const ActionTickets = require('./tickets');
const {translate, getCurLang, translateWithoutCode, i18n} = require('../i18n');
const request     = require('superagent');

function logoutSuccess() {
    return dispatch => {
        dispatch({
            type: ActionTypes.LOGOUT_SUCCESS
        });

        dispatch(ActionTickets.resetState());
    }
}

function showModal(data) {
    return dispatch => {
        dispatch({
            type: ActionTypes.SHOW_MODAL,
            content: {header: data.header, text: data.text}
        });
    }
}

function hideModal(data) {
    return dispatch => {
        dispatch({
            type: ActionTypes.HIDE_MODAL
        });
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

function changeLang(lng) {
    i18n.changeLanguage(lng);

    return dispatch => {
        dispatch({
            type: ActionTypes.CHANGE_LANG,
            lng
        });

        request.post('/user/change-lang/')
            .set('Accept', 'application/json')
            .type('json')
            .send({
                lng: lng
            })
            .query({
                nocache: Date.now()
            })
            .end(function(err, resp) {

            });
    };
}

module.exports = {
    loginSuccess,
    showModal,
    hideModal,
    logoutSuccess,
    updateCounters,
    changeLang
};
