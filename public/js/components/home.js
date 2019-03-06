/*** @jsx React.DOM */

const React       = require('react');
const {connect}      = require('react-redux');
const Router      = require('react-router');
const Login       = require('./home/login');
const Copyright   = require('./copyright');
const AddTicket   = require('./home/add-ticket');
const RootActions = require('../actions').root;
const LanguageSwitcher = require('./language-switcher');

const {translate, getCurLang, translateWithoutCode, i18n} = require('../i18n');

let docs = '';

let project;

if (0 !== APP.projects.length) {
    project = APP.projects.filter(function(p) {
        return p.domain === document.location.host;
    }).shift();

    if (undefined === project) {
        document.location.href = '//' + APP.projects[0].domain;
    }
}

if (project && 0 !== project.files.length) {
    let className = 'documents';
    className += project.filesPos == 'right' ? ' to-right' : '';
    docs = <div className={className}>
        {project.files.map(function(file, key) {
            return <a className="doc" key={key} target="_blank" href={file.path}>{translateWithoutCode(file.name)}</a>;
        })}
    </div>;
}

const Home = React.createClass({
    mixins: [Router.Navigation],
    getInitialState() {
        return {
            isLogin: false,
            isSuccess: false,
            passChanged: APP.passChanged,
            isLoading: false
        }
    },

    componentDidMount() {
        if (this.props.query.login || this.state.passChanged) {
            this.setState({isLogin: true});
        }
    },

    componentWillReceiveProps(newProps) {},

    toggleForms() {
        this.setState({isLogin: !this.state.isLogin, passChanged: false});
    },

    showModal(content) {
        const {dispatch} = this.props;
        dispatch(RootActions.showModal(content));
    },

    onLogin(response) {
        const {dispatch} = this.props;

        APP.countTickets = response.countTickets;
        dispatch(RootActions.loginSuccess(response));
        this.transitionTo('tickets');
    },

    render() {
        const {user} = this.props;

        let form;
        if (user.email) {
            form =
                <AddTicket onLogin={this.onLogin} isSuccess={this.state.isSuccess}
                           user={user}
                           isLoading={this.state.isLoading}
                           onAddTicket={(data) => this.addTicket(data)}/>;
        } else {
            if (this.state.isLogin) {
                form = <Login passChanged={this.state.passChanged} showModal={(content) => this.showModal(content)} query={this.props.query} isLoading={this.state.isLoading} onLogin={(data) => this.onLogin(data)}/>
            } else {
                form =
                    <AddTicket onLogin={this.onLogin} isSuccess={this.state.isSuccess}
                               user={false}
                               isLoading={this.state.isLoading}
                               onAddTicket={(data) => this.addTicket(data)}/>;
            }
        }

        return (
            <div className="wrapper add-ticket-page">
                <div className="header-btn-wrapper">
                    <LanguageSwitcher lng={this.props.lng}
                                      changeLanguage={this.props.changeLanguage}/>

                    <TopLink router={this.context.router}
                             onClickHandler={this.toggleForms}
                             isAuth={user.email ? true : false}
                             isLogin={this.state.isLogin}/>
                </div>

                {project.footer === false ? '' : <Copyright />}

                <h1>{translateWithoutCode(project.name)}</h1>

                <h2>{translateWithoutCode(project.title)}</h2>

                <div className="form-wrapper">
                    {form}

                    {docs}
                </div>
            </div>
        )
    }
});

const TopLink = React.createClass({
    mixins: [Router.Navigation],
    goToTickets() {
        this.transitionTo('tickets');
    },
    render() {
        let text;

        if (this.props.isAuth) {
            text = translate('topLink.isAuth');
        } else {
            text = this.props.isLogin ? translate('topLink.isLogin') : translate('topLink.notAuth');
        }

        return (
            <a onClick={this.props.isAuth ? this.goToTickets : this.props.onClickHandler}
               href="javascript:void(0);"
               className="btn login">{text}</a>
        )
    }
});

Home.contextTypes = {
    router: React.PropTypes.func.isRequired
};

function select(state) {
    return {
        user: state.root.user,
        home: state.home,
        lng: state.root.lng
    }
}

function dispatchToProps(dispatch) {
    return {
        changeLanguage: (lng) => dispatch(RootActions.changeLang(lng)),
        dispatch
    }
}

module.exports = connect(select, dispatchToProps)(Home);
