/*** @jsx React.DOM */
const React = require('react');

const SortItem = React.createClass({
    onSortChange: function () {
        this.props.closeSortMenu();
        this.props.onSortChange(this.props.type);
    },

    render() {
        return (
            <a href="javascript:void(0)"
               onClick={this.onSortChange}
               className="one-sort"
            >
                {this.props.name} <span className="dir">{this.props.dir}</span>
            </a>
        )
    }
});

module.exports = SortItem;
