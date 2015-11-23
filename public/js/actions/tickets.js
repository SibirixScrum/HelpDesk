const ActionTypes = require('../constants/action-types');

const request = require('superagent');

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

function setFilter(filter) {
    return {
        type: ActionTypes.SET_FILTER,
        filter
    };
}

function beforeFetchItems(filter) {
    return {
        type: ActionTypes.START_FETCH_ITEMS,
        filter,
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
        dispatch(beforeFetchItems({sort: sortType, state, projects}));

        request.get('/ticket/list/')
            .set('Accept', 'application/json')
            .query({
                offset,
                state,
                projects: projects.join(','),
                sort: sortType,
                nocache: Date.now()
            })
            .end(function(err, resp) {
                const answer = JSON.parse(resp.text);
                dispatch(afterFetchItems(answer.list, clear))
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

function beforeOpenDetail(ticket) {
    return {
        type: ActionTypes.START_OPEN_DETAIL,
        ticket
    }
}

function afterOpenDetail(ticket) {
    return {
        type: ActionTypes.END_OPEN_DETAIL,
        ticket
    }
}

function closeDetail() {
    return {
        type: ActionTypes.CLOSE_DETAIL
    }
}

function setDetailTicket(ticket) {
    return dispatch => {
        dispatch(beforeOpenDetail(ticket));

        request.get(`/ticket/detail/${ticket.project}/${ticket.number}/`)
            .set('Accept', 'application/json')
            .query({
                nocache: Date.now()
            })
            .end(function(err, resp) {
                const answer = JSON.parse(resp.text);

                if (answer.result) {
                    dispatch(afterOpenDetail(answer.ticket));
                }
            });
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
    beforeOpenDetail,
    afterOpenDetail,
    fetchItems, 
    toggleProject,
    activeProjects,
    setTicketListSort,
    setDetailTicket,
    loadMore,
    updateTicket,
    resetState,
    addTicket,
    closeDetail,
    setFilter
};