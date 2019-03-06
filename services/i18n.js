const locale = require('../config/locale');
const userModel = require('../models/user');

/**
 * Internationalization
 */
let i18nObj = {};

class i18n {
    constructor() {
        this.language = locale.defaultLanguage;
        this.translator = global.defaultTranslator;
        this.i18n = {};
    }

    setConfig(params) {
        this.language = params.language;
        this.i18n = params.i18n;
        this.translator = this.getFixedT(params.language);
    }

    getTranslatorForUser(user) {
        return this.getFixedT(user.lng);
    }

    getTranslatorForEmail(email) {
        let userTranslator = this.translator;

        userModel.model.find({email: email}, (err, data) => {
            if (data && data.length) {
                userTranslator = this.getTranslatorForUser(data[0]);
            }
        });

        return userTranslator;
    }

    getFixedT(lng) {
        return this.i18n.getFixedT(lng);
    }


    /**
     *
     * @param projects
     * @returns {*}
     */
    translateProjects(projects) {
        return projects;
    }
}

exports.i18n = i18n;
