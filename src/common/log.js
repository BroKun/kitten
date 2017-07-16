const io = require('./socket');
const { extendObj, } = require('./util');

const init = (app) => {
  io.init(app);
};

function debug(data) {
  const { id, reqInfo, } = this;
  if (id) {
    io.info(extendObj(reqInfo, data));
    data.reqInfo = {};
    return;
  }
}

function info(data) {
  io.info(data);
}

function warn(data) {
  io.info(data);
}

function error(data) {
  io.info(data);
}

module.exports = { init, debug, info, warn, error, };
