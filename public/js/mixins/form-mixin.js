const extend  = require('extend');
const React = require('react');

const _emailRegexp = /^[^@]+@[^.]+(\.[0-9a-z]{2,})+$/i;

module.exports = {
    validateForm(fieldsProps = false) {
        let errors  = this.state.errors;
        let isValid = true;
        let firstInvalid = false;
        let fields = fieldsProps !== false ? fieldsProps : this.state.form;

        for (let field in fields) {
            if (fields.hasOwnProperty(field)) {
                let value = fields[field];
                if (!value.trim()) {
                    isValid             = false;
                    errors[field].empty = true;

                    if (!firstInvalid) firstInvalid = field;
                } else if (field == 'email' && !_emailRegexp.test(value)) {
                    isValid = false;
                    errors[field].emailInvalid = true;

                    if (!firstInvalid) firstInvalid = field;
                }
            }
        }

        this.setState({errors});
        if (!isValid) {
            if (firstInvalid == 'text') {
                this.tiny.focus();
            } else {
                React.findDOMNode(this.refs[firstInvalid]).focus();
            }
        }

        return isValid;
    },

    onFieldChange(field) {
        let state    = {};
        let val      = field === 'text' ? this.tiny.getContent() : this.refs[field].getDOMNode().value;
        let errors   = this.state.errors;
        state[field] = field === 'email' ? val.toLowerCase() : val;

        if (val && (field != 'email' || _emailRegexp.test(val))) {
            for (let error in errors[field]) {
                errors[field][error] = false;
            }
        }

        this.setState({form: extend(this.state.form, state), errors});
    },

    getClassName(field) {
        let isValid = true;

        for (let err in this.state.errors[field]) {
            if (this.state.errors[field][err]) {
                isValid = false;
            }
        }

        return isValid ? '' : 'error';
    }
};
