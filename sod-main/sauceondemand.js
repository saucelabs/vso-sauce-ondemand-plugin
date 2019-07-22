/* global Promise */
var tl = require('vsts-task-lib');
var fs = require('fs');
var path = require('path');
var https = require('https');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;

var version = require('./task.json').version;
version = [version.Major, version.Minor, version.Patch].join('.');

var publishStats = function publishStats(credentials) {
  console.log('starting publish');
  var req = https.request({
    host: 'saucelabs.com',
    port: 443,
    path: '/rest/v1/stats/ci',
    method: 'POST',
    auth: credentials.username + ':' + credentials.password,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'VSTS/' + version
    }
  }, function(res) {
    console.log('publishStats: statusCode: ', res.statusCode);
  });
  req.write(JSON.stringify({
    platform: 'VSTS',
    platform_version: version
  }));
  req.end();
  req.on('error', function (e) {
    console.error('publishStats', e);
  });
};

var main = function main(cb) {
  // The endpoint stores the auth details as JSON. Unfortunately the structure of the JSON has changed through time, namely the keys were sometimes upper-case.
  // To work around this, we can perform case insensitive checks in the property dictionary of the object. Note that the PowerShell implementation does not suffer from this problem.
  // See https://github.com/Microsoft/vso-agent/blob/bbabbcab3f96ef0cfdbae5ef8237f9832bef5e9a/src/agent/plugins/release/artifact/jenkinsArtifact.ts for a similar implementation
  var getAuthParameter = function getAuthParameter(endpoint, paramName) {

    var paramValue = null;
    var auth = tl.getEndpointAuthorization(endpoint, false);

    if (auth.scheme !== 'UsernamePassword') {
      throw new Error('The authorization scheme ' + auth.scheme + ' is not supported for a SonarQube endpoint. Please use a username and a password.');
    }

    var parameters = Object.getOwnPropertyNames(auth['parameters']);

    var keyName;
    parameters.some(function (key) {

      if (key.toLowerCase() === paramName.toLowerCase()) {
        keyName = key;

        return true;
      }
    });

    paramValue = auth['parameters'][keyName];

    return paramValue;
  };

  var getEndpointDetails = function getEndpointDetails(endpointInputFieldName) {
    var errorMessage = 'Could not decode the credentials endpoint. Please ensure you are running the latest agent (min version 0.3.0)';
    if (!tl.getEndpointUrl) {
      throw new Error(errorMessage);
    }

    var genericEndpoint = tl.getInput(endpointInputFieldName);
    if (!genericEndpoint) {
      throw new Error(errorMessage);
    }

    var hostUrl = tl.getInput('endpointUrl') || tl.getEndpointUrl(genericEndpoint, false);
    var password = tl.getInput('endpointAuthToken') || getAuthParameter(genericEndpoint, 'password');
    var user = tl.getInput('endpointUsername') || getAuthParameter(genericEndpoint, 'username');
    var datacenter = tl.getInput('endpointDatacenter') || getAuthParameter(genericEndpoint, 'datacenter');

    return { url: hostUrl, password: password, username: user, datacenter: datacenter };
  };

  var credentials = getEndpointDetails('connectedServiceName');
  //var browsers = tl.getInput('browsers');
  //var sauceConnect = tl.getInput('sauceConnect');
  tl.setVariable('SAUCE_USERNAME', credentials.username);
  tl.setVariable('SAUCE_ACCESS_KEY', credentials.password), true;
  tl.setVariable('SAUCE_REST_ENDPOINT', 'saucelabs.com');
  tl.setVariable('SELENIUM_HOST', 'ondemand.saucelabs.com');
  if (credentials.datacenter && credentials.datacenter !== 'us-west-1') {
    tl.setVariable('SAUCE_REST_ENDPOINT', `${credentials.datacenter}.saucelabs.com`);
    tl.setVariable('SELENIUM_HOST', `ondemand.${credentials.datacenter}.saucelabs.com`);
  }
  tl.setVariable('SELENIUM_PORT', '80');
  tl.setVariable('SAUCE_BUILD_NAME', [
    tl.getVariable('BUILD_DEFINITIONNAME'),
    tl.getVariable('BUILD_BUILDID')
  ].join('_').replace(/ /g, '_'));
  cb(credentials);
};

