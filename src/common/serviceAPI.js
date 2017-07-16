const path = require('path');
const fs = require('fs');
const openAPI = require('./openAPI');
const { ErrorRes, ServiceNote, } = require('./base');
const log4js = require('log4js');

const log = log4js.getLogger('serviceAPI');

module.exports = async ({ ctx, service, action, params, version = 'latest', }) => {
  const logInfo = new ServiceNote(service, action, params);
  let svcDir = path.normalize(`${__dirname}/../services/1.0/${service}`);
  if (!fs.existsSync(`${svcDir}.js`)) {
    svcDir = path.join(global.rootDir, global.config.servicePath, service);
  }
  let dataRes = null;
  try {
    //确定数据处理过程方法
    if (fs.existsSync(`${svcDir}.js`)) {
      const SVC = require(svcDir);
      const svc = new SVC();
      dataRes = await svc[action](ctx, params);
      logInfo.dataRes = dataRes;
      logInfo.endTime = new Date().getTime();
      ctx.debugInfo.requests.push(logInfo);
    } else {
      dataRes = await openAPI(ctx, service, action, params, version);
    }
  } catch (ex) {
    log.error(service, action, ex)
    dataRes = new ErrorRes('serviceAPI exception', ex);
  }
  return dataRes;
};
