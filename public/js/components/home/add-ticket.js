/*** @jsx React.DOM */
const React    = require('react');
const reqwest  = require('reqwest');

const AddForm = require('./add-ticket/add-form');

const AddTicket = React.createClass({
    getInitialState() {
        return {
            isLoading: false,
            isSuccess: false
        }
    },

    onSubmit(data) {
        if (this.state.isLoading || this.state.isSuccess) return;

        this.setState({isLoading: true});

        reqwest({
            url: data.url,
            method: 'post',
            data: data.form,
            type: 'json',
            contentType: false,
            processData: false,
            success: function(res) {
                if (res.number) {
                    this.setState({isLoading: false, isSuccess: true});

                    setTimeout(function() {
                        this.setState({isSuccess: false})
                    }.bind(this), 6000);
                }
            }.bind(this)
        })
    },
    render() {
        let toRender = <AddForm isSuccess={this.state.isSuccess} user={this.props.user} projects={this.props.projects} onSubmit={this.onSubmit} isLoading={this.state.isLoading} isPopup={this.props.isPopup} />;
        //let toRender = this.state.isSuccess ? <Success /> :
        //    <AddForm user={this.props.user} projects={this.props.projects} onSubmit={this.onSubmit} isLoading={this.state.isLoading} isPopup={this.props.isPopup} />

        return (
            <div className="form">
                {this.props.isPopup ?
                    <a onClick={this.props.close} href="javascript:void(0);" className="close"></a> : ''}
                {toRender}
            </div>
        )
    }
});

const Success = React.createClass({
    render() {
        return (
            <div className="success">Тикет отправлен. Проверяйте почту.</div>
        )
    }
});

module.exports = AddTicket;