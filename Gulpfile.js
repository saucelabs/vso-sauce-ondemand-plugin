var path = require('path');
var del = require('del');
var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.tfx_extension_create = require('tfx-cli/_build/app/exec/extension/create');
gulp.tfx_extension_publish = require('tfx-cli/_build/app/exec/extension/publish');
gulp.jsonTransform = require('gulp-json-transform');
gulp.copy = require('gulp-copy');

var pkg = require('./package.json');

gulp.task('clean', function() {
  return del([
    './dist/*'
  ]);
});

gulp.task('vss-extension', function() {
  return gulp.src('./vss-extension.json')
    .pipe(gulp.jsonTransform(function(data) {
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
  return gulp.src(['./images/**/*', 'overview.md', 'sod-main/**/*', 'sod-stop-sc/**/*'])
    .pipe(gulp.copy('./dist'));
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
    .pipe(gulp.jsonTransform(fix_task_version))
    .pipe(gulp.dest('./dist/sod-main/'));
});

gulp.task('sod-stop-sc', ['copy'], function() {
  return gulp.src('./sod-main/task.json')
    .pipe(gulp.jsonTransform(fix_task_version))
    .pipe(gulp.dest('./dist/sod-main/'));
});

gulp.task('package', function(cb) {
  runSequence('clean', 'default', function() {
    var common = require('tfx-cli/_build/app/lib/common');
    var command = gulp.tfx_extension_create.getCommand([
      '--output-path', path.join(__dirname, 'Packages'),
      '--root', path.join(__dirname, 'dist')
    ]);
    common.EXEC_PATH = ['extension', 'create'];
    command.exec().then(function() {
      console.log('then', arguments);
      cb();
    }, function(reason) {
      console.error('Unable to upload because ', reason);
      cb(reason);
    });
  });
});

// define tasks here
gulp.task('default', [
  'vss-extension',
  'copy',
  'sod-main-task',
  'sod-stop-sc'
], function(){
  // run tasks here
  // set up watch handlers here
});
