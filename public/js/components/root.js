/*** @jsx React.DOM */
const React         = require('react');
const {connect}     = require('react-redux');
const ReactRouter   = require('react-router');
const TicketActions = require('../actions/tickets');
const RootActions   = require('../actions/root');
const RouteHandler  = ReactRouter.RouteHandler;

var socket = null;
function connectIO(user, dispatch) {
    if (null === socket) {
        socket = io.connect(window.location.origin.replace(/:\d+$/, '') + ':' + APP.port, {'forceNew':true });

        socket.on('connect', function () {
            // Отправляем авторизационные данные
            socket.emit('authenticate', {token: user.token});
        });

        // Слушаем события
        socket
        .on('newTicket', function(params) {
            dispatch(RootActions.updateCounters(params.ticket, true));
            dispatch(TicketActions.addTicket(params.ticket));
        }).on('ticketClosed', function(params) {
            dispatch(RootActions.updateCounters(params.ticket));
            dispatch(TicketActions.updateTicket(params.ticket));
        }).on('ticketOpened', function(params) {
            dispatch(RootActions.updateCounters(params.ticket));
            dispatch(TicketActions.updateTicket(params.ticket));
        }).on('ticketMessage', function(params) {
            dispatch(TicketActions.updateTicket(params.ticket));
        });
    }
}

function disconnectIO() {
    if (null !== socket) {
        socket = null;
    }
}

const Root = React.createClass({
    // state is changed
    componentWillReceiveProps() {
        this.checkAuth();
    },

    checkAuth: function(){
        const { dispatch } = this.props;
        if (false !== this.props.user) {
            connectIO(this.props.user, dispatch);
        } else {
            disconnectIO();
        }
    },

    // component was rendered for the 1st time
    componentDidMount() {
        this.checkAuth();
    },

    render() {
        return (
            <RouteHandler routerState={this.props.routerState}/>
        )
    }
});

function select(state) {
    return {
        user: state.root.user
    }
}

module.exports = connect(select)(Root);
