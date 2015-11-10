var tl = require('vso-task-lib');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var self_path = __dirname;
var binaries_path = path.join(self_path, 'binaries');

// arch = 'arm', 'ia32', or 'x64'.
var arch = process.arch;
if (arch === 'ia32') { arch = '32'; }
else if (arch === 'x64') { arch = ''; }

// platform = 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
var platform = process.platform;
if (platform === 'darwin') { platform = 'osx'; }

var regex = new RegExp('sc-([0-9.]+)-' + platform + arch + '$');
console.log('looking for sc archive files');
var files = fs.readdirSync(binaries_path).filter(function(filename) {
  return regex.exec(filename) !== null;
});
console.log('found ones that match', files);

if (files.length !== 1) {
  console.error(process.platform + '/' + process.arch + ' is not a supported platform');
  process.exit(1);
}
var version = regex.exec(files[0])[1];

var sc_path_bin = path.join(binaries_path, 'sc-' + version + '-' + platform + arch, 'bin', 'sc');
fs.chmodSync(sc_path_bin, '0755');

console.log('Running sauce connect: ', sc_path_bin);

process.env.SAUCE_CONNECT_PID_PATH = path.join((process.env.BUILD_STAGINGDIRECTORY || self_path), 'sc.pid');
tl.setVariable('SAUCE_CONNECT_PID_PATH', process.env.SAUCE_CONNECT_PID_PATH);
console.log('Setting PID path', process.env.SAUCE_CONNECT_PID_PATH );

var sc_bin = spawn(
  sc_path_bin,
  [
    '-u', process.env.SAUCE_USERNAME,
    '-k', process.env.SAUCE_ACCESS_KEY,
    '-d', process.env.SAUCE_CONNECT_PID_PATH
  ],
  {
    detached: true,
    cwd: self_path
  }
);
sc_bin.stdout.on('data', function (data) {
  if (/Sauce Connect is up, you may start your tests/.test(data)) {
    process.exit(0); // SUCCESS
  }
  console.log(data.toString());
});

sc_bin.stderr.on('data', function (data) {
  console.log(data.toString());
});

sc_bin.on('close', function(code) {
  process.exit(code);
});
