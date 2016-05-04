var path = require('path');
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');

var runSequence = require('run-sequence');

var webpack = require('webpack-stream');
var named = require('vinyl-named');

var tfx_extension_create = require('tfx-cli/_build/app/exec/extension/create');
var jsonTransform = require('gulp-json-transform');
var copy = require('gulp-copy');
var jsonlint = require('gulp-jsonlint');

var pkg = require('./package.json');

var myCustomJsonLintReporter = function (file) { gutil.log('File ' + file.path + ' is not valid JSON.'); };

var fileTasks = {
  'sod-build-info:js': ['./sod-build-info/scripts/*.js'],
  'copy': [
    'images/**/*',
    'overview.md',
    'sod-main/**/*',
    'sod-publish-results/**/*',
    'sod-stop-sc/**/*',
    'sod-build-info/**/*',
    '!./sod-build-info/scripts/*.js',
    '!./sod-*/task.json'
  ],
  'copy:vss-web-extension-sdk': [
    'node_modules/vss-web-extension-sdk/lib/VSS.SDK.*js'
  ]
};
gulp.task('clean', function() {
  return del([
    './dist/*'
  ]);
});

gulp.task('vss-extension', function() {
  return gulp.src('./vss-extension.json')
  .pipe(jsonlint())
  .pipe(jsonlint.reporter(myCustomJsonLintReporter))
  .pipe(jsonlint.failOnError())
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

gulp.task('copy', ['copy:vss-web-extension-sdk'], function() {
  return gulp.src(fileTasks.copy)
  .pipe(copy('./dist'));
});

gulp.task('copy:vss-web-extension-sdk', function() {
  gulp.src(fileTasks['copy:vss-web-extension-sdk'])
  .pipe(gulp.dest('./dist/lib'));
});

var fix_task_version = function(data) {
  var vsSplit = pkg.version.split('.');
  data.version.Major = vsSplit[0];
  data.version.Minor = vsSplit[1];
  data.version.Patch = vsSplit[2];
  return data;
};

var handle_task = function(task_name) {
  return gulp.src('./' + task_name + '/task.json')
    .pipe(jsonlint())
    .pipe(jsonlint.reporter(myCustomJsonLintReporter))
    .pipe(jsonlint.failOnError())
    .pipe(jsonTransform(fix_task_version))
    .pipe(gulp.dest('./dist/' + task_name + '/'));
};

gulp.task('sod-main', ['copy'], function() {
  return handle_task('sod-main');
});

gulp.task('sod-stop-sc', ['copy'], function() {
  return handle_task('sod-stop-sc');
});

gulp.task('sod-publish-results', ['copy'], function() {
  return handle_task('sod-publish-results');
});

gulp.task('sod-build-info:js', function() {
  return gulp.src(fileTasks['sod-build-info:js'])
  .pipe(named())
  .pipe(webpack({
    devtool: '#inline-source-map',
    output: {
      libraryTarget: 'amd'
    },
    resolveLoader: {
      root: path.join(__dirname, 'node_modules')
    },
    externals: [
      'VSS/Controls', 'VSS/Service',
      'TFS/Build/Contracts', 'TFS/Build/ExtensionContracts'
    ],
    /*externals: {
    "vss-web-extension-sdk/lib/VSS.SDK.js": "VSS"
    },*/
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
  runSequence('clean', 'default', function() {
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
  });
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
  'sod-main',
  'sod-stop-sc',
  'sod-publish-results',
  'sod-build-info:js'
], function(){ });
