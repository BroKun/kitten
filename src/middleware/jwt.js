'use strict';
const moment = require('moment');
const jwtTool = require('../common/jwtTool');
const log4js = require('log4js');

const log = log4js.getLogger('jwt');

function jwt({ key, rolling }) {
  const midware = async (ctx, next) => {
    try {
      const userInfo = ctx.state[key];
      if (userInfo) {
        if (moment.unix(userInfo.iat).add(...rolling).valueOf() < moment().valueOf()) {
          const newToken = jwtTool.sign(userInfo, global.app.config.secret, { exp: userInfo.tokenInfo.expParam });
          ctx.set('token-rolling', newToken);
          ctx.cookies.set('token', newToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365 * 20, expires: new Date('2050-01-01') });
        }
      }
    } catch (ex) {
      log.error(`jwt midware 发生错误，错误信息:${ex}`);
    }
    await next();
  };
  return midware;
}

module.exports = jwt;
