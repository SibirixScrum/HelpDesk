/*** @jsx React.DOM */
const React = require('react');
const SortItem = require('./header/sort-item');
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
            curSort: this.props.curSort
        };
    },

    onClickHandler: function () {
        this.setState({sortOpened: !this.state.sortOpened});
    },

    closeSortMenu: function () {
        this.setState({sortOpened: false});
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
                    <span className="title">Сортировать:</span>
                    <span className="one-sort current" onClick={this.onClickHandler}>{currentSortItem.name} <span className="dir">{currentSortItem.dir}</span></span>

                    <div className="dropdown" style={{display: this.state.sortOpened ? 'block' : 'none'}}>
                        {sortItems}
                    </div>
                </div>
                <a onClick={this.props.togglePopup} href="javascript:void(0);" className="btn btn-blue-small">Добавить тикет</a>
            </div>
        )
    }
});

module.exports = TicketsListHeader;
