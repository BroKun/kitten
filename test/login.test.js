const request = require('supertest');
const assert = require('assert');
const app = require('../app');
const validate = require('./utils/validate');

describe('route login', () => {
  it('验证登录', (done) => {
    request(app)
      .post('/login')
      .set('Content-Type', 'application/json')
      .send({ datas: { username: '', password: '', }, })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(validate.resCodeValidate)
      .end((err, res) => {
        if (err) return done(err);
        done();
      });
  });
});
