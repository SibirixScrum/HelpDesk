const i18n = require('../../libs/i18next');
const LanguageDetector = require('i18next-browser-languagedetector');
const intervalPlural = require('i18next-intervalplural-postprocessor');
const lang = require('./locale');

const projectCodeStart = `${APP.translateStartCode}.front`;

i18n
    .use(LanguageDetector)
    .use(intervalPlural)
    .init({
        resources: APP.lngData,
        fallbackLng: lang.fallbackLng,
        lowerCaseLng: true,
        preload: lang.locales,

        parseMissingKeyHandler: function(key, options) {
            const regex = /^(\w+\.\w+\.)/;

            if (regex.exec(key) !== null) {
                let resultKey = key.replace(regex, '');
                return i18n.t(resultKey, options);
            }

            return key;
        },

        detection: {
            caches: ['cookie']
        }
    });

exports.translate = (code, params) => {
    return i18n.t(`${projectCodeStart}.${code}`, params);
};

exports.translateWithoutCode = (code, params) => {
    return i18n.t(code, params);
};

exports.getCurLang = () => {
    const lang = i18n.language.split('-');
    return lang[0] !== void 0 ? lang[0] : i18n.language;
};

exports.i18n = i18n;