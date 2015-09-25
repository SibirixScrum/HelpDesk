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
    togglePopup() {
        this.setState({isPopup: !this.state.isPopup});
    },
    render() {
        var loading = this.props.tickets.isLoading ? 'loading' : '';

        return (
            <div className={`column tickets-list-column ${loading}`}>
                <TicketsListHeader togglePopup={this.togglePopup} onSortChange={this.props.onSortChange} curSort={this.props.tickets.sort}/>

                <div className={this.state.isPopup ? 'add-ticket-popup add-ticket-page vis' : 'add-ticket-popup add-ticket-page'}>
                    <AddTicket user={this.props.user} close={this.togglePopup} isPopup={true} projects={this.props.projects} />
                </div>
                <TicketsListContent tickets={this.props.tickets}
                                    openDetail={this.props.openDetail}
                                    loadMore={this.props.loadMore}/>
            </div>
        )
    }
});

module.exports = TicketsList;
