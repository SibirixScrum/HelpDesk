/*** @jsx React.DOM */
const TicketsSidebar = require('./tickets/sidebar');
const TicketsList    = require('./tickets/list');
const TicketsDetail  = require('./tickets/detail');
const extend         = require('extend');
const reqwest        = require('reqwest');

const {connect} = require('react-redux');
const React  = require('react');
const Router = require('react-router');

const TicketsActions = require('../actions').tickets;
const RootActions = require('../actions').root;

const Tickets = React.createClass({
    mixins: [Router.Navigation],

    componentDidMount() {
        const { dispatch, user, tickets } = this.props;
        if (false === user) {
            this.transitionTo('home');
        } else {
            dispatch(TicketsActions.fetchItems(0, tickets.sort, tickets.state, tickets.activeProjects));

        }
    },

    componentWillReceiveProps: function(nextProps) {
        const { dispatch } = this.props;
        let shouldFetchItems = false;
        var isSameProjects   = (
            this.props.tickets.activeProjects.length == nextProps.tickets.activeProjects.length)
            && this.props.tickets.activeProjects.every(function(element, index) {
                    return element === nextProps.tickets.activeProjects[index];
                }
            );

        if (this.props.tickets.sort !== nextProps.tickets.sort) {
            shouldFetchItems = true;
        } else if (this.props.tickets.state !== nextProps.tickets.state) {
            shouldFetchItems = true;
        } else if (!isSameProjects) {
            shouldFetchItems = true;
        } else if (this.props.tickets.page !== nextProps.tickets.page) {
            //shouldFetchItems = true;
            //console.log(nextProps);
        }

        if (shouldFetchItems) {
            dispatch(TicketsActions.fetchItems(
                0,
                nextProps.tickets.sort,
                nextProps.tickets.state,
                nextProps.tickets.activeProjects
            ));
        }
    },

    onLogout() {
        const { dispatch } = this.props;
        dispatch(RootActions.logoutSuccess());
        this.transitionTo('home');
    },

    doStateClick(filter) {
        this.props.dispatch(TicketsActions.setState(filter));
    },

    doToggleProject(code) {
        this.props.dispatch(TicketsActions.toggleProject(code));
    },

    doSortChange(sortType) {
        this.props.dispatch(TicketsActions.setTicketListSort(sortType));
    },

    openDetail(ticket) {
        this.props.dispatch(TicketsActions.setDetailTicket(ticket));
    },

    closeDetail() {
        this.props.dispatch(TicketsActions.setDetailTicket(false));
    },

    loadMore() {
        const {tickets, dispatch} = this.props;

        dispatch(TicketsActions.fetchItems(tickets.items.length, tickets.sort, tickets.state, tickets.activeProjects, false));
    },

    setTicketState(flag, project, number) {
        const data = {
            projectCode: project,
            number
        };

        let url;

        if (flag) {
            url = '/ticket/open/';
        } else {
            url = '/ticket/close/';
        }

        reqwest({
            url,
            method: 'post',
            data: data,
            type: 'json',
            success: function(res) {

            }.bind(this)
        })
    },

    render() {
        const { user, tickets, allowedProjects } = this.props;

        return (
            <div className="wrapper tickets-list-page">
                <TicketsSidebar {...{user, tickets, allowedProjects}}
                    onStateClick={this.doStateClick}
                    onToggleProject={this.doToggleProject}
                    onLogout={this.onLogout}
                    />
                <TicketsList tickets={tickets}
                             user={user}
                             projects={allowedProjects}
                             onSortChange={this.doSortChange}
                             openDetail={this.openDetail}
                             loadMore={this.loadMore}
                    />
                <TicketsDetail setTicketState={this.setTicketState}
                               closePanel={this.closeDetail}
                               opened={tickets.detailedOpened}
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

module.exports = connect(select)(Tickets);
