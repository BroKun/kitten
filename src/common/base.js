'use strict';


// 构建错误返回值对象
function ErrorRes(code, message) {
  this.requestId = null;
  this.type = 'ServerError';
  this.code = code;
  this.message = message;
}

// 构建错误返回值对象

function ListRes(data) {
  this.requestId = null;
  this.code = null;
  this.message = null;
  this.dataList = data;
}

// 构建返回值对象
function DataRes(...datas) {
  let requestId = null;
  let code = null;
  let message = null;
  let data = null;
  switch (datas.length) {
    case 1:
      data = datas[0];
      break;
    case 2:
      code = datas[0];
      message = datas[1];
      break;
    case 3:
      code = datas[0];
      message = datas[1];
      data = datas[2];
      break;
    case 4:
      requestId = datas[0];
      code = datas[1];
      message = datas[2];
      data = datas[3];
      break;
    default:
      break;
  }
  this.requestId = requestId;
  this.code = code;
  this.message = message;
  this.data = data;
}


function NoteBase(service, action, params) {
  this.service = service;
  this.action = action;
  this.params = params;
  this.startTime = new Date().getTime();
}

function ServiceNote(...params) {
  NoteBase.call(this, ...params);
  this.type = 'service';
}

module.exports = { ListRes, DataRes, ErrorRes, ServiceNote };
