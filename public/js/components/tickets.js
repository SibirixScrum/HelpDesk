/*** @jsx React.DOM */
const isIE9          = require('./ie-check');
const TicketsSidebar = require('./tickets/sidebar');
const TicketsList    = require('./tickets/list');
const TicketsDetail  = require('./tickets/detail');
const extend         = require('extend');
const request        = require('superagent');
const {connect}      = require('react-redux');
const React          = require('react');
const Router         = require('react-router');
const TicketsActions = require('../actions').tickets;
const RootActions    = require('../actions').root;
const _ = require('underscore');

const Tickets = React.createClass({
    mixins: [Router.Navigation],

    getInitialState() {
        return {
            isBtnDisabled: false
        }
    },

    _getTicketId: (ticket) => `${ticket.project}-${ticket.number}`,

    componentDidMount() {
        const { user, tickets, query, params, setDetailTicket, setFilter, fetchItems } = this.props;

        if ((this.props.query.login && user !== false && this.props.query.login !== user.email) || false === user) {
            this.transitionTo('home', {}, {login: this.props.query.login});

            return;
        }

        var currentFilter = Object.assign({}, tickets.filter);
        const sort           = query.sort ? query.sort : tickets.sort;
        const state          = query.state ? query.state : currentFilter.state;
        const projects = query.projects ? query.projects.split('-') : currentFilter.projects;
        const email = query.email ? query.email : currentFilter.email;
        const tags = query.tags ? query.tags.split('-') : currentFilter.tags;

        var filter = {
            tags,
            email,
            state,
            projects
        };

        let fromUrl = !_.isEqual(filter, currentFilter);

        if (params.id) {
            const project = params.id.split('-')[0];
            const number  = params.id.split('-')[1];
            setDetailTicket({project, number});
        }

        if (fromUrl) {
            setFilter(sort, filter);

            return;
        }

        fetchItems(0, sort, filter);
    },

    componentWillReceiveProps(nextProps) {
        const { tickets, params, fetchItems } = nextProps;

        var filter = Object.assign({}, tickets.filter);
        if (this._shouldFetchItems(this.props, nextProps)) {
            fetchItems(0, tickets.sort, filter);
        }

        if (tickets.detailedOpened !== false &&
            (!params.id || params.id !== this._getTicketId(tickets.detailedOpened))) {
            if (!isIE9) {
                this.transitionTo('ticketsDetail', {id: this._getTicketId(tickets.detailedOpened)}, {
                    state: filter.state,
                    projects: filter.projects.join('-'),
                    sort: tickets.sort
                });
            }
        } else {
            if (tickets.detailedOpened === false) {
                if (!isIE9) {
                    var transitionParams = {
                        state: filter.state,
                        projects: filter.projects.join('-'),
                        sort: tickets.sort
                    };
                    if (filter.email) {
                        transitionParams.email = filter.email;
                    }
                    if (filter.tags && filter.tags.length) {
                        transitionParams.tags = filter.tags.join('-');
                    }
                    this.transitionTo('tickets', {}, transitionParams);
                }
            }
        }
    },

    _shouldFetchItems(props, nextProps) {
        let shouldFetchItems = false;

        if (props.tickets.sort !== nextProps.tickets.sort) {
            shouldFetchItems = true;
        } else if (!_.isEqual(props.tickets.filter, nextProps.tickets.filter)) {
            shouldFetchItems = true;
        }

        return shouldFetchItems;
    },

    onLogout() {
        this.props.logoutSuccess();
        this.transitionTo('home');
    },

    loadMore() {
        const {tickets, fetchItems} = this.props;
        fetchItems(tickets.items.length, tickets.sort, Object.assign({}, tickets.filter), false);
    },

    setTicketState(flag, project, number) {
        const data = {
            projectCode: project,
            nocache: Date.now(),
            number
        };

        let url;

        if (flag) {
            url = '/ticket/open/';
        } else {
            url = '/ticket/close/';
        }

        this.setState({isBtnDisabled: true});
        request.post(url)
            .send(data)
            .type('json')
            .end(() => {
                if (isIE9) {
                    location.reload();
                }
                this.setState({isBtnDisabled: false})
            });
    },

    render() {
        const { user, tickets, allowedProjects } = this.props;

        return (
            <div className="wrapper tickets-list-page">
                <TicketsSidebar {...{user, tickets, allowedProjects}}
                    onStateClick={this.props.setState}
                    onToggleProject={this.props.toggleProject}
                    onLogout={this.onLogout}
                    lng={this.props.lng}
                    changeLanguage={this.props.changeLanguage}
                    curProject={this.props.curProject}
                    />
                <TicketsList tickets={Object.assign({}, tickets)}
                             user={user}
                             closeDetail={this.props.closeDetail}
                             projects={allowedProjects}
                             onSortChange={this.props.setTicketListSort}
                             onFilterChange={this.props.setTicketListFilter}
                             openDetail={this.props.setDetailTicket}
                             loadMore={this.loadMore}
                             tagsReference={this.props.tagsReference}
                    />
                <TicketsDetail isDetailLoading={tickets.isDetailLoading}
                               showModal={this.props.showModal}
                               setTicketState={this.setTicketState}
                               closePanel={this.props.closeDetail}
                               opened={tickets.detailedOpened}
                               user={user}
                               isBtnDisabled={this.state.isBtnDisabled}
                               tickets={tickets.items}
                               tagsReference={this.props.tagsReference}
                               tagAdd={this.props.tagAdd}
                               tagRemove={this.props.tagRemove}
                />
            </div>
        )
    }
});

function select(state) {
    return {
        user: state.root.user,
        tickets: Object.assign({}, state.tickets),
        allowedProjects: state.root.allowedProjects,
        tagsReference: state.root.tagsReference,
        lng: state.root.lng,
        curProject: state.root.curProject
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setDetailTicket: (ticket) => dispatch(TicketsActions.setDetailTicket(ticket)),
        fetchItems: (offset, sort, filter, clear) => dispatch(TicketsActions.fetchItems(offset, sort, filter, clear)),
        setFilter: (sort, filter) => dispatch(TicketsActions.setFilter(sort, filter)),
        logoutSuccess: () => dispatch(RootActions.logoutSuccess()),
        toggleProject: (code) => dispatch(TicketsActions.toggleProject(code)),
        setState: (filter) => dispatch(TicketsActions.setState(filter)),
        setTicketListSort: (sortType) => dispatch(TicketsActions.setTicketListSort(sortType)),
        setTicketListFilter: (filter) => dispatch(TicketsActions.setTicketListFilter(filter)),
        closeDetail: (sortType) => dispatch(TicketsActions.closeDetail()),
        showModal: (content) => dispatch(RootActions.showModal(content)),
        tagAdd: (projectCode, ticketNumber, tag) => dispatch(TicketsActions.tagAdd(projectCode, ticketNumber, tag)),
        tagRemove: (projectCode, ticketNumber, index) => dispatch(TicketsActions.tagRemove(projectCode, ticketNumber, index)),
        changeLanguage: (lng) => dispatch(RootActions.changeLang(lng)),
    }
}

function _isSameArrays(arr1, arr2) {
    let isSame = (
        arr1.length == arr2.length)
        && arr1.every(function(element, index) {
                return element === arr2[index];
            }
        );

    return isSame;
}

module.exports = connect(select, mapDispatchToProps)(Tickets);
