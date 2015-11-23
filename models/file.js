/*
 * Модель файлов
 */

var mongoose = require('mongoose');
var crypto = require('crypto');
var fs = require('fs');
var pathModule = require('path');
var collectionName = 'file';

var fileSchema = new mongoose.Schema({
    name: String,  // Выводимое имя
    path: String   // Путь на сервере для скачивания
});

fileSchema.methods.toAttach = function() {
    return {
        filename: this.name,
        content: fs.readFileSync(global.config.appRoot + 'public' + this.path)
    };
};

exports.scheme = fileSchema;
exports.model  = mongoose.model(collectionName, fileSchema);

/**
 * Почистить загруженные файлы за собой
 * @param fileArray
 */
exports.cleanupFiles = function(fileArray) {
    if (!(typeof fileArray == 'object') || (!fileArray.length)) return;
    for (var i = 0; i < fileArray.length; i++) {
        if (fileArray[i].path) fs.unlink(fileArray[i].path);
    }
};

/**
 * Фильтрация входящих файлов по расширению
 * @param req
 * @param file
 * @param cb
 */
exports.fileFilter = function(req, file, cb) {
    var exts = global.config.files.extensions;
    var ext = pathModule.extname(file.originalname).toLowerCase();
    if (ext[0] == '.') {
        ext = ext.substr(1);
    }

    if (exts.indexOf(ext) > -1) {
        cb(null, true);
    } else {
        cb(new Error('Wrong extension, ' + file.originalname));
    }
};

/**
 *
 * @param ticketNumber
 * @param reqFiles
 * @param key
 * @returns {Array}
 */
exports.proceedUploads = function(ticketNumber, reqFiles, key) {
    var shasum = crypto.createHash('sha1');
    shasum.update(ticketNumber);
    var shortPath = '/tickets/' + shasum.digest('hex') + '/';
    var path = global.config.appRoot + 'public' + shortPath;

    try { fs.mkdirSync(path); } catch(e) { }

    var files = [];
    if (reqFiles && reqFiles[key] && reqFiles[key].length) {
        for (var i = 0; i < reqFiles[key].length; i++) {
            var file = reqFiles[key][i];
            var ext = pathModule.extname(file.originalname);
            var newName = Math.random().toString(36).slice(-8) + ext;

            if (file.path) {
                fs.renameSync(file.path, path + newName);
            } else if (file.buffer) {
                fs.writeFileSync(path + newName, file.buffer);
            }

            var fileObj = new this.model({
                name: file.originalname,
                path: shortPath + newName
            });
            files.push(fileObj);
        }
    }

    return files;
};

exports.proceedMailAttachments = function(ticketNumber, attachments) {
    var shasum = crypto.createHash('sha1');
    shasum.update(ticketNumber);
    var shortPath = '/tickets/' + shasum.digest('hex') + '/';
    var path = global.config.appRoot + 'public' + shortPath;

    try { fs.mkdirSync(path); } catch(e) { }

    var files = [];
    if (attachments && attachments.length) {
        var added = 0;
        for (var i = 0; i < attachments.length && added < global.config.files.maxCount; i++) {
            var file = attachments[i];

            if (file.length > global.config.files.maxSize) {
                continue;
            }

            added++;
            var ext = pathModule.extname(file.fileName);
            var newName = Math.random().toString(36).slice(-8) + ext;

            fs.writeFile(path + newName, file.content);

            var fileObj = new this.model({
                name: file.fileName,
                path: shortPath + newName
            });
            files.push(fileObj);
        }
    }

    return files;
};
