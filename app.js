/**
 * 应用程序入口
 */

const fs = require('fs');
const path = require('path')
const yaml = require('js-yaml');
const log4js = require('log4js');

//读取配置信息
let config = null;
console.log(process.env.NODE_ENV);
try {
  config = yaml.safeLoad(fs.readFileSync(`${global.rootDir}/config.yml`, 'utf8'));
} catch (e) {
  config = null;
  console.error('Could not load config file, error was: ', e);
  process.exit(1);
}
if (!fs.existsSync(path.join(global.rootDir, 'log'))) {
  try {
    fs.mkdirSync(path.join(global.rootDir, 'log'));
  } catch (e) {
    console.error('Could not set up log directory, error was: ', e);
    process.exit(1);
  }
}

log4js.configure(`${global.rootDir}/log.json`);
if (process.env.NODE_ENV === 'unit-test') {
  log4js.setGlobalLogLevel(log4js.levels.ERROR);
}
const log = log4js.getLogger('app');

if (!fs.existsSync(path.join(global.rootDir, config.commonFilePath))) {
  try {
    fs.mkdirSync(path.join(global.rootDir, config.commonFilePath));
  } catch (e) {
    console.error('Could not set up commonFilePath directory, error was: ', e);
    process.exit(1);
  }
}
log.info(`commonFilePath：${path.join(global.rootDir, config.commonFilePath)}`);

if (config) {
  config.env = config.env || {};
  config.env.mode = process.env.NODE_ENV || config.env.mode || 'development';
  global.config = config;//配置作为全局信息global.config
  log.info(`Run Mode : ${global.config.env.mode}`);

  koala = require('./src/index');//启动控制器

  server = koala();
}
module.exports = server;
