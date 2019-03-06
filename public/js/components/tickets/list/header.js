/*** @jsx React.DOM */
const React = require('react');
const _ = require('underscore');
const SortItem = require('./header/sort-item');
const TagsFilter = require('./header/tags-filter');

const {translate, i18n} = require('../../../i18n');

const SortTypes = [
    {
        sort: 'date asc',
        name: 'tickets.sortTypes.dateAsc.name',
        dir: 'tickets.sortTypes.dateAsc.dir'
    },
    {
        sort: 'date desc',
        name: 'tickets.sortTypes.dateDesc.name',
        dir: 'tickets.sortTypes.dateDesc.dir'
    },
    {
        sort: 'opened asc',
        name: 'tickets.sortTypes.openedAsc.name',
        dir: 'tickets.sortTypes.openedAsc.dir'
    },
    {
        sort: 'opened desc',
        name: 'tickets.sortTypes.openedDesc.name',
        dir: 'tickets.sortTypes.openedDesc.dir'
    }
];

const TicketsListHeader = React.createClass({
    getInitialState: function() {
        return {
            sortOpened: false,
            tagsOpened: false,
            curSort: this.props.curSort,
            filter: {
                tags: [],
                email: ''
            },
            filterTo: null
        };
    },

    componentDidMount() {
        this.setState({filter: this.props.filter});
    },

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(nextProps.filter, this.props.filter)) {
            this.setState({filter: nextProps.filter});
        }
    },

    onClickHandler: function () {
        this.setState({sortOpened: !this.state.sortOpened, tagsOpened: false});
    },

    onTagsClickHandler: function () {
        this.setState({tagsOpened: !this.state.tagsOpened, sortOpened: false});
    },

    closeSortMenu: function () {
        this.setState({sortOpened: false});
    },

    debounceFilterChange: function(field, value) {
        clearTimeout(this.state.filterTo);
        var filter = Object.assign({}, this.state.filter);
        filter[field] = value;

        this.setState({filter});

        this.state.filterTo = setTimeout(() => {
            this.props.onFilterChange(filter);
        }, 500);
    },

    render() {
        var currentSortItem = null;
        var sortItems = SortTypes.map(function (item, key) {
            if (item.sort === this.props.curSort) {
                currentSortItem = item;
            }

            return (
                <SortItem onSortChange={this.props.onSortChange}
                          type={item.sort}
                          name={item.name}
                          dir={item.dir}
                          key={key}
                          closeSortMenu={this.closeSortMenu}
                />
            );
        }.bind(this));

        return (
            <div className="column-title">
                <div className="sort-block">
                    <span className={"one-sort current " + (currentSortItem.sort.match(/desc$/) ? 'desc' : 'asc')} onClick={this.onClickHandler}>{translate(currentSortItem.name)}</span>

                    <div className="dropdown" style={{display: this.state.sortOpened ? 'block' : 'none'}}>
                        {sortItems}
                    </div>
                </div>

                <div className="filter-tag-block">
                    <span className="title" onClick={this.onTagsClickHandler}>{translate('tickets.header.filter.tag.title')}</span>

                    <TagsFilter opened={this.state.tagsOpened}
                                tagsSelected={this.props.filter.tags}
                                tagsReference={this.props.tagsReference}
                                onFilterChange={this.props.onFilterChange}
                    />
                </div>

                <div className="filter-email-block">
                    <div className="input-wrapper">
                        <input type="text" placeholder={translate('tickets.header.filter.email.title')} value={this.state.filter.email} onChange={e => this.debounceFilterChange('email', e.target.value)} />
                        <i className="icon" />
                    </div>
                </div>
                <a onClick={this.props.togglePopup} href="javascript:void(0);" className="btn btn-blue-small">{translate('tickets.btnAdd.title')}</a>
            </div>
        )
    }
});

module.exports = TicketsListHeader;
