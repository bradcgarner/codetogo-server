'use strict';


const express = require('express');
const router = express.Router();
const config = require('../config');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('../users');
const {scoreQuizzes} = require('../quizzes');

const createAuthToken = function (user) {
  return jwt.sign({ user }, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const basicAuth = passport.authenticate('basic', { session: false });
const jwtAuth = passport.authenticate('jwt', { session: false });

router.post('/login', basicAuth, (req, res) => {
  const authToken = createAuthToken(req.user.apiRepr());
  let { id , username, firstName, lastName, quizzes, badges, recent, lastSession  } = req.user.apiRepr();
  console.log('id',id, 'username',username, 'firstName',firstName, 'lastName',lastName,'quizzes',quizzes, 'badges',badges, 'recent',recent, 'lastSession',lastSession);
  console.log('lastSession',lastSession);
  console.log('typeof', typeof lastSession, Array.isArray(lastSession) );
  // if(!lastSession) {lastSession = [];}
  // let scoreFirst = false;
  // if ( Array.isArray(lastSession) ) {
  //   console.log('inside is array'); // ,lastSession[0], typeof lastSession[0]
  //   if (lastSession[0] !== null && typeof lastSession[0] !== 'undefined' ) { 
  //     scoreFirst = true;
  //     console.log('scoreFirst',scoreFirst);
  //   }
  // }
  // if (scoreFirst) {
  //   console.log('about to score');
  // const quizzesToScore = Object.assign({}, quizzes);
  console.log('quizzesToScore b4',quizzes);    
  return scoreQuizzes(quizzes, lastSession) // function is either Promise.all or resolved empty promise
    .then(()=>{
      console.log('quizzes after score',quizzes);
      return User.findByIdAndUpdate(id,
        { $set: {quizzes: quizzes, lastSession: [] } }, // later update recent
        { new: true }
      );
    })
    .then(user=>{
      quizzes = user.quizzes;
      lastSession = [];
      console.log('after return: lastSession',lastSession,'quizzes', quizzes);
    })
    .then(()=>{
      res.json({ authToken , id , username, firstName, lastName,
        quizzes, badges, recent, lastSession });
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
   

});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router };
