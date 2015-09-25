/*** @jsx React.DOM */

const React   = require('react');
const extend  = require('extend');
const reqwest = require('reqwest');
const FormMixin = require('../../mixins/form-mixin');

const Login = React.createClass({
    mixins: [FormMixin],
    getInitialState() {
        return {
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
    onSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) return;

        this.setState({isLoading: true});

        reqwest({
            url: '/user/login',
            method: 'post',
            type: 'json',
            data: {
                email: this.state.form.email,
                password: this.state.form.password
            },
            success: function(res) {
                this.setState({isLoading: false});

                if (res.result) {
                    this.props.onLogin(res);
                    return;
                }

                if (res.error === 'wrong pass') {
                    this.setState({errors: extend({}, this.state.errors, {password: {wrong: true}})});
                }
                if (res.error === 'no user') {
                    this.setState({errors: extend({}, this.state.errors, {email: {wrong: true}})});
                }

            }.bind(this)
        })
    },
    componentDidMount() {
        this.refs.email.getDOMNode().focus();
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
        const onFieldChange  = this.onFieldChange;

        return (
            <div className="form login">
                <form onSubmit={this.onSubmit} action="javascript:void(0)" method="post" encType="multipart/form-data">
                    <input type="hidden" name="sessid" value="<?= md5(time()) ?>"/>

                    <div className="row">
                        <label className={this.getClassName('email')}>
                            <span>Email</span>
                            <input onChange={() => onFieldChange('email')}
                                   onKeyUp={() => onFieldChange('email')}
                                   ref="email"
                                   type="text"
                                   onKeyDown={this.focusLast}
                                   name="email"/>
                            <span className="error-text">{this.state.errors.email.wrong ? 'Пользователь не найден' : 'Необходимо указать Email'}</span>
                        </label>
                    </div>
                    <div className="row">
                        <label className={this.getClassName('password')}>
                            <span>Пароль</span>

                            <input onChange={() => onFieldChange('password')}
                                   onKeyUp={() => onFieldChange('password')}
                                   ref="password"
                                   type="password"
                                   name="password"/>
                            <span className="error-text">{this.state.errors.password.wrong ? 'Неверный пароль' : 'Необходимо ввести пароль'}</span>
                        </label>
                    </div>
                    <div className="row-submit">
                        <input className={this.props.isLoading ? 'btn btn-blue js-send loading' : 'btn btn-blue js-send'}
                               type="submit"
                               ref="submit"
                               onKeyDown={this.focusFirst}
                               value="Отправить"/>
                    </div>
                </form>
            </div>
        )
    }
});

module.exports = Login;