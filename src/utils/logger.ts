import * as log4js from 'log4js';

log4js.configure({
  appenders: {
    system: { type: 'file', filename: 'log/system.log' },
    console: { type: 'console' },
  },
  categories: {
    default: { appenders: ['system', 'console'], level: 'all' },
  },
});
const Logger = log4js.getLogger('access');

export default Logger;
