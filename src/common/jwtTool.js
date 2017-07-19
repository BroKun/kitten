'use strict';
const jwt = require('jsonwebtoken');
const moment = require('moment');
const log4js = require('log4js');

const log = log4js.getLogger('jwtTool');
function sign(data, secret, { exp = 1 } = {}) {
  const iat = moment().unix();
  let expTime = moment.unix(iat).add(global.app.config.token.tokenExp, 'minutes').unix();
  try {
    const intExp = parseInt(exp, 10);
    if (intExp === 30) expTime = moment.unix(iat).add(global.app.config.token.tokenLongExp, 'minutes').unix();
  } catch (ex) {
    log.error(`解析登录信息exp出错 exp：${exp}`);
  }
  const useInfo = Object.assign({}, data, {
    iat,
    exp: expTime,
    tokenInfo: {
      expParam: exp,
    },
  });
  const token = jwt.sign(useInfo, global.app.config.secret);
  return token;
}

module.exports = { sign };
