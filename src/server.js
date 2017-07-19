'use strict';
// const RedisStore = require('koa-redis');
const bodyParser = require('koa-bodyparser');
const router = require('./middleware/router');
const staticServer = require('koa-static');
const koaJwt = require('koa-jwt');
const jwt = require('./middleware/jwt');
// const graphqlHTTP = require('koa-graphql');
const logger = require('./middleware/logger');
const views = require('koa-views');
const baseInit = require('./middleware/baseInit');
const log4js = require('koa-log4');
const path = require('path');
const log = log4js.getLogger('server');
const getHttp = require('http').Server;
const recorder = require('koa-api-recorder');

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string'
    ? `Pipe ${global.app.config.port}`
    : `Port ${global.app.config.port}`;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      log.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      log.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server) {
  return function() {
    const addr = server.address();
    const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
    log.info(`Listening on : ${bind}`);
  };
}

function startServer(app, config) {
  const server = getHttp(app.callback());
  server.on('error', onError);
  server.on('listening', onListening(server));
  app.keys = [
    'secret',
    'whosyourdaddy',
  ];
  // session加密
  // const sess = {
  //   key: 'brokun',
  //   secret: 'brokun',
  //   cookie: { maxAge: 1000 * 60 * config.sessionAge },
  //   resave: false,
  //   rolling: true,
  //   saveUninitialized: false,
  // };
  // sess.store = new RedisStore(Object.assign({ client: redisClient, }, config.sessionStore.option));
  if (config.NODE_ENV !== 'test') {
    app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }));
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

  if (config.NODE_ENV === 'test') {
    app.use(recorder({
      dirPath: path.join(config.rootDir, config.commonFilePath),
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
    key: config.token.ctxKey,
    rolling: config.token.tokenRolling,
  }));
  app.use(router().middleware());
  server.listen(config.port, '0.0.0.0');
  return server;
}
module.exports = startServer;
