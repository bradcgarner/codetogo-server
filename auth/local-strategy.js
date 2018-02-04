'use strict';

// const express = require('express');
// const bodyParser = require('body-parser');
// const passport = require('passport');
// const { validatePassword } = require('./bcrypt');
const { Strategy: LocalStrategy } = require('passport-local');
const { User } = require('../users');

const localStrategy = new LocalStrategy((username, password, callback) => {
  console.log('localStrategy')  ;
  let user;
  User.findOne({ username: username })
    .then(_user => {
      console.log('_user',_user)  ;
      user = _user;
      if (!user) {
        console.log('reject Incorrect username or password');
        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      return user.validatePassword(password);
    })
    .then(isValid => {
      console.log('is valid', isValid);

      if (!isValid) {
        console.log('is not valid');

        return Promise.reject({
          reason: 'LoginError',
          message: 'Incorrect username or password'
        });
      }
      return callback(null, user);
    })
    .catch(err => {
      console.log('err', err);

      if (err.reason === 'LoginError') {
        return callback(null, false, err);
      }
      return callback(err, false);
    });
});

module.exports = { localStrategy };