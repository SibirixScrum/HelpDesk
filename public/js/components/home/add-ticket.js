/*** @jsx React.DOM */
const isIE9       = require('../ie-check');
const React       = require('react');
const request     = require('superagent');
const {connect}   = require('react-redux');
const AddForm     = require('./add-ticket/add-form');
const RootActions = require('../../actions').root;

const ESC_KEY = 27;

const AddTicket = React.createClass({
    closeTimeout: false,
    serverResponse: false,
    getInitialState() {
        return {
            isLoading: false,
            isSuccess: false
        }
    },

    componentDidMount() {
        window.addEventListener('keyup', this.escClick.bind(this));
    },

    componentWillReceiveProps(props) {

    },

    escClick(e) {
        if (e.keyCode == ESC_KEY) this.closePopup();
    },

    showModal(content) {
        const {dispatch} = this.props;
        dispatch(RootActions.showModal(content));
    },

    closePopup() {
        clearTimeout(this.closeTimeout);
        this.setState({isSuccess: false})

        if (this.props.closePopup) {
            this.props.closePopup();
        }

        if (!this.props.user && this.serverResponse !== false && this.serverResponse.user !== undefined) {
            this.props.onLogin(this.serverResponse);
            this.serverResponse = false;
        }
    },

    onSubmit(data) {
        if (this.state.isLoading || this.state.isSuccess) return;

        this.setState({isLoading: true});

        let req = request
            .post(data.url)
            .set('Accept', 'application/json');

        if (isIE9) {
            req.send(data.form);
        } else {
            req
                .field('name', data.form.name)
                .field('projectCode', data.form.project)
                .field('email', data.form.email)
                .field('title', data.form.title)
                .field('text', data.form.text)
                .field('nocache', Date.now());
        }

        if (data.form.files.length && !isIE9) {
            data.form.files.forEach(function(file) {
                req.attach('files[]', file, file.name);
            });
        }

        req.end(this._responseHandler.bind(this));
    },

    _responseHandler(err, res) {
        if (err) {
            let resp = JSON.parse(err.response.text);
            this.setState({isLoading: false, isSuccess: false});
            this.showModal({text: resp.message});

            return;
        }

        const response = res.xhr.response || res.xhr.responseText;

        res = JSON.parse(response);

        if (res.number) {
            let successText     = this.props.user
                ? <span>Спасибо за ваше обращение. <br/> Мы уже его получили и работаем!</span>
                : res.user === undefined
                ? <span>О! Вы уже с нами. <br/> Для того, чтобы отслеживать тикеты — войдите в личный кабинет.</span>
                :
                <span>Мы создали вам пароль и отправили его вам на почту,<br/>чтобы вы могли отcлеживать ваш тикет.</span>;

            this.setState({fileError: false, isLoading: false, isSuccess: successText});
            this.serverResponse = res;

            this.closeTimeout = setTimeout(function() {
                //this.closePopup();
            }.bind(this), 4000);
        }
    },

    render() {
        let toRender = <AddForm closePopup={this.closePopup}
                                showModal={this.showModal}
                                isSuccess={this.state.isSuccess}
                                user={this.props.user}
                                projects={this.props.projects}
                                onSubmit={this.onSubmit}
                                isLoading={this.state.isLoading}
                                isPopup={this.props.isPopup}/>;

        return (
            <div className="form">
                {this.props.isPopup ?
                    <a onClick={this.closePopup} href="javascript:void(0);" className="close"></a> : ''}
                {toRender}
            </div>
        )
    }
});

module.exports = connect()(AddTicket);