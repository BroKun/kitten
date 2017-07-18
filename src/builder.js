'use strict';
const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const yaml = require('js-yaml');

function folderIntegrity(path, describe) {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      console.error(`Folder incomplete, path=${path}, describe:${describe}`, e);
      process.exit(1);
    }
  }
}

class Builder {
  constructor(app) {
    this.app = app;
  }
  static loadLogger(config) {
    log4js.configure(`${config.rootDir}/log.json`);
    if (process.env.NODE_ENV === 'test') {
      log4js.setGlobalLogLevel(log4js.levels.ERROR);
    }
  }
  beSureFoldersComplete() {
    folderIntegrity(path.join(this.app.config.rootDir, 'config'));
    folderIntegrity(path.join(this.app.config.rootDir, 'log'));
  }
  loadConfig() {
    try {
      const config = yaml.safeLoad(fs.readFileSync(`${this.app.config.rootDir}/config/${this.app.config.NODE_ENV}.yml`, 'utf8'));
      this.app.config = Object.assign(this.app.config, config);
    } catch (e) {
      console.error('Could not load config file, error was: ', e);
      process.exit(1);
    }
  }
}

module.exports = Builder;
