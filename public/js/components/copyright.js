/*** @jsx React.DOM */

const React = require('react');
const {translate, i18n} = require('../i18n');

const Copyright = React.createClass({
    render() {
        return (
            <div className="sibirix" dangerouslySetInnerHTML={{__html: translate('copyright')}}/>
        )
    }
});

module.exports = Copyright;
