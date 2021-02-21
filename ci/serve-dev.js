/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-console */
const chalk = require('chalk')
const serverPort = 3089;

//https://github.com/thgh/rollup-plugin-serve
export default {
  port: serverPort,
  host: 'localhost',
  open: true,
  openPage: '/',
  contentBase: ['./example'],
  onListening: async function (server) {
    const connectionKey = server._connectionKey;
    const protocol = this.https ? 'https' : 'http';
    console.log(chalk.greenBright(`Server listening at ${protocol}://${this.host}:${this.port}/`),chalk.blueBright(connectionKey));
  },
};
