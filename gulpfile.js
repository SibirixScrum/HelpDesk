var browserify = require('browserify');
var gulp       = require('gulp');
var source     = require('vinyl-source-stream');
var reload     = require('gulp-livereload');
var notify     = require('gulp-notify');
var gaze       = require('gaze');
var babelify   = require('babelify');
var reactify   = require('reactify');
var envify     = require('envify');
var minify = require('minify-stream');

const prefix      = require('gulp-autoprefixer');
const csso        = require('gulp-csso');
const less        = require('gulp-less');

gulp.task('browserify', function() {
    var b = browserify();

    b.transform(envify, {'global': true, '_': 'purge', NODE_ENV: 'production'});
    b.transform(reactify);
    b.transform(babelify);
    b.add('./public/js/application.js');
    return b.bundle()
        .on('error', notify.onError(function(err) {
            return err.toString()
        }))
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./public/js/'));
});

gulp.task('less', function () {
    return gulp.src('./public/css/style.less')
        .pipe(less({
            javascriptEnabled: true
        }))
        .pipe(prefix('last 3 versions'))
        .pipe(csso({
            restructure: false
        }))
        .pipe(gulp.dest('./public/css/'))
});

gulp.task('watch', ['browserify', 'less'], function() {
    gaze(['public/js/**/*.js', '!public/js/bundle.js'], function() {
        this.on('added', function() {
            gulp.start('browserify');
        });
        this.on('changed', function() {
            gulp.start('browserify');
        })
    });

    gaze('public/css/**/*.less', function() {
        this.on('all', function(event, filepath) {
            gulp.start('less');
        });
    });
});

gulp.task('default', ['watch']);
