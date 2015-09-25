const {compose, createStore, applyMiddleware } = require('redux');
const {devTools, persistState} = require('redux-devtools');
const reduxThunk = require('redux-thunk');

const rootReducers = require('../reducers');

//let store = createStore(rootReducers);
//const createStoreWithMiddleWare = applyMiddleware(reduxThunk)(createStore);

const finalCreateStore = compose(
    // Enables your middleware:
    applyMiddleware(reduxThunk)
)(createStore);

module.exports = finalCreateStore(rootReducers);
//module.exports = createStoreWithMiddleWare(rootReducers);