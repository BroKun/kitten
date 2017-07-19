
'use strict';

const Builder = require('./src/builder');// 启动控制器

// 读取配置信息
const config = {
  rootDir: __dirname,
  NODE_ENV: process.env.NODE_ENV || 'dev',
  SERVER_ENV: process.env.NODE_ENV || 'dev',
};

const builder = new Builder(config);
builder.start();
const httpServer = builder.getHttpServer();

module.exports = httpServer;
