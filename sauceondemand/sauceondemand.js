var tl = require('vso-task-lib');
//var npm = new tl.ToolRunner(tl.which('npm', true));

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

  return { url: hostUrl, password: password, username: user };
};

var credentials = getEndpointDetails('connectedServiceName');
//var browsers = tl.getInput('browsers');
//var sauceConnect = tl.getInput('sauceConnect');

tl.setVariable('SAUCE_USERNAME', credentials.username);
tl.setVariable('SAUCE_ACCESS_KEY', credentials.password);
tl.setVariable('SELENIUM_HOST', 'ondemand.saucelabs.com');
tl.setVariable('SELENIUM_PORT', '80');
