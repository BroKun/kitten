/**
 * 应用程序入口
 */

const log4js = require('log4js');
const kitten = require('./server');

const log = log4js.getLogger('index');
log.info('a sleeping kitten');

module.exports = kitten;
