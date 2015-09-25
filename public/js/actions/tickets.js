const ActionTypes = require('../constants/action-types');

const reqwest = require('reqwest');

function addTicket(ticket) {
    return {
        type: ActionTypes.ADD_TICKET,
        ticket: ticket
    };
}

function updateTicket(ticket) {
    return {
        type: ActionTypes.UPDATE_TICKET,
        ticket: ticket
    };
}

function activeProjects(projects) {
    return {
        type: ActionTypes.SET_ACTIVE_PROJECTS,
        projects: projects
    };
}

function setState(filter) {
    return {
        type: ActionTypes.SET_STATE,
        filter
    };
}

function beforeFetchItems() {
    return {
        type: ActionTypes.START_FETCH_ITEMS,
        isLoading: true
    };
}

function afterFetchItems(items, clear) {
    return {
        type: ActionTypes.END_FETCH_ITEMS,
        items,
        isLoading: false,
        clear
    };
}

function fetchItems(offset, sortType, state, projects, clear = true) {
    return dispatch => {
        dispatch(beforeFetchItems());

        reqwest({
            url: '/ticket/list/',
            method: 'get',
            data: {
                offset,
                state,
                projects,
                sort: sortType
            },
            success: function (resp) {
                var answer = JSON.parse(resp.response);
                dispatch(afterFetchItems(answer.list, clear))
            }
        });
    };
}

function toggleProject(code) {
    return {
        type: ActionTypes.TOGGLE_PROJECT,
        code
    };
}


function setTicketListSort(sort) {
    return {
        type: ActionTypes.SET_TICKET_LIST_SORT,
        sort
    };
}

function setDetailTicket(ticket) {
    return {
        type: ActionTypes.SET_DETAIL_TICKET,
        ticket
    };
}

function loadMore() {
    return {
        type: ActionTypes.SET_NEW_PAGE
    };
}

function resetState() {
    return {
        type: ActionTypes.RESET_TICKETS_STATE
    };
}

module.exports = {
    setState, 
    beforeFetchItems, 
    afterFetchItems, 
    fetchItems, 
    toggleProject,
    activeProjects,
    setTicketListSort,
    setDetailTicket,
    loadMore,
    updateTicket,
    resetState,
    addTicket
};