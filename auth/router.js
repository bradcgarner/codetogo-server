'use strict';
// endpoint is api/auth/

const express = require('express');
const router = express.Router();

const { User } = require('../users');
const { Quiz } = require('../quizzes');
const { Badge } = require('../badges');
const { Activity } = require('../activity');

const config = require('../config');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// const { localStrategy } = require('./local-strategy');
// const { jwtStrategy } = require('./jwt-strategy');

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
  
  let userFromClient = req.body;
  let user, quizList, badges, activity;
  return User.findOne({username: userFromClient.username})
    .then( userFound => {
      const userForToken = Object.assign( {}, {
        username: userFound.username,
        first_name: userFound.firstName,
        last_name: userFound.lastName,
      });
      const userApiRepr = userFound.apiRepr();    
      const authToken = createAuthToken(userForToken);
      user = Object.assign({}, userApiRepr, {authToken: authToken});
    })
    // find quizzes
    .then(()=>{
      return Quiz.find({idUser: user.id});
    })
    .then(userQuizzesFound=>{
      quizList = userQuizzesFound;
    })
    // find badges
    .then(()=>{
      return Badge.find({idUser: user.id});
    })
    .then(userBadgesFound=>{
      badges = userBadgesFound;
    })
    // find activity
    .then(()=>{
      return Activity.find({idUser: user.id});
    })
    .then(userActivityFound=>{
      activity = userActivityFound;

      // respond
      const userForResponse = Object.assign({},{ user, quizList, badges, activity }
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
