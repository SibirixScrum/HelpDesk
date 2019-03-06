const {translate, i18n} = require('../i18n');

exports.onDrop = function(files) {
    const _filesConfig = APP.files;
    const newFiles = this.state.files;
    let filesError = false;
    files.forEach(function(file) {
        let ext = file.name.split('.')[file.name.split('.').length - 1];

        if (newFiles.length >= _filesConfig.maxCount) {
            filesError = translate('errors.file.length', {count: newFiles.length});
        } else if (file.size > _filesConfig.maxSize) {
            filesError = translate('errors.file.size', {count: Math.round(_filesConfig.maxSize / 1000000)});
        } else if (_filesConfig.extensions.indexOf(ext) === -1) {
            filesError = translate('errors.file.extension', {extension: _filesConfig.extensions.join(', ')});
        } else {
            newFiles.push(file)
        }
    });

    this.setState({files: newFiles, filesError, dragHover: false});

    if (filesError) this.props.showModal({text: filesError});
};