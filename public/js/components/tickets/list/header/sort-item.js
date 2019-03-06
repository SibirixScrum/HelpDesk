/*** @jsx React.DOM */
const React = require('react');
const {translate, i18n} = require('../../../../i18n');

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
                {translate(this.props.name)} <span className="dir">{translate(this.props.dir)}</span>
            </a>
        )
    }
});

module.exports = SortItem;
