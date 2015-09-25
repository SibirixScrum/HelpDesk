/*
 * Модель сообщения
 */

var mongoose = require('mongoose');
var collectionName = 'message';
var fileScheme = require('./file').scheme;

var messageSchema = new mongoose.Schema({
    date:   Date,   // Дата создания сообщения
    author: String, // Email автора
    text:   String, // Текст сообщения
    files:  [fileScheme] // Массив прикрепленных файлов
});

exports.scheme = messageSchema;
exports.model  = mongoose.model(collectionName, messageSchema);
