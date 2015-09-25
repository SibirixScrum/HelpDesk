/*** @jsx React.DOM */
const React = require('react');

const Folders = require('./sidebar/folders');
const Projects = require('./sidebar/projects');

const reqwest = require('reqwest');

const TicketsSidebar = React.createClass({
    doLogout() {
        reqwest({
            url: '/user/logout',
            method: 'get',
            type: 'json',
            success: function(data) {
                if (true === data.result) {
                    this.props.onLogout();
                }
            }.bind(this)
        })
    },

    render() {
        return (
            <div className="column sidebar">
                <div className="column-title"><a onClick={this.doLogout}  className="logout">{this.props.user.email}</a></div>
                <Folders tickets={this.props.tickets} allowedProjects={this.props.allowedProjects} onStateClick={this.props.onStateClick} activeProjects={this.props.tickets.activeProjects} />
                <Projects allowedProjects={this.props.allowedProjects} activeProjects={this.props.tickets.activeProjects} onToggleProject={this.props.onToggleProject}/>
            </div>
        )
    }
});

module.exports = TicketsSidebar;
