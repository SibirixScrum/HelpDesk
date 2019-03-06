let projectModel = require('../models/project');

let currentProjectCode = 'default';

/**
 * Получение стартовой строки для проекта
 * @returns {string}
 */
exports.getStartCode = () => `projects.${currentProjectCode}`;
/**
 * Получение строки заголовка для перевода
 * @returns {string}
 */
exports.getTitleCode = () => `${this.getStartCode()}.title`;

/**
 * Устанавливаем код текущего проекта
 * @param projectCode
 * @returns {string}
 */
exports.setCurrentProjectCode = (projectCode) => currentProjectCode = projectCode.toLowerCase();

/**
 * Устанавливаем код текущего проекта по домену
 * @param domain
 */
exports.setCurrentProjectByDomain = (domain) => {
    const project = projectModel.getProjectByDomain(domain);

    if (project.code !== void 0) {
        this.setCurrentProjectCode(project.code);
    }
};
