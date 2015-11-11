console.log('Getting SC PID: ', process.env.SAUCE_CONNECT_PID );
var pid = process.env.SAUCE_CONNECT_PID.toString();
if (!pid) {
  console.error('No pid provided, so bailing');
  process.exit(1);
}

console.log('Now killing Sauce Connect - ', pid);
process.kill(pid);
console.log('Finished killing Sauce Connect');
