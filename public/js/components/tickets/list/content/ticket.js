/*** @jsx React.DOM */
const React = require('react');
const moment = require('moment');
require('moment/locale/ru');
moment.locale('ru');

const Ticket = React.createClass({
    onClickHandler(e) {
        e.stopPropagation();
        this.props.openDetail({
            project: this.props.ticket.project,
            number: this.props.ticket.number
        });
    },

    render() {
        var ticket = this.props.ticket;
        var projects = APP.projects;
        var markDateRed = APP.markDateRed;

        // Определяем проект тикета
        var project = null;
        projects.map(function (item) {
            if (ticket.project === item.code) {
                project = item;
                return false;
            }
        });

        if (project == null) {
            return false;
        }

        var uid = ticket.project + '-' + ticket.number;

        // Дата последнего сообщения
        var lastDate = moment(new Date(ticket.lastDate));
        var showRedTime = moment().subtract(markDateRed, 'seconds').isAfter(lastDate);
        var lastDateFormatted = lastDate.startOf('minut').fromNow();

        // Add classes
        var className = !ticket.opened ? 'closed ' : '';
        className += ticket.isLastSupport ? 'last-support ' : '';
        className += this.props.curOpen && (this.props.curOpen.project === ticket.project) && (this.props.curOpen.number === ticket.number) ? 'active ' : '';

        return (
            <div className={`ticket-row ${className}`}
                 data-uid={uid}
                 style={{backgroundColor: project.color, color: project.color}}
                 onClick={this.onClickHandler}
            >
                <div className="icon">{project.letters}</div>
                <div className="subject">{ticket.title}</div>
                <div className={"time" + (showRedTime ? ' fuckup' : '')}>{lastDateFormatted}</div>
                <div className="uid">{uid}</div>
                <div className="name">{ticket.author.name ? ticket.author.name : ticket.author.email}</div>
                <div className="status">{ticket.opened ? 'Открыт' : 'Закрыт'}</div>
            </div>
        )
    }
});

module.exports = Ticket;
