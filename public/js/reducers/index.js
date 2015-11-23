'use strict';
const { VisibilityFilters, SET_STATE } = require('../actions');
const ActionTypes = require('../constants/action-types');
const {combineReducers} = require('redux');

const tickets = require('./tickets');
const root = require('./root');

module.exports = combineReducers({root, tickets});