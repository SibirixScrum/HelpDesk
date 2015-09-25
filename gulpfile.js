var browserify = require('browserify');
var gulp       = require('gulp');
var source     = require("vinyl-source-stream");
var reload     = require('gulp-livereload');
var notify     = require('gulp-notify');
var gaze       = require('gaze');
var babelify   = require('babelify');
var reactify   = require('reactify');

gulp.task('browserify', function() {
    var b = browserify();
    b.transform(reactify);
    b.transform(babelify);
    b.transform({global: true}, 'uglifyify');
    b.add('./public/js/application.js');
    return b.bundle()
        .on('error', notify.onError(function(err) {
            return err.toString()
        }))
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public/js/'))
        .pipe(reload());
});

gulp.task('watch', ['browserify'], function() {
    gaze(['public/js/**/*.js', '!public/js/bundle.js'], function() {
        this.on('added', function() {
            gulp.start('browserify');
        });
        this.on('changed', function() {
            gulp.start('browserify');
        })
    });

    reload.listen();
});

gulp.task('default', ['watch']);
