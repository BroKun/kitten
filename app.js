'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const log4js = require('log4js');

// 读取配置信息
let config = {
  env: process.env.NODE_ENV || 'dev',
  rootDir: __dirname,
};
try {
  config = yaml.safeLoad(fs.readFileSync(`config/${config.env}.yml`, 'utf8'));
} catch (e) {
  config = null;
  console.error('Could not load config file, error was: ', e);
  process.exit(1);
}
if (!fs.existsSync(path.join('log'))) {
  try {
    fs.mkdirSync(path.join('log'));
  } catch (e) {
    console.error('Could not set up log directory, error was: ', e);
    process.exit(1);
  }
}

log4js.configure(path.join('./log.json'));
if (process.env.NODE_ENV === 'unit-test') {
  log4js.setGlobalLogLevel(log4js.levels.ERROR);
}
const log = log4js.getLogger('app');

if (!fs.existsSync(path.join(config.commonFilePath))) {
  try {
    fs.mkdirSync(path.join(config.commonFilePath));
  } catch (e) {
    console.error('Could not set up commonFilePath directory, error was: ', e);
    process.exit(1);
  }
}
log.info(`commonFilePath：${path.join(config.commonFilePath)}`);
let server = null;
if (config) {
  const kitten = require('./src/index');// 启动控制器
  kitten.config = config;
  server = kitten.start();
}
module.exports = server;
