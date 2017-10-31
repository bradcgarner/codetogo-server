'use strict';

const { TEST_DATABASE_URL, TEST_PORT } = require('../config');
process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const { app, runServer, closeServer } = require('../index');
const { User } = require('../users');
const { JWT_SECRET } = require('../config');
const expect = chai.expect;

chai.use(chaiHttp);

// Set NODE_ENV to `test` to disable http layer logs
// You can do this in the command line, but this is cross-platform
process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

describe('Auth endpoints', function () {

  const username = 'exampleUser';
  const password = 'examplePass';
  const firstName = 'Joe';
  const lastName = 'Schmoe';

  before(function () {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  beforeEach(function () {
    return User.remove({})
      .then(()=>{
        return User.hashPassword(password);
      })
      .then(password => {
        return User.create({ username, password, firstName, lastName });
      });
  });
  
  afterEach(function () {

  });
  
  after(function () {
    return closeServer();
  });


  describe('/api/auth/login', function () {

    it('Should reject requests with no credentials', function () {
      return chai
        .request(app)
        .post('/api/auth/login')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with incorrect usernames', function () {
      return chai
        .request(app)
        .post('/api/auth/login')
        .auth('wrongUsername', password)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with incorrect passwords', function () {
      return chai
        .request(app)
        .post('/api/auth/login')
        .auth(username, 'wrongPassword')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should return a valid auth token', function () {
      return chai
        .request(app)
        .post('/api/auth/login')
        .auth(username, password)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
            algorithm: ['HS256']
          });
          expect(payload.user.username).to.equal(username);
          expect(payload.user.firstName).to.equal(firstName);
          expect(payload.user.lastName).to.equal(lastName);
        });
    });
  });

  describe('/api/auth/refresh', function () {

    it('Should reject requests with no credentials', function () {
      return chai
        .request(app)
        .post('/api/auth/refresh')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('Should reject requests with an invalid token', function () {
      const token = jwt.sign(
        { username },
        'wrongSecret',
        {
          expiresIn: '7d'
        }
      );
      return chai
        .request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with an expired token', function () {
      const token = jwt.sign(
        {
          user: { username },
          exp: Math.floor(Date.now() / 1000) - 10
        },
        JWT_SECRET,
        {
          subject: username
        }
      );
      return chai
        .request(app)
        .post('/api/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should return a valid auth token with a newer expiry date', function () {
      const token = jwt.sign(
        {
          user: { username }
        },
        JWT_SECRET,
        {
          subject: username,
          expiresIn: '7d'
        }
      );
      const decoded = jwt.decode(token);
      return chai
        .request(app)
        .post('/api/auth/refresh')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          const token = res.body.authToken;
          expect(token).to.be.a('string');
          const payload = jwt.verify(token, JWT_SECRET, {
          });
          expect(payload.user).to.deep.equal({ username });
          expect(payload.exp).to.be.at.least(decoded.exp);
        });
    });
  });
});
