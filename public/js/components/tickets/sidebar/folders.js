const React = require('react');
const Folder = require('./folders/index');

const Folders = React.createClass({
    render() {
        let active = this.props.tickets.state;
        var i;

        let opened = 0;
        let closed = 0;

        for (i in this.props.allowedProjects) {
            if (!this.props.allowedProjects.hasOwnProperty(i)) {
                continue;
            }

            if (-1 === this.props.activeProjects.indexOf(i)) {
                continue;
            }

            opened += parseInt(this.props.allowedProjects[i].opened, 10);
            closed += parseInt(this.props.allowedProjects[i].closed, 10);
        }

        let allCount = opened + closed;

        return (
            <ul className="folders">
                <Folder onStateClick={this.props.onStateClick} activeFolder={active} folder={{title: 'Все обращения', code: 'SHOW_ALL', count: allCount}} />
                <Folder onStateClick={this.props.onStateClick} activeFolder={active} folder={{title: 'Открытые', code: 'SHOW_OPENED', count: opened}} />
                <Folder onStateClick={this.props.onStateClick} activeFolder={active} folder={{title: 'Закрытые', code: 'SHOW_CLOSED', count: closed}} />
            </ul>
        )
    }
});

module.exports = Folders;

