console.log('Getting SC PID: ', process.env.SAUCE_CONNECT_PID );
var pid = process.env.SAUCE_CONNECT_PID;
if (!pid) {
  console.log('Unable to shut down sauce connect as no pid file was provided (Was it started?)');
  process.exit(0);
}
pid = pid.toString();

console.log('Now killing Sauce Connect - ', pid);
process.kill(pid);
console.log('Finished killing Sauce Connect');
