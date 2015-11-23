/*** @jsx React.DOM */

const React     = require('react');
const extend    = require('extend');
const request   = require('superagent');
const FormMixin = require('../../mixins/form-mixin');

const Login = React.createClass({
    mixins: [FormMixin],
    getInitialState() {
        return {
            isReset: false,
            isLoading: false,
            errors: {
                email: {
                    empty: false,
                    wrong: false
                },
                password: {
                    empty: false,
                    wrong: false
                }
            },
            form: {
                email: '',
                password: ''
            }
        }
    },

    componentDidMount() {
        if (this.props.passChanged) {
            this.props.showModal({header: 'Восстановление пароля', text: 'Ваш пароль был успешно изменен и выслан вам на почту! Теперь вы можете авторизоваться, используя пароль из письма.'});
        }
        if (this.props.query.login) {
            this.setState({form: {email: decodeURIComponent(this.props.query.login)}});
            this.refs.password.getDOMNode().focus();
        } else {
            this.refs.email.getDOMNode().focus();
        }
    },
    
    componentDidUpdate(prevProps, prevState) {
        if (prevState.isReset !== this.state.isReset) React.findDOMNode(this.refs.email).focus();
    },

    handleLogin() {
        request.post('/user/login')
            .type('json')
            .send({
                nocache: Date.now(),
                email: this.state.form.email,
                password: this.state.form.password
            })
            .end(function(err, res) {
                const response = res.xhr.response || res.xhr.responseText;
                res = JSON.parse(response);
                this.setState({isLoading: false});

                if (res.result) {
                    this.props.onLogin(res);
                    return;
                }

                if (res.error === 'wrong pass') {
                    this.setState({errors: extend({}, this.state.errors, {password: {wrong: true}})});
                    this.refs.password.getDOMNode().focus();
                }
                if (res.error === 'no user') {
                    this.setState({errors: extend({}, this.state.errors, {email: {wrong: true}})});
                    this.refs.email.getDOMNode().focus();
                }
            }.bind(this));
    },

    handleReset() {
        request.post('/user/reset')
            .type('json')
            .send({
                nocache: Date.now(),
                email: this.state.form.email
            })
            .end(function(err, res) {
                const response = res.xhr.response || res.xhr.responseText;
                res = JSON.parse(response);
                this.setState({isLoading: false});

                if (res.result) {
                    this.props.showModal({header: 'Восстановление пароля', text: 'Инструкция по восстановлению пароля отправлена вам на почту!'});
                }

                if (res.error === 'no user') {
                    this.setState({errors: extend({}, this.state.errors, {email: {wrong: true}})});
                    this.refs.email.getDOMNode().focus();
                }
            }.bind(this));
    },

    onSubmit(e) {
        e.preventDefault();

        let fields = this.state.form;

        if (this.state.isReset) fields.password = 'none';
        if (!this.validateForm() || this.state.errors.email.wrong) return;

        this.setState({isLoading: true});

        if (this.state.isReset) {
            this.handleReset();
        } else {
            this.handleLogin();
        }
    },

    focusFirst(ev) {
        if (ev.keyCode == 9 && !ev.shiftKey) {
            ev.preventDefault();
            React.findDOMNode(this.refs.email).focus();
        }
    },

    focusLast(ev) {
        if (ev.keyCode == 9 && ev.shiftKey) {
            ev.preventDefault();
            React.findDOMNode(this.refs.submit).focus();
        }
    },

    render() {
        const onFieldChange = this.onFieldChange;
        const {isReset} = this.state;

        return (
            <div className="form login">
                <form onSubmit={this.onSubmit} action="javascript:void(0)" method="post" encType="multipart/form-data">
                    <input type="hidden" name="sessid"/>

                    <div className="row">
                        <label className={this.getClassName('email')}>
                            <span>Email</span>
                            <input onChange={() => onFieldChange('email')}
                                   onKeyUp={() => onFieldChange('email')}
                                   ref="email"
                                   value={this.state.form.email}
                                   type="text"
                                   onKeyDown={this.focusLast}
                                   name="email"/>
                            <span className="error-text">{this.state.errors.email.wrong ? 'Пользователь не найден' : 'Необходимо указать валидный Email'}</span>
                        </label>
                    </div>
                    <div className={this.state.isReset ? "hidden row" : "row"}>
                        <label className={this.getClassName('password')}>
                            <span>Пароль</span>

                            <input onChange={() => onFieldChange('password')}
                                   onKeyUp={() => onFieldChange('password')}
                                   value={this.state.form.password}
                                   ref="password"
                                   type="password"
                                   name="password"/>
                            <span className="error-text">{this.state.errors.password.wrong ? 'Неверный пароль' : 'Необходимо ввести пароль'}</span>
                        </label>
                    </div>
                    <div className={isReset ? "back reset-pass-wrap" : "reset-pass-wrap"}>
                        <a
                            onClick={() => isReset ? this.setState({isReset: false, form: {email: this.state.form.email, password: ''}}) : this.setState({isReset: true})}
                            href="javascript:void(0);">{isReset ? "Назад к форме входа" : "Восстановить пароль"}
                        </a>
                    </div>

                    <div className="row-submit">
                        <input className={this.state.isLoading ? 'btn btn-blue js-send loading' : 'btn btn-blue js-send'}
                               type="submit"
                               ref="submit"
                               onKeyDown={this.focusFirst}
                               value={!this.state.isReset ? "Отправить" : "Восстановить"}/>
                    </div>
                </form>
            </div>
        )
    }
});

module.exports = Login;