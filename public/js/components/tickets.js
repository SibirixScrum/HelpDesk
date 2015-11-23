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

        const sort           = query.sort ? query.sort : tickets.sort;
        const state          = query.state ? query.state : tickets.state;
        const activeProjects = query.projects ? query.projects.split('-') : tickets.activeProjects;

        let fromUrl = false;
        if (sort !== tickets.sort) fromUrl = true;
        if (state !== tickets.state) fromUrl = true;
        if (!_isSameArrays(activeProjects, tickets.activeProjects)) fromUrl = true;

        if (params.id) {
            const project = params.id.split('-')[0];
            const number  = params.id.split('-')[1];
            setDetailTicket({project, number});
        }

        if (fromUrl) {
            setFilter({sort, activeProjects, state});

            return;
        }

        fetchItems(0, sort, state, activeProjects);
    },

    componentWillReceiveProps(nextProps) {
        const { tickets, params, fetchItems } = nextProps;

        if (this._shouldFetchItems(this.props, nextProps)) {
            fetchItems(0, tickets.sort, tickets.state, tickets.activeProjects);
        }

        if (tickets.detailedOpened !== false &&
            (!params.id || params.id !== this._getTicketId(tickets.detailedOpened))) {
            if (!isIE9) {
                this.transitionTo('ticketsDetail', {id: this._getTicketId(tickets.detailedOpened)}, {
                    state: tickets.state,
                    projects: tickets.activeProjects.join('-'),
                    sort: tickets.sort
                });
            }
        } else {
            if (tickets.detailedOpened === false) {
                if (!isIE9) {
                    this.transitionTo('tickets', {}, {
                        state: tickets.state,
                        projects: tickets.activeProjects.join('-'),
                        sort: tickets.sort
                    });
                }
            }
        }
    },

    _shouldFetchItems(props, nextProps) {
        let shouldFetchItems = false;
        let isSameProjects   = _isSameArrays(props.tickets.activeProjects, nextProps.tickets.activeProjects);

        if (props.tickets.sort !== nextProps.tickets.sort) {
            shouldFetchItems = true;
        } else if (props.tickets.state !== nextProps.tickets.state) {
            shouldFetchItems = true;
        } else if (!isSameProjects) {
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
        fetchItems(tickets.items.length, tickets.sort, tickets.state, tickets.activeProjects, false);
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
                    />
                <TicketsList tickets={tickets}
                             user={user}
                             closeDetail={this.props.closeDetail}
                             projects={allowedProjects}
                             onSortChange={this.props.setTicketListSort}
                             openDetail={this.props.setDetailTicket}
                             loadMore={this.loadMore}
                    />
                <TicketsDetail isDetailLoading={tickets.isDetailLoading}
                               showModal={this.props.showModal}
                               setTicketState={this.setTicketState}
                               closePanel={this.props.closeDetail}
                               opened={tickets.detailedOpened}
                               isBtnDisabled={this.state.isBtnDisabled}
                               tickets={tickets.items}/>
            </div>
        )
    }
});

function select(state) {
    return {
        user: state.root.user,
        tickets: state.tickets,
        allowedProjects: state.root.allowedProjects
    }
}

function mapDispatchToProps(dispatch) {
    return {
        setDetailTicket: (ticket) => dispatch(TicketsActions.setDetailTicket(ticket)),
        fetchItems: (offset, sort, state, activeProjects, clear) => dispatch(TicketsActions.fetchItems(offset, sort, state, activeProjects, clear)),
        setFilter: (filter) => dispatch(TicketsActions.setFilter(filter)),
        logoutSuccess: () => dispatch(RootActions.logoutSuccess()),
        toggleProject: (code) => dispatch(TicketsActions.toggleProject(code)),
        setState: (filter) => dispatch(TicketsActions.setState(filter)),
        setTicketListSort: (sortType) => dispatch(TicketsActions.setTicketListSort(sortType)),
        closeDetail: (sortType) => dispatch(TicketsActions.closeDetail()),
        showModal: (content) => dispatch(RootActions.showModal(content))
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
