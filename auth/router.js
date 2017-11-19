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
  let { id , username, firstName, lastName,
    quizzes, badges, recent, lastSession  } = req.user.apiRepr();
  if (lastSession.length > 0 && lastSession.length === 999) { // temp to escape !!!!!!
    quizzes = scoreQuizzes(quizzes, lastSession);
    lastSession = [];
    return User.findByIdAndUpdate(id,
      { $push: {quizzes: quizzes, lastSession: [] } }, // later update recent
      { new: true }
    )
      .then(user=>{
        res.json(user.apiRepr());
      });
  } else {
    res.json({ authToken , id , username, firstName, lastName,
      quizzes, badges, recent, lastSession });
  }
});

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = { router };
