
const React = require('react');
const Project = require('./projects/index');

let projects = APP.projects;

const ProjectList = React.createClass({
    render() {
        let activeProjects      = this.props.activeProjects;
        let allowedProjectsInfo = this.props.allowedProjects;
        let onToggleProject     = this.props.onToggleProject;

        /**
         * только оазрешенные проекты
         * @type {Array.<T>}
         */
        let allowedProjectList = projects.filter(function(project) {
            return allowedProjectsInfo[project.code];
        });

        return (
            <div className={this.props.noTitle ? "groups popup" : "groups" }>
                {this.props.noTitle ? '' : <div className="title">Показывать группы</div>}
                <ul>
                    {allowedProjectList.map((project, key) => <Project key={key} project={project} onToggleProject={onToggleProject} active={activeProjects.indexOf(project.code)}/>) }
                </ul>
            </div>
        )
    }
});

module.exports = ProjectList;
