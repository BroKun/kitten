'use strict';
const assert = require('assert');

/**
 * 验证返回的数据对象中code字段为null
 * @param {Object} res 返回对象
 */
function resCodeValidate(res) {
  assert(!res.body.code);
}

module.exports = {
  resCodeValidate,
};