var startSC = function startSC(credentials, resolve, sauceConnectOptions) {

  var self_path = __dirname;
  var binaries_path = path.join(self_path, 'binaries');

  // arch = 'arm', 'ia32', or 'x64'.
  var arch = process.arch;
  if (arch === 'ia32') { arch = '32'; }
  else if (arch === 'x64') { arch = ''; }

  // platform = 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
  var platform = process.platform;
  if (platform === 'darwin') { platform = 'osx'; }
  // if win32, the 32 from arch is redundant and will mess up the regex
  if (platform === 'win32') { arch = ''; }

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

  var sc_path_bin = path.join(binaries_path, 'sc-' + version + '-' + platform + arch, 'bin', (process.platform === 'win32' ? 'sc.exe' : 'sc'));
  fs.chmodSync(sc_path_bin, '0755');

  console.log('Running sauce connect: ', sc_path_bin);


  var pid_path = path.join((process.env.BUILD_STAGINGDIRECTORY || self_path), 'sc.pid');
  tl.setVariable('SAUCE_CONNECT_PID_PATH', pid_path);
  console.log('Setting PID path', pid_path);

  var sc_bin = spawn(
    sc_path_bin,
    [
      '-u', credentials.username,
      '-k', credentials.password,
      '-d', pid_path
    ].concat(sauceConnectOptions.split(' ')),
    {
      detached: true,
      cwd: self_path
    }
  );

  console.log('setting variable');
  tl.setVariable('SAUCE_CONNECT_PID', 'pid_' + sc_bin.pid);

  var lineEmitter = new EventEmitter();
  lineEmitter.on('stdout', function(line) {
    if (/Sauce Connect is up, you may start your tests/.test(line)) {
      return resolve();
    }
    console.log(line.toString());
  });
  lineEmitter.on('stderr', function(line) {
    console.error(line.toString());
  });

  var dataHolders = {};
  ['stdout', 'stderr'].forEach(function(channel) {
    dataHolders[channel] = [];
    sc_bin[channel].on('data', function (data) {
      data.toString().split('').forEach(function(char) {
        if (char === '\n' || char === '\r') {
          if (dataHolders[channel].length !== 0) {
            lineEmitter.emit(channel, dataHolders[channel].join(''));
            dataHolders[channel] = [];
          }
          return;
        }
        dataHolders[channel].push(char);
      });
    });
  });

  sc_bin.on('close', function(code) {
    return process.exit(code);
  });
};


main(function(credentials) {
  publishStats(credentials);

  var shouldSauceConnect = JSON.parse(tl.getInput('sauceConnect'));
  var sauceConnectOptions = tl.getInput('sauceConnectOptions');
  if (sauceConnectOptions === null) {
    console.log('sauceConnectOptions was null')
    sauceConnectOptions = '';
  }
  new Promise(function(resolve) {
    if ( shouldSauceConnect ) {
      startSC(credentials, resolve, sauceConnectOptions);
    } else {
      resolve(true);
    }
  }).then(function(skipSauceConnect) {
    var data = [
      'SAUCE_USERNAME',
      'SAUCE_REST_ENDPOINT',
      'SELENIUM_PORT',
      'SELENIUM_HOST',
      'SAUCE_BUILD_NAME',
      'SAUCE_CONNECT_PID_PATH',
      'SAUCE_CONNECT_PID'
    ].filter(function(key) {
      if (skipSauceConnect) {
        /* remove sauce connect variables if skipping sauce connect */
        return !/^SAUCE_CONNECT_/.test(key);
      } else {
        return true;
      }
    }).reduce(function (ret, key) {
      ret[key] = tl.getVariable(key);
      return ret;
    }, {});
    data.CONNECTED_SERVICE_NAME = tl.getInput('connectedServiceName');
    fs.writeFileSync('saucelabs.json', JSON.stringify(data));
    tl.command('task.addattachment', { type: 'SauceLabsBuildResult', name: 'buildresults' }, path.resolve('saucelabs.json'));
    return true;
  }).then(function() {
    console.log('all started');
    process.exit(0); // SUCCESS
  }).catch(function(err) {
    console.log('error starting', err);
    throw err;
  });

});
