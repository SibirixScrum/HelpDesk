/*** @jsx React.DOM */
const TicketsListHeader  = require('./list/header');
const TicketsListContent = require('./list/content');
const AddTicket          = require('../home/add-ticket');

const React = require('react');

const TicketsList = React.createClass({
    getInitialState() {
        return {
            isPopup: false
        }
    },

    togglePopup() { this.setState({isPopup: !this.state.isPopup}) },

    closePopup() { this.setState({isPopup: false}) },

    render() {
        var loading = this.props.tickets.isLoading ? 'loading' : '';

        return (
            <div className={`column tickets-list-column ${loading}`}>
                <TicketsListHeader togglePopup={this.togglePopup} onSortChange={this.props.onSortChange} curSort={this.props.tickets.sort}/>

                <div id="add-ticket-popup" className={this.state.isPopup ? 'add-ticket-popup add-ticket-page vis' : 'add-ticket-popup add-ticket-page'}>
                    <AddTicket closePopup={this.closePopup} user={this.props.user} isPopup={this.state.isPopup} projects={this.props.projects} />
                </div>
                <div onClick={this.closePopup} onTouchEnd={this.closePopup} className="popup-cover"></div>
                <TicketsListContent tickets={this.props.tickets}
                                    closeDetail={this.props.closeDetail}
                                    openDetail={this.props.openDetail}
                                    loadMore={this.props.loadMore}/>
            </div>
        )
    }
});

module.exports = TicketsList;
