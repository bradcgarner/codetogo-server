'use strict';
// endpoint is api/auth/

const express = require('express');
const router = express.Router();

const { User } = require('../users');

const config = require('../config');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const { localStrategy } = require('./local-strategy');
const { jwtStrategy } = require('./jwt-strategy');

const createAuthToken = function (user) {
  return jwt.sign({ user }, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

router.use(bodyParser.json());
// passport.use(localStrategy);
const localAuth = passport.authenticate('local', { session: false });
const jwtAuth = passport.authenticate('jwt', { session: false });


router.post('/login', localAuth, (req, res) => {
  
  let user = req.body;
  console.log('user at login',user);

  // console.log('login', user);
  return User.findOne({username: user.username})
    .then( userFound => {
      console.log('user found in login', userFound);
      const userForToken = Object.assign( {}, {
        username: userFound.username,
        first_name: userFound.firstName,
        last_name: userFound.lastName,
      });
      console.log('userForToken', userForToken);

      const userApiRepr = userFound.apiRepr();    
      console.log('userApiRepr', userApiRepr);

      const authToken = createAuthToken(userForToken);
      console.log('authToken', authToken);

      const userForResponse = Object.assign({}, userApiRepr, {authToken: authToken});
      console.log('userForResponse', userForResponse);

      res.status(201).json(userForResponse);
    })
    .catch( err => {
      console.log('err', err);
      res.status(500).json({message: `Internal server error ${err}`});
    });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router };
