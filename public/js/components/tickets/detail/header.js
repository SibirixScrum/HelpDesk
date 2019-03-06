/*** @jsx React.DOM */
const React = require('react');
const {translate, i18n} = require('../../../i18n');

const TicketsDetailHeader = React.createClass({
    render() {
        const {setTicketState, ticket, isBtnDisabled} = this.props;
        const classes = ticket.opened ? "btn btn-red js-close-ticket" : "btn btn-blue-small js-close-ticket";

        let proj = APP.projects.filter((project) => project.code === ticket.project);
        proj = proj[0];

        let onStateClickHandler = function() {
            if (!isBtnDisabled) {
                setTicketState(!ticket.opened, ticket.project, ticket.number)
            }
        };

        return (
            <div className="column-title">
                <a onClick={this.props.closePanel} className="icon-back js-back" href="javascript:void(0)"></a>

                <a onClick={() => onStateClickHandler()}
                   className={classes}
                   href="javascript:void(0)">{ticket.opened ? translate('tickets.do.close') : translate('tickets.do.open')}</a>

                <span className="ticket-title" title={ticket.title}>{ticket.title}</span>
                {proj ? <span className="number">{proj.letters}-{ticket.number}</span> : ''}
            </div>
        )
    }
});

module.exports = TicketsDetailHeader;
