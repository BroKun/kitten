const socketio = require('socket.io');
const log4js = require('log4js');

const log = log4js.getLogger('socket');

let io = null;
const init = (http) => {
  io = socketio(http);
  //socket连接
  io.on('connection', (socket) => {
    log.info(`websocket: connected ${socket.id}`);
    socket.emit('sys', 'now, Tell me your choice');
    socket.emit('choice', '');
    socket.on('choice', (msg) => {
      if (msg === 'log') {
        socket.emit('sys', 'wise choice');
      }
      socket.join(msg);
    });
    socket.on('disconnect', () => {
      log.info(`websocket: disconnected ${socket.id}`);
      socket.leave('log');
    });
  });
}

const info = (data, room = 'log') => {
  if (!io) { return; }
  io.to('log').emit('info', data);
}

module.exports = { init, info, };
