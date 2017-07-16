const Koa = require('koa2');
const session = require('koa-generic-session');
// const RedisStore = require('koa-redis');
const Redis = require('ioredis');
const bodyParser = require('koa-bodyparser');
const router = require('./router');
const staticServer = require('koa-static');
const mount = require('koa-mount'); // koa-mount@1.x
const koaJwt = require('koa-jwt');
const jwt = require('./jwt');
//const graphqlHTTP = require('koa-graphql');
// const log = require('../common/log');
const logger = require('./logger');
const getHttp = require('http').Server;
const co = require('co');
const views = require('koa-views');
const baseInit = require('./baseInit');
const apiHistory = require('./koa-api-history');
const dynamicService = require('../common/dynamicAPI');
const log4js = require('koa-log4');
const path = require('path');

log4js.configure(`${global.rootDir}/log.json`);
const log = log4js.getLogger('server');
let server = null;
/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string'
    ? `Pipe ${global.config.port}`
    : `Port ${global.config.port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      log.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      log.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`
  log.info(`Listening on : ${bind}`);
}
const app = new Koa();
app.StartServer = function () {
  const config = global.config;
  server = getHttp(app.callback());
  server.on('error', onError)
  server.on('listening', onListening)

  app.keys = [
    'secret',
    'whosyourdaddy',
  ];

  //session加密
  const sess = {
    key: 'brokun',
    secret: 'brokun',
    cookie: { maxAge: 1000 * 60 * config.sessionAge, },
    resave: false,
    rolling: true,
    saveUninitialized: false,
  };
  //开发环境配置
  //开发模式下使用内存管理session信息
  //其他模式下使用redis管理session信息
  if (global.config.env.mode !== 'development') {
    let redisClient = config.sessionStore;
    if (config.sessionStore.redis) {
      redisClient = new Redis(config.sessionStore.redis);
    }
    if (config.sessionStore.cluster) {
      redisClient = new Redis.Cluster(config.sessionStore.cluster);
    }
    // sess.store = new RedisStore(Object.assign({ client: redisClient, }, config.sessionStore.option));
  }
  ///TODO 需要完善
  global.redis = new Redis(config.sessionStore.redis);
  if (global.NODE_ENV === 'product') {
    app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto', }));
  }
  app.use(staticServer(config.viewPath, config.staticServer));
  app.use(views(config.viewPath, {
    map: {
      ejs: 'ejs',
    },
  }));
  app.use(bodyParser({
    textLimit: '50mb',
    formLimit: '50mb',
    jsonLimit: '50mb',
    extendTypes: {
      json: [
        'application/x-javascript',
      ], // will parse application/x-javascript type body as a JSON string
    },
  }));

  if (process.env.NODE_ENV === 'test') {
    app.use(apiHistory({
      dirPath: path.join(global.rootDir, config.commonFilePath),
      postman: true,
    }).unless({
      method: 'GET',
      path: [
        /^\/huoma/,
        /^\/api\/latest\/user\/login/,
        /^\/api\/[1-9]?\d.[1-9]?\d.[1-9]?\d\/user\/login/,
        /^\/login/,
      ],
    }));
  }

  // app.use(session(sess));
  app.use(baseInit);
  app.use(logger(server));
  // app.use(onlineChecker);
  app.use(koaJwt({
    secret: config.secret,
    key: 'user',
  }).unless({
    method: 'GET',
    path: [
      /^\/huoma/,
      /^\/api\/latest\/user\/login/,
      /^\/api\/[1-9]?\d.[1-9]?\d.[1-9]?\d\/user\/login/,
      /^\/login/,
    ],
  }));
  app.use(jwt({
    key: 'user',
    rolling: config.tokenRolling,
  }));
  app.use(router.middleware());
  server.listen(config.port, '0.0.0.0');
  return server;
}
module.exports = app;
