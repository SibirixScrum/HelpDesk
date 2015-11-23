/*** @jsx React.DOM */
const Ticket = require('./content/ticket');
const React = require('react');

const TicketsListContent = React.createClass({
    componentDidMount() {
        let container = React.findDOMNode(this.refs.ticketsContainer);
        container.addEventListener("scroll", this.onScrollHandler);
    },

    onScrollHandler() {
        let container = React.findDOMNode(this.refs.ticketsContainer);
        let sTop = container.scrollTop;
        let cHeight = container.offsetHeight;
        let wHeight = document.getElementById('tickets-wrapper').offsetHeight;

        const {tickets} = this.props;

        if (sTop + cHeight >= wHeight - 100 && !tickets.isLoading) {
            this.props.loadMore();
        }
    },


    componentWillUnmount() {
        let container = React.findDOMNode(this.refs.ticketsContainer);
        container.removeEventListener("scroll", this.onScrollHandler);
    },

    render() {
        var openDetail = this.props.openDetail;
        var curOpen = this.props.tickets.detailedOpened;
        var tickets = this.props.tickets.items.map(function (ticket, key) {
            return (
                <Ticket ticket={ticket} key={key} openDetail={openDetail} curOpen={curOpen} />
            );
        });

        return (
            <div onClick={this.props.closeDetail} className="tickets-list" ref="ticketsContainer">
                <div id="tickets-wrapper">
                    {tickets}
                </div>
            </div>
        )
    }
});

module.exports = TicketsListContent;
