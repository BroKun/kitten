'use strict';
const request = require('supertest');
const app = require('../../app');

function login(username, password, auth, done) {
  request(app)
    .post('/login')
    .set('Content-Type', 'application/json')
    .send({ datas: { username, password } })
    .end((err, res) => {
      if (err || res.body.code) return done();
      Object.assign(auth, res.body.data);
      done();
    });
}

module.exports = {
  login,
};
