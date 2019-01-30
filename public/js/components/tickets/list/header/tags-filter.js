/*** @jsx React.DOM */
const React = require('react');

const TagsFilterItem = React.createClass({
    render() {
        return (
            <a href="javascript:void(0)"
               onClick={this.props.onTagClick}
               className={"one-sort" + (this.props.selected ? ' selected' : '')}
            >
                {this.props.value}
            </a>
        );
    }
});

const TagsFilter = React.createClass({
    getInitialState() {
        return {
            tagFilter: ''
        }
    },

    onTagClick(tag) {
        return () => {
            var tags = this.props.tagsSelected.slice(0);
            var index = tags.indexOf(tag);

            if (-1 === index) {
                tags.push(tag);
            } else {
                tags.splice(index, 1);
            }

            this.props.onFilterChange({tags});
        }
    },

    render() {
        return (
            <div className="dropdown" style={{display: this.props.opened ? 'block' : 'none'}}>
                <div className="input-wrapper">
                    <input type="text" placeholder="Поиск по email" value={this.state.tagFilter} onChange={e => this.setState({tagFilter: e.target.value})} />
                    <i className="icon" />
                </div>
                {this.props.tagsSelected.map(tag => <TagsFilterItem key={tag} value={tag} selected={true} onTagClick={this.onTagClick(tag)} />)}
                {this.props.tagsReference.filter(tag => -1 === this.props.tagsSelected.indexOf(tag) && (!this.state.tagFilter || tag.match(new RegExp('^.*' + this.state.tagFilter + '.*$', 'i'))))
                    .map(tag => <TagsFilterItem key={tag} value={tag} selected={false} onTagClick={this.onTagClick(tag)} />)}
            </div>
        )
    }
});

module.exports = TagsFilter;
