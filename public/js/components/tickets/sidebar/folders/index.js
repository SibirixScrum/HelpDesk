const React = require('react');

const Folder = React.createClass({
    handleClick() {
        this.props.onStateClick(this.props.folder.code);
    },

    render() {
        let active = this.props.activeFolder == this.props.folder.code ? 'active' : '';
        return (
            <li><a onClick={this.handleClick} href="javascript:void(0)" className={active}><span>{this.props.folder.title}</span><span className="count">{this.props.folder.count}</span></a></li>
        )
    }
});

module.exports = Folder;
