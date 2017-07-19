'use strict';
const Router = require('koa-router');
const path = require('path');
const dynamicAPI = require('../common/dynamicAPI');
const multer = require('koa-multer');

module.exports = function() {
  const routes = new Router();
  const uploadMidware = multer({ dest: path.join(global.app.config.rootDir, global.app.config.commonFilePath) });

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

  routes.post('/upload', uploadMidware.single('uploadFile'), async (ctx, next) => {
    const fileName = ctx.req.file.filename;
    const params = Object.assign({}, ctx.req.body, { fileName });
    const version = params.version || 'latest';
    const service = params.service;
    const action = params.action;
    const result = await dynamicAPI.invoke(ctx, version, service, action, params);
    await next();
    ctx.body = result;
  });
  return routes;
};
