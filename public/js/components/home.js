/*** @jsx React.DOM */

const React       = require('react');
const {connect}      = require('react-redux');
const reqwest     = require('reqwest');
const Router      = require('react-router');
const Login       = require('./home/login');
const AddTicket   = require('./home/add-ticket');
const RootActions = require('../actions').root;

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

if (0 !== project.files.length) {
    docs = <div className="documents">
        {project.files.map(function(file, key) {
            return <a className="doc" key={key} target="_blank" href={file.path}>{file.name}</a>;
        })}
    </div>;
}

const Home = React.createClass({
    mixins: [Router.Navigation],
    getInitialState() {
        return {
            isLogin: false,
            isSuccess: false,
            isLoading: false
        }
    },
    componentWillReceiveProps(newProps) {},

    toggleForms() {
        this.setState({isLogin: !this.state.isLogin});
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
                <AddTicket isSuccess={this.state.isSuccess}
                           user={user}
                           isLoading={this.state.isLoading}
                           onAddTicket={(data) => this.addTicket(data)}/>;
        } else {
            if (this.state.isLogin) {
                form = <Login isLoading={this.state.isLoading} onLogin={(data) => this.onLogin(data)}/>
            } else {
                form =
                    <AddTicket isSuccess={this.state.isSuccess}
                               isLoading={this.state.isLoading}
                               onAddTicket={(data) => this.addTicket(data)}/>;
            }
        }

        return (


            <div className="wrapper add-ticket-page">
                <TopLink router={this.context.router}
                         onClickHandler={this.toggleForms}
                         isAuth={user.email ? true : false}
                         isLogin={this.state.isLogin}/>

                <h1>{project.name}</h1>

                <h2>{project.title}</h2>

                {form}

                {docs}
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
            text = 'Список тикетов';
        } else {
            text = this.props.isLogin ? 'Добавить тикет' : 'Войти';
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
        home: state.home
    }
}

module.exports = connect(select)(Home);