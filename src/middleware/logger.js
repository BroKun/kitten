'use strict';
const uuid = require('uuid');
const log = require('../common/socket');

const formatDebugInfo = debugInfo => {
  debugInfo.spend = debugInfo.endTime - debugInfo.startTime;
  debugInfo.requests.sort((a, b) => {
    return a.startTime - b.startTime;
  });
  debugInfo.requests.map(item => {
    if (item.endTime) item.spend = item.endTime - item.startTime;
    return item;
  });
  return debugInfo;
};
const midware = async (ctx, next) => {
  ctx.id = uuid.v1();
  ctx.debugInfo.id = ctx.id;
  ctx.debugInfo.startTime = new Date().getTime();
  await next();
  ctx.debugInfo.endTime = new Date().getTime();
  ctx.debugInfo.dataRes = ctx.body;
  const ms = ctx.debugInfo.endTime - ctx.debugInfo.startTime;
  ctx.set('X-Response-Time', `${ms}ms`);
  log.info(formatDebugInfo(ctx.debugInfo));
};

const initLogger = app => {
  log.init(app);
  return midware;
};

module.exports = initLogger;
