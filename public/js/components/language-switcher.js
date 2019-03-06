/*** @jsx React.DOM */

const React = require('react');
const lang = require('../locale');

const LanguageSwitcher = React.createClass({
    getInitialState() {
        return {
            lngs: lang.locales,
        }
    },

    onLanguageChanged(e) {
        this.props.changeLanguage(e.target.value);
    },

    render() {
        return (
            <div className="language-switcher" onChange={this.onLanguageChanged}>
                <input id="lng-1"
                       type="radio"
                       name="lng"
                       value="en"
                       defaultChecked={this.props.lng === 'en'}

                />
                <label htmlFor="lng-1"><span>EN</span></label>
                <input id="lng-2"
                       type="radio"
                       name="lng"
                       value="ru"
                       defaultChecked={this.props.lng === 'ru'}
                />
                <label htmlFor="lng-2"><span>RU</span></label>
                <small />
            </div>
        )
    }
});

module.exports = LanguageSwitcher;
