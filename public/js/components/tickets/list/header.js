/*** @jsx React.DOM */
const React = require('react');
const _ = require('underscore');
const SortItem = require('./header/sort-item');
const TagsFilter = require('./header/tags-filter');
const SortTypes = [
    {
        sort: 'date asc',
        name: 'По последнему ответу',
        dir: '(новые в начале)'
    },
    {
        sort: 'date desc',
        name: 'По последнему ответу',
        dir: '(старые в начале)'
    },
    {
        sort: 'opened asc',
        name: 'Статусу',
        dir: '(закрытые в начале)'
    },
    {
        sort: 'opened desc',
        name: 'Статусу',
        dir: '(открытые в начале)'
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
                    <span className={"one-sort current " + (currentSortItem.sort.match(/desc$/) ? 'desc' : 'asc')} onClick={this.onClickHandler}>{currentSortItem.name}</span>

                    <div className="dropdown" style={{display: this.state.sortOpened ? 'block' : 'none'}}>
                        {sortItems}
                    </div>
                </div>

                <div className="filter-tag-block">
                    <span className="title" onClick={this.onTagsClickHandler}>Поиск по тегу</span>

                    <TagsFilter opened={this.state.tagsOpened}
                                tagsSelected={this.props.filter.tags}
                                tagsReference={this.props.tagsReference}
                                onFilterChange={this.props.onFilterChange}
                    />
                </div>

                <div className="filter-email-block">
                    <div className="input-wrapper">
                        <input type="text" placeholder="Поиск по email" value={this.state.filter.email} onChange={e => this.debounceFilterChange('email', e.target.value)} />
                        <i className="icon" />
                    </div>
                </div>
                <a onClick={this.props.togglePopup} href="javascript:void(0);" className="btn btn-blue-small">Добавить тикет</a>
            </div>
        )
    }
});

module.exports = TicketsListHeader;
