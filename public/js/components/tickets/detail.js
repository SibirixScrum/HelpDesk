/*** @jsx React.DOM */

const TicketsDetailHeader = require('./detail/header');
const TicketsDetailMessages = require('./detail/messages');
const React = require('react');
const TicketsDetail = React.createClass({
    render() {
        const ticket = this.props.opened;

        let classes = ticket ? "column one-ticket visible" : "column one-ticket";
        if (!ticket.opened) classes += ' closed';
        if (this.props.isDetailLoading) classes += ' loading';

        return (
            <div className={classes}>
                <TicketsDetailHeader isBtnDisabled={this.props.isBtnDisabled} setTicketState={this.props.setTicketState} closePanel={this.props.closePanel} ticket={ticket}/>
                <TicketsDetailMessages isLoading={this.props.isDetailLoading} showModal={this.props.showModal} ticket={ticket} />
            </div>
        )
    }
});

module.exports = TicketsDetail;
