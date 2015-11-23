/*** @jsx React.DOM */
const isIe9         = require('./ie-check');
const React         = require('react');
const {connect}     = require('react-redux');
const Modal         = isIe9 ? '' : require('boron/WaveModal');
const ReactRouter   = require('react-router');
const TicketActions = require('../actions/tickets');
const RootActions   = require('../actions/root');
const RouteHandler  = ReactRouter.RouteHandler;

var socket = null;
function connectIO(user, dispatch) {
    if (null === socket) {
        var origin = window.location.origin || `http://${window.location}`;
        socket     = io.connect(origin.replace(/:\d+$/, '') + ':' + APP.port, {'forceNew': true});

        socket.on('connect', function() {
            // Отправляем авторизационные данные
            socket.emit('authenticate', {token: user.token});
        });

        function notifyOnClick(ticket) {
            return function() {
                dispatch(TicketActions.setDetailTicket({
                    project: ticket.project,
                    number: ticket.number
                }));
            }
        }

        // Слушаем события
        socket
            .on('newTicket', function(params) {
                if (params.source != user.email) {
                    showNotify("Новый тикет в проекте " +
                    params.ticket.project, params.ticket.title, notifyOnClick(params.ticket));
                }

                dispatch(RootActions.updateCounters(params.ticket, true));
                dispatch(TicketActions.addTicket(params.ticket));
            }).on('ticketClosed', function(params) {
                if (params.source != user.email) {
                    showNotify("Тикет \"" + params.ticket.title + "\" закрыт.", false, notifyOnClick(params.ticket));
                }

                dispatch(TicketActions.updateTicket(params.ticket));
                dispatch(RootActions.updateCounters(params.ticket));
            }).on('ticketOpened', function(params) {
                if (params.source != user.email) {
                    showNotify("Тикет \"" + params.ticket.title +
                    "\" переоткрыт.", false, notifyOnClick(params.ticket));
                }

                dispatch(RootActions.updateCounters(params.ticket));
                dispatch(TicketActions.updateTicket(params.ticket));
            }).on('ticketMessage', function(params) {
                if (params.source != user.email) {
                    showNotify("Новое сообщение в тикете \"" + params.ticket.title +
                    "\".", false, notifyOnClick(params.ticket));
                }

                dispatch(TicketActions.updateTicket(params.ticket));
            });
    }
}

function showNotify(title, message, onClick) {
    if (!window.Notification) {
        return false;
    }

    var notificationOptions = {
        body: message ? message : "",
        icon: window.location.origin + '/pictures/logo-big.jpg'
    };

    try {
        var notification = new Notification(title, notificationOptions);

        if (onClick) {
            notification.onclick = onClick;
        }
        var timeoutId = setTimeout(function() {
            if (notification) {
                notification.close();
            }
        }, 5000);

        notification.onclose = function() {
            clearTimeout(timeoutId);
        };
    } catch (e) {
        console.log(e.message);
        // maybe in future, when helpdesk will be under https...
        /*try {
         ServiceWorkerRegistration.showNotification(title, notificationOptions);
         } catch(e) {
         console.log(e.message);
         }*/
    }
}

function disconnectIO() {
    if (null !== socket) {
        socket = null;
    }
}

const Root = React.createClass({
    // state is changed
    componentWillReceiveProps(props) {
        if (false !== props.modal) {
            if (isIe9) {
                alert(props.modal.text);
            } else {
                this.refs.modal.show();
            }
        }

        this.checkAuth();
    },

    checkAuth: function() {
        const { dispatch } = this.props;
        if (false !== this.props.user) {
            connectIO(this.props.user, dispatch);

            if (window.Notification) {
                Notification.requestPermission(function newMessage(permission) {
                    if (permission != "granted") {
                        return;
                    }
                });
            }

        } else {
            disconnectIO();
        }
    },

    // component was rendered for the 1st time
    componentDidMount() {
        this.checkAuth();
    },

    onModalHide() {
        const { dispatch } = this.props;
        dispatch(RootActions.hideModal());
    },

    hideModal() {
        this.refs.modal.hide();
    },

    render() {
        let modalHeader = 'Ошибка';
        let modalText   = 'Что-то пошло не так!';

        if (this.props.modal !== false) {
            modalHeader = this.props.modal.header || modalHeader;
            modalText   = this.props.modal.text || modalHeader;
        }

        return (
            <div className="root-wrap">
                <RouteHandler routerState={this.props.routerState}/>
                {isIe9 ? '' : <Modal onHide={this.onModalHide} ref="modal">
                    <div className="modal-content-wrap">
                        <div className="header">{modalHeader}</div>
                        <div className="text">{modalText}</div>
                        <div className="link-wrap">
                            <a onClick={this.hideModal}
                               href="javascript:void(0);"
                               className="btn btn-red-big">Закрыть</a>
                        </div>
                    </div>
                </Modal>}
            </div>
        )
    }
});

function select(state) {
    return {
        user: state.root.user,
        modal: state.root.modal
    }
}

module.exports = connect(select)(Root);
