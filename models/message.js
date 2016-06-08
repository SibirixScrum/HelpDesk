/*
 * Модель сообщения
 */

var mongoose = require('mongoose');
var collectionName = 'message';
var fileScheme = require('./file').scheme;

var messageSchema = new mongoose.Schema({
    date:   Date,   // Дата создания сообщения
    created: { type: Date, default: Date.now }, // Дата добавления сообщения в базу
    author: String, // Email автора
    text:   String, // Текст сообщения
    files:  [fileScheme] // Массив прикрепленных файлов
});

messageSchema.methods.getFilesForMail = function() {
    var attachments = [];

    if (this.files && this.files.length) {
        for (var i = 0; i < this.files.length; i++) {
            attachments.push(this.files[i].toAttach());
        }
    }

    return attachments;
};

exports.scheme = messageSchema;
exports.model  = mongoose.model(collectionName, messageSchema);
