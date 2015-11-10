var path = require('path');
var fs = require('fs');

var BuildTaskUpload = require('tfx-cli/exec/build-tasks-upload');
var cnm = require('tfx-cli/lib/connection');
var am = require('tfx-cli/lib/auth');

var collectionUrl;
cnm.getCollectionUrl().then(function (url) {
  collectionUrl = url;
  return am.getCredentials(url, 'pat');
}).then(function(creds) {
  return new cnm.TfsConnection(collectionUrl, creds);
}).then(function(connection) {;
  var root_path = path.join(__dirname, '..');
  fs.readdir(root_path, function(err, files) {
    files.filter(function(file) {
      return /^sod-/.test(file);
    }).forEach(function(file) {
      fs.stat(file, function(err, stat) {
        if (stat.isDirectory()) {
          var command = BuildTaskUpload.getCommand();
          command.connection = connection;
          var options = {
            taskpath: path.join(root_path, file)
          };
          options.overwrite = true;
          command.exec([], options).then(function() {
            console.log('finished uploading ', file);
          }, function(reason) {
            console.error('Unable to upload', file, ' because ', reason);
          });
        }
      });
    });
  });
});
