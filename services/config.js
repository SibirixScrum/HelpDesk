
class Config {
    constructor() {
        this.config = global.config;
        this.projectsList = this.config.projects;
    }

    /**
     * Валидация конфига
     * @returns {boolean}
     */
    validate() {
        if (!this.projectsList || !this.projectsList.length) {
            throw "No projects in config";
        }

        let responsibles = {};
        const colorLength = this.config.projectColors.length;

        projectsList.forEach((current, index) => {
            current.color = '#' + this.config.projectColors[index % colorLength];

            if (!current.code || !current.name || !current.domain || !current.responsible) {
                throw "Projects config are invalid! Required fields: code, name, domain, responsible.";
            }
        });

        return true;
    }
}