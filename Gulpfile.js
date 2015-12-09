var path = require('path');
var del = require('del');
var gulp = require('gulp');
var runSequence = require('run-sequence');

var webpack = require('webpack-stream');
var named = require('vinyl-named');

var tfx_extension_create = require('tfx-cli/_build/app/exec/extension/create');
var jsonTransform = require('gulp-json-transform');
var copy = require('gulp-copy');

var pkg = require('./package.json');

var fileTasks = {
  'sod-build-info:js': ['./sod-build-info/scripts/*.js'],
  'copy': [
    'images/**/*',
    'overview.md',
    'sod-main/**/*', 
    'sod-stop-sc/**/*', 
    'sod-build-info/**/*', 
    '!./sod-build-info/scripts/*.js',
    '!./sod-*/task.json'
  ]
};
gulp.task('clean', function() {
  return del([
    './dist/*'
  ]);
});

gulp.task('vss-extension', function() {
  return gulp.src('./vss-extension.json')
    .pipe(jsonTransform(function(data) {
      data.version = pkg.version;
      if (process.env.NODE_ENV !== 'production') {
        data.publisher = 'saucelabs-beta';
        data.public = false;
      }
      return data;
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('copy', function() {
  return gulp.src(fileTasks.copy)
    .pipe(copy('./dist'));
});

var fix_task_version = function(data) {
  var vsSplit = pkg.version.split('.');
  data.version.Major = vsSplit[0];
  data.version.Minor = vsSplit[1];
  data.version.Patch = vsSplit[2];
  return data;
};

gulp.task('sod-main-task', ['copy'], function() {
  return gulp.src('./sod-main/task.json')
    .pipe(jsonTransform(fix_task_version))
    .pipe(gulp.dest('./dist/sod-main/'));
});

gulp.task('sod-stop-sc', ['copy'], function() {
  return gulp.src('./sod-main/task.json')
    .pipe(jsonTransform(fix_task_version))
    .pipe(gulp.dest('./dist/sod-main/'));
});

gulp.task('sod-build-info:js', function() {
  return gulp.src(fileTasks['sod-build-info:js'])
    .pipe(named())
    .pipe(webpack({
      output: {
        libraryTarget: 'amd'
      },
      resolveLoader: {
        root: path.join(__dirname, 'node_modules')
      },
      module: {
        loaders: [
          { 
            test: /\.js$/, 
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
              presets: ['es2015']
            }
          },
          { test: /\.css$/, loader: 'style!css' }
        ]
      }
    }))
    .pipe(gulp.dest('dist/sod-build-info/scripts'));
});

gulp.task('package', function(cb) {
  //runSequence('clean', 'default', function() {
    var common = require('tfx-cli/_build/app/lib/common');
    var command = tfx_extension_create.getCommand([
      '--output-path', path.join(__dirname, 'Packages'),
      '--root', path.join(__dirname, 'dist')
    ]);
    common.EXEC_PATH = ['extension', 'create'];
    command.exec().then(function() {
      console.log('then', arguments);
      cb();
    }, function(reason) {
      console.error('Unable to create package because ', reason);
      cb(reason);
    });
  //});
});

gulp.task('watch', function() {
  Object.keys(fileTasks).forEach(function(key) {
    gulp.watch(fileTasks[key], [key]);
  });
});

// define tasks here
gulp.task('default', [
  'vss-extension',
  'copy',
  'sod-main-task',
  'sod-stop-sc',
  'sod-build-info:js'
], function(){
  // run tasks here
  // set up watch handlers here
});
