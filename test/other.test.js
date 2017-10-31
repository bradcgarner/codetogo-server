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


describe.skip('Music endpoints', function () {
  const username = 'exampleUzer';
  const password = 'examplePazz';
  const firstName = 'Jozie';
  const lastName = 'Schmozie';

  before(function () {
    return runServer(TEST_DATABASE_URL, TEST_PORT);
  });

  beforeEach(function () {
    
  });

  afterEach(function () {

  });

  after(function () {
    return closeServer();
  });

  let id = 'GET A PLAYLIST ID';

  describe('/api/music/playlists/:id', function () {
    
    it('Should reject requests with no credentials', function () {
      return chai
        .request(app)
        .get('/api/music/playlists')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
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
        .get('/api/music/playlists/:id')
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
        .get('/api/music/playlists/:id')
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
  });
});
