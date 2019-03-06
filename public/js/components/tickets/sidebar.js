/*** @jsx React.DOM */
const React = require('react');

const Folders = require('./sidebar/folders');
const Projects = require('./sidebar/projects');
const Copyright = require('../copyright');
const request = require('superagent');
const LanguageSwitcher = require('../language-switcher');

const TicketsSidebar = React.createClass({
    doLogout() {
        request.get('/user/logout')
            .type('json')
            .end(function(err, res) {
                const response = res.xhr.response || res.xhr.responseText;
                res = JSON.parse(response);

                if (true === res.result) {
                    this.props.onLogout();
                }
            }.bind(this));
    },

    render() {
        return (
            <div className="column sidebar">
                <div className="column-title"><a onClick={this.doLogout}  className="logout">{this.props.user.email}</a></div>
                <Folders tickets={this.props.tickets} allowedProjects={this.props.allowedProjects} onStateClick={this.props.onStateClick} activeProjects={this.props.tickets.filter.projects} />
                <Projects allowedProjects={this.props.allowedProjects} activeProjects={this.props.tickets.filter.projects} onToggleProject={this.props.onToggleProject}/>

                <div className="sidebar-btn-wrapper">
                    <LanguageSwitcher lng={this.props.lng} changeLanguage={this.props.changeLanguage}/>
                    {this.props.curProject.footer === false ? '' : <Copyright />}
                </div>
            </div>
        )
    }
});

module.exports = TicketsSidebar;
