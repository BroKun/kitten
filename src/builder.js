'use strict';
const Koa = require('koa2');
const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const yaml = require('js-yaml');
const Redis = require('ioredis');
const dynamicService = require('./common/dynamicAPI');
const startKoa = require('./server');

const log = log4js.getLogger('builder');

function folderIntegrity(path, describe) {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      log.error(`Folder incomplete, path=${path}, describe:${describe}`, e);
      process.exit(1);
    }
  }
}

class Builder {
  constructor(config) {
    this.config = config;
    this.app = new Koa();
    this.app.config = this.config;
    this.httpServer = null;
    global.app = this.app;
    global.app.config = this.config;
  }
  loadLogger() {
    log4js.configure(`${this.config.rootDir}/log.json`);
    if (process.env.NODE_ENV === 'test') {
      log4js.setGlobalLogLevel(log4js.levels.ERROR);
    }
    return this;
  }

  loadConfiguration() {
    try {
      const config = yaml.safeLoad(fs.readFileSync(`${this.config.rootDir}/config/${this.config.NODE_ENV}.yml`, 'utf8'));
      this.config = Object.assign(this.app.config, config);
      console.log('NODE_ENV:', this.config.NODE_ENV);
      console.log('SERVER_ENV:', this.config.SERVER_ENV);
      console.log('页面:', this.config.viewPath);
      console.log('服务:', this.config.servicePath);
      console.log('文件:', this.config.commonFilePath);
    } catch (e) {
      log.error('Could not load config file, error was: ', e);
      process.exit(1);
    }
    return this;
  }
  beSureFoldersComplete() {
    folderIntegrity(path.join(this.config.rootDir, 'config'));
    folderIntegrity(path.join(this.config.rootDir, 'log'));
    folderIntegrity(path.join(this.config.rootDir, this.config.commonFilePath));
    return this;
  }
  loadRedisClient() {
    if (!this.config.redisStore) {
      return this;
    }
    if (this.config.redisStore.redis) {
      this.app.redisClient = new Redis(this.config.redisStore.redis);
    }
    if (this.config.redisStore.cluster) {
      this.app.redisClient = new Redis.Cluster(this.config.redisStore.cluster);
    }
    global.redis = this.app.redisClient;
    return this;
  }
  initServer() {
    this.httpServer = startKoa(this.app, this.config);
  }
  loadService() {
    dynamicService.loadService();
    return this;
  }
  start() {
    this
      .loadLogger()
      .loadConfiguration()
      .beSureFoldersComplete()
      .loadRedisClient()
      .loadService()
      .initServer();
  }
  getHttpServer() {
    return this.httpServer;
  }
}

module.exports = Builder;
