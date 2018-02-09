'use strict';
// endpoint is api/auth/

const express = require('express');
const router = express.Router();

const { User } = require('../users');
const { Quiz } = require('../quizzes');

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
const localAuth = passport.authenticate('local', { session: false });
const jwtAuth = passport.authenticate('jwt', { session: false });


router.post('/login', localAuth, (req, res) => {
  
  let user = req.body;
  let userApiRepr, authToken, idUser;
  return User.findOne({username: user.username})
    .then( userFound => {
      const userForToken = Object.assign( {}, {
        username: userFound.username,
        first_name: userFound.firstName,
        last_name: userFound.lastName,
      });
      userApiRepr = userFound.apiRepr();    
      authToken = createAuthToken(userForToken);
      idUser = userApiRepr.id;
    })
    .then(()=>{
      return Quiz.find({idUser: idUser});
    })
    .then(userQuizzesFound=>{
      const userForResponse = Object.assign({}, userApiRepr,
        {
          authToken: authToken,
          quizzes: userQuizzesFound
        }
      );
      res.status(201).json(userForResponse);
    })
    .catch( err => {
      res.status(500).json({message: `Internal server error ${err}`});
    });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router };
