const Router = require('koa-router');
const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const jwt = require('jsonwebtoken');
const serviceAPI = require('../common/serviceAPI')
const dynamicAPI = require('../common/dynamicAPI')
const mockAPI = require('../common/mockAPI')
const openAPI = require('../common/openAPI');
const { DataRes, ErrorRes, } = require('../common/base');
const dynamicService = require('../common/dynamicAPI');

const routes = new Router();

/**
 * 服务分发
 * 根据版本号，service和action进行模块查找，如果指定的版本找不到则加载默认的服务
 */
// const dispatchService = async(ctx, version, service, action, params) => {
//   return await dynamicAPI.invoke({ ctx, version, service, action, params, });
// };
/**
 * 一般数据查询接口
 */
routes.post('/api/:version/:service/:action', async (ctx, next) => {
  const version = ctx.params.version;
  const service = ctx.params.service;
  const action = ctx.params.action;
  const params = ctx.request.body;
  const result = await dynamicAPI.invoke(ctx, version, service, action, params);
  await next();
  ctx.body = result;
});
routes.post('/login', async (ctx, next) => {
  let dataRes = new ErrorRes('error', 'unhandled request');
  const serviceData = ctx.request.body.datas;
  const action = serviceData.action;
  dataRes = await serviceAPI({ ctx, service: 'user', action, params: serviceData, });
  await next();
  ctx.body = dataRes;
});
//获取页面模版，使用用户信息渲染
routes.post('/getView', async (ctx, next) => {
  //TODO: 取消modules路径限制
  const filePath = path.join(global.rootDir, global.config.viewPath, 'modules', ctx.request.body.path);
  await next();
  if (fs.existsSync(filePath)) {
    await ctx.render(`modules/${ctx.request.body.path}`, {
      title: global.config.title,
      logo: global.config.logo,
      user: ctx.state.user,
      data: ctx.request.body,
    });
  } else {
    ctx.body = new ErrorRes('000', `${filePath} not exists`);
  }
});

module.exports = routes;
