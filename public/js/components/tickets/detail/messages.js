/*** @jsx React.DOM */

const TicketAnswerForm = require('./messages/answer-form');
const TicketMessage = require('./messages/message');
const React = require('react');

const TicketsDetailMessages = React.createClass({
    componentDidUpdate: function() {
        var node = this.getDOMNode();
        node.scrollTop = node.scrollHeight;
    },

    render() {
        return (
            <div className="ticket-messages">
                {this.props.ticket ? <TicketMessage ticket={this.props.ticket} /> : ''}
                {this.props.ticket.opened ? <TicketAnswerForm isLoading={this.props.isLoading} showModal={this.props.showModal} ticket={this.props.ticket} /> : ''}
            </div>
        )
    }
});

module.exports = TicketsDetailMessages;
