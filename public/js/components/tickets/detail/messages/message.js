/*** @jsx React.DOM */
const React = require('react');
const moment = require('moment');
require('moment/locale/ru');
moment.locale('ru');

const TicketMessage = React.createClass({
    componentDidUpdate() {

    },
    render() {
        return (
            <div>
                {this.props.ticket && this.props.ticket.messages ? this.props.ticket.messages.map((m, i) => <Message our={m.author.email !== this.props.ticket.author.email} key={i} message={m} />) : ''}
            </div>
        )
    }
});

const Message = React.createClass({
    render() {
        const message = this.props.message;
        if (!message.text) {
            console.log(message);
        } else {
            message.text = message.text.replace(/<base[^>]*>/ig, '');
        }
        return (
            <div>
                <div className={this.props.our ? "message our" : "message"}>
                    {this.props.our ? <div className="logo"><img src="../pictures/logo.png" /></div> : ''}
                    <div className="author">
                        <span className="name">{message.author.name}</span>
                        {!this.props.our ? <a className="email" href="javascript:void(0)">&lt;{message.author.email}&gt;</a> : ''}
                        <span className="date">{moment(message.date).format('L LT')}</span>
                    </div>
                    <div className="text" dangerouslySetInnerHTML={{__html: message.text}}></div>
                    {message.files.length ?
                        <div className="files">
                            <br/>
                            <div>Прикрепленные файлы:</div>
                            {message.files.map((file) => <File link={file.path} title={file.name} />)}
                        </div>
                     : ''}
                </div>
            </div>
        )
    }
});

const File = React.createClass({
    render() {
        return (
            <div className="file"><a target="_blank" href={this.props.link}>{this.props.title}</a></div>
        )
    }
});

module.exports = TicketMessage;
