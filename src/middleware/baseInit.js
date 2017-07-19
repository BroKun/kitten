'use strict';
/**
 * 获取请求发起方ip
 * @param {Object} req 请求
 * @return {String} 请求发起方的ip
 */
const getRemoteAddress = req => {
  let remoteAddr = null;
  try {
    remoteAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;
  } catch (e) {
    return null;
  }
  if (remoteAddr) {
    const lastIndex = remoteAddr.lastIndexOf(':');
    remoteAddr = remoteAddr.substring(lastIndex + 1, remoteAddr.length);
  }
  return remoteAddr;
};

const midware = async (ctx, next) => {
  ctx.remoteAddr = getRemoteAddress(ctx.req); // 添加请求发起方的ip到上下文
  const configApiOption = (global.app.config && global.app.config.env && global.app.config.env.apiOption) ? global.app.config.env.apiOption : {};
  const paramsApiOption = ctx.request.body.apiOption || {};
  ctx.apiOption = Object.assign({}, configApiOption, paramsApiOption);
  delete ctx.request.body.apiOption;
  ctx.debugInfo = {
    apiOption: ctx.apiOption,
    method: ctx.method,
    url: ctx.url,
    paramsInfo: ctx.request.body,
    requests: [],
  };
  await next();
};

module.exports = midware;
