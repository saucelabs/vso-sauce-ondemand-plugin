var fs = require('fs');

console.log('Getting PID path', process.env.SAUCE_CONNECT_PID_PATH );
var pid_file = process.env.SAUCE_CONNECT_PID_PATH;
if (!pid_file) {
  console.error('No pid file exists');
  process.exit(1);
}

if (!fs.existsSync(pid_file)) {
  console.error('Pid file does not exist', pid_file);
  process.exit(1);
}

var pid = fs.readFileSync(pid_file);

console.log('Now killing Sauce Connect - ', pid);
process.kill(pid);
console.log('Finished killing Sauce Connect');
