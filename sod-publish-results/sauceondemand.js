var fs = require('fs');
var tl = require('vso-task-lib');
var file = '/tmp/gavin.txt';

fs.writeFileSync(file, JSON.stringify({
  gavin: 'mogan'
}));

console.log('two task');
console.log('three task');
tl.command('task.addattachment', {
  type: 'SauceLabsBuildResult',
  name: 'buildresults'
}, file);

