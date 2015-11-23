const React       = require('react');
const ReactRouter = require('react-router');
const Router      = ReactRouter;

const Root    = require('./components/root');
const Tickets = require('./components/tickets');
const Home    = require('./components/home');

const DefaultRoute = Router.DefaultRoute;
const Route        = Router.Route;
const NotFoundRoute = Router.NotFoundRoute;

const {Provider} = require('react-redux');

const app = document.getElementById('app');

const NotFound = React.createClass({
    mixins: [Router.Navigation],
    componentDidMount() {
        this.transitionTo('home');
    },
    render() {
        return false;
    }
});

const routes = (
    <Route name='app' path='/' handler={Root}>
        <Route name="home" path="/" handler={Home}/>
        <Route name="tickets" path="/tickets/" handler={Tickets}/>
        <Route name="ticketsDetail" path="/tickets/:id" handler={Tickets}/>
        <NotFoundRoute handler={NotFound}/>
    </Route>
);

let store = require('./store/configure-store');

Router.run(routes, Router.HistoryLocation, (Handler, routerState) => { // note "routerState" here
    React.render(
        <div style={{height: '100%'}}>
            <Provider store={store}>
                {() => <Handler routerState={routerState}/>}
            </Provider>
        </div>
        ,
        app
    );
});
