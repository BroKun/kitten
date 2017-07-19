'use strict';
// const path = require('path');
const fs = require('fs');
const { ErrorRes, ServiceNote } = require('./base');
const log4js = require('log4js');
const path = require('path');

const log = log4js.getLogger('dynamicAPI');
function DynamicAPI() {
  // const self = this;

  /**
   * 比较版本号,当leftVersion大于rightVersion时返回true
   * @param {String} leftVersion 当前版本
   * @param {String} rightVersion 比较版本
   * @return {Boolean} 比较结果
   */
  const compareVersion = (leftVersion, rightVersion) => {
    const leftVersionCode = leftVersion.split('.');
    const rightVersionCode = rightVersion.split('.');
    if (leftVersionCode[0] - rightVersionCode > 0) {
      return true;
    }
    if (leftVersionCode[0] - rightVersionCode[0] < 0) {
      return false;
    }
    if (leftVersionCode[1] - rightVersionCode[1] > 0) {
      return true;
    }
    if (leftVersionCode[1] - rightVersionCode[1] < 0) {
      return false;
    }
    return true;
  };
  /**
   * 获取对应的服务,同时会将服务缓存在global.cacheServiceProvider中
   * @param {String} version 版本
   * @param {String} service 服务
   * @param {String} action 方法
   * @return {Object} 服务实例
   */
  const getService = (version, service, action) => {
    if (version.split('.').length === 3) {
      version = version.substring(0, version.lastIndexOf('.'));
    }
    const key = `${version}:${service}:${action}`;
    if (global.cacheServiceProvider && global.cacheServiceProvider[key]) {
      log.info(`hit cache service:${key}`);
      return global.cacheServiceProvider[key];
    }
    let result = null;
    for (let j = global.serviceProvider.length - 1; j >= 0; j--) {
      const sp = global.serviceProvider[j];
      const serviceList = sp.serviceList;
      if (version === 'latest' || sp.version === version) { // 版本一致并且存在这个方法
        for (let i = serviceList.length - 1; i >= 0; i--) {
          if (serviceList[i].name === service && serviceList[i].methods[action]) {
            result = serviceList[i];
            break;
          }
        }
      } else if (compareVersion(version, sp.version)) { // 获取低版本的服务
        for (let i = serviceList.length - 1; i >= 0; i--) {
          if (serviceList[i].name === service && serviceList[i].methods[action]) {
            result = serviceList[i];
            break;
          }
        }
      }
      if (result !== null) {
        break;
      }
    }
    if (result != null) {
      if (!global.cacheServiceProvider) {
        global.cacheServiceProvider = {};
      }
      global.cacheServiceProvider[key] = result;
    }
    return result;
  };

  /**
   * 解析某个版本下的所有服务
   * @param {String} filePath 文件路径
   * @param {String} version 版本
   * @return {Array} 服务列表
   */
  const initService = (filePath, version) => {
    const files = fs.readdirSync(filePath);
    const serviceList = files.map(fileName => {
      if (fileName.charAt(0) !== '.') {
        try {
          const Service = require(`${filePath}/${fileName}`);
          const obj = new Service();
          return { name: fileName.substr(0, fileName.length - 3), version, methods: obj };
        } catch (ex) {
          log.error(ex);
          return null;
        }
      }
      return null;
    }).filter(service => service !== null);
    return serviceList;
  };
  /**
   * 加载services下所有的服务
   */
  this.loadService = () => {
    const baseServicePath = path.join(global.app.config.rootDir, global.app.config.servicePath);
    if (fs.existsSync(baseServicePath)) {
      const files = fs.readdirSync(baseServicePath);
      // const count = files.length;
      const results = files.map(filename => {
        const filePath = path.join(baseServicePath, filename);
        if (filename.charAt(0) !== '.') { // 过滤隐藏文件夹
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            const serviceList = initService(filePath, filename);
            return { version: filename, serviceList };
          }
        }
        return null;
      });
      global.serviceProvider = [].concat(results.filter(item => item != null));
      global.serviceProvider.sort((left, right) => {
        return compareVersion(left.version, right.version);
      });
      log.info('服务解析完成');
    } else {
      log.info(`${baseServicePath}  Not Found!`);
    }
  };
  /**
   * 服务调用
   * @param {String} ctx 运行上下文
   * @param {String} version 版本
   * @param {String} service 服务
   * @param {String} action 方法
   * @param {String} params 参数
   * @return {Object} 执行结果
   */
  this.invoke = async (ctx, version, service, action, params) => {
    const cacheService = getService(version, service, action);
    let res = null;
    if (cacheService) {
      const logInfo = new ServiceNote(service, action, params);
      // log.info(`attempt to invoke ${service}.${action} with version(${version}),actual version(${cacheService.version})`)
      res = await cacheService.methods[action](ctx, params);
      logInfo.dataRes = res;
      logInfo.endTime = new Date().getTime();
      ctx.debugInfo.requests.push(logInfo);
    } else {
      return new ErrorRes('service not exist', `${service}:${action} not exist`);
    }
    return res;
  };
}
module.exports = new DynamicAPI();
