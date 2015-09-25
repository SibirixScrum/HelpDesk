const React = require('react');

const Project = React.createClass({
    handleClick(){
        this.props.onToggleProject(this.props.project.code);
    },

    render() {
        let active = (this.props.active !== -1 ? 'active' : '');
        return (
            <li onClick={this.handleClick} style={{color: this.props.project.color}}><a href="javascript:void(0)" className={active}>{this.props.project.letters}</a></li>
        )
    }
});

module.exports = Project;
