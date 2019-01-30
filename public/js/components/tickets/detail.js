/*** @jsx React.DOM */

const TicketsDetailHeader   = require('./detail/header');
const TicketsDetailMessages = require('./detail/messages');
const TicketsDetailTags     = require('./detail/tags');
const React = require('react');
const TicketsDetail = React.createClass({
    render() {
        const ticket = this.props.opened;

        let classes = ticket ? "column one-ticket visible" : "column one-ticket";
        if (!ticket.opened) classes += ' closed';
        if (this.props.isDetailLoading) classes += ' loading';

        var proj = false;
        if (ticket) {
            proj = APP.projects.filter((project) => project.code === ticket.project);
            proj = proj[0];
        }

        return (
            <div className={classes}>
                <TicketsDetailHeader isBtnDisabled={this.props.isBtnDisabled} setTicketState={this.props.setTicketState} closePanel={this.props.closePanel} ticket={ticket}/>


                {proj && proj.canSupport ?
                 <TicketsDetailTags tags={ticket.tags}
                                    tagsReference={this.props.tagsReference}
                                    tagAdd={tag => { this.props.tagAdd(ticket.project, ticket.number, tag) }}
                                    tagRemove={index => { this.props.tagRemove(ticket.project, ticket.number, index) }}
                /> : null}

                <TicketsDetailMessages isLoading={this.props.isDetailLoading} showModal={this.props.showModal} ticket={ticket} />
            </div>
        )
    }
});

module.exports = TicketsDetail;
