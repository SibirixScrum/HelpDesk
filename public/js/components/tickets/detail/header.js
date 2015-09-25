/*** @jsx React.DOM */
const React = require('react');
const TicketsDetailHeader = React.createClass({
    render() {
        const setTicketState = this.props.setTicketState;
        const project = this.props.ticket.project;
        const number = this.props.ticket.number;
        const opened = this.props.ticket.opened;
        const classes = opened ? "btn btn-red js-close-ticket" : "btn btn-blue-small js-close-ticket";

        let proj = APP.projects.filter(function(project) {
            return project.code === this.props.ticket.project;
        }.bind(this));
        proj = proj[0];

        return (
            <div className="column-title">
                <a onClick={this.props.closePanel} className="icon-back js-back" href="javascript:void(0)"></a>
                <a onClick={() => setTicketState(!opened, project, number)} className={classes} href="javascript:void(0)">{opened ? 'Закрыть тикет' : 'Открыть тикет'}</a>
                <span className="ticket-title">{this.props.ticket.title}</span>
                {proj ? <span className="number">{proj.letters}-{this.props.ticket.number}</span> : ''}
            </div>
        )
    }
});

module.exports = TicketsDetailHeader;
