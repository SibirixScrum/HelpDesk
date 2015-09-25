/*** @jsx React.DOM */

const TicketsDetailHeader = require('./detail/header');
const TicketsDetailMessages = require('./detail/messages');
const React = require('react');
const TicketsDetail = React.createClass({
    render() {
        const opened = this.props.opened;
        let ticket = false;

        if (opened) {
            ticket = this.props.tickets.filter((t) => t.project === opened.project && t.number === opened.number)[0];
            ticket = ticket || false;
        }

        let classes = ticket ? "column one-ticket visible" : "column one-ticket";
        if (!ticket.opened) classes += ' closed';

        return (
            <div className={classes}>
                <TicketsDetailHeader setTicketState={this.props.setTicketState} closePanel={this.props.closePanel} ticket={ticket}/>
                <TicketsDetailMessages opened={opened} ticket={ticket} />
            </div>
        )
    }
});

module.exports = TicketsDetail;
