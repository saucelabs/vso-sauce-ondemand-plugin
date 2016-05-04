var fs = require('fs');
var tl = require('vso-task-lib');

fs.writeFileSync('gavin.txt', JSON.stringify({
  gavin: 'mogan'
}));

console.log('two task');
console.log('three task');
tl.command('addattachment', {
  type: 'SauceLabs:BuildResult',
  name: 'buildresults'
}, 'gavin.txt');

