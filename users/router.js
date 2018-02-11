'use strict';
// endpoint is /api/users/
// index: helpers, post, put, get, delete
const { validateKeysPresent, limitKeys, validateValuesSize, validateValuesTrimmed, validateTypes } = require('../helpers/helper');

const express = require('express');
const router = express.Router();

const { User } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@ HELPERS @@@@@@@@@@@@@

const validateUserFields = (user, type) => { // type = new or existing
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const explicityTrimmedFields = ['username', 'password'];
  const sizedFields = {
    username: { min: 1,  max: 99 },
    password: { min: 10, max: 72 }
  };
  const isPresentt = type === 'new' ? validateKeysPresent(user, requiredFields): 'ok';
  const isStringg = validateTypes(user, stringFields, 'string');
  const isTrimmedd = validateValuesTrimmed(user, explicityTrimmedFields);
  const isSize = validateValuesSize(user, sizedFields);
  
  if (isPresentt !== 'ok' && type === 'new') return isPresentt; 
  if (isStringg !== 'ok') return isStringg;
  if (isTrimmedd !== 'ok' ) return isTrimmedd;
  if (isSize !== 'ok' ) return isSize;
  return 'ok';

};

function confirmUniqueUsername(username, type) {
  if (!username && type !== 'new')  return Promise.resolve();
  return User.find({ username })
    .then(count => {
      const maxMatch = type === 'existingUser' ? 1 : 0 ;
      if (count > maxMatch) {
        return Promise.reject({
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return Promise.resolve();
    });
}

// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

// create a new user
router.post('/', jsonParser, (req, res) => {
  const user = validateUserFields(req.body, 'new');
  let userValid;
  if (user !== 'ok') {
    user.reason = 'ValidationError';
    return res.status(422).json(user);
  }
  const allowedFields = ['username', 'password', 'lastName', 'firstName', 'email', 'avatar'];
  userValid = limitKeys(req.body, allowedFields); // else of above

  return confirmUniqueUsername(userValid.username, 'new')
    .then(() => {
      return User.hashPassword(userValid.password);
    })
    .then(hash => {
      return User.create(userValid);
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(422).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// update a user profile
router.put('/:id', jsonParser, jwtAuth, (req, res) => {
  const user = validateUserFields(req.body);
  if (user !== 'ok') {
    user.reason = 'ValidationError';
    return res.status(422).json(user);
  } 
  const allowedKeys = ['username', 'password', 'firstName', 'lastName', 'email', 'avatar'];
  const userValid = limitKeys(req.body, allowedKeys);

  return confirmUniqueUsername(userValid.username) // returns Promise.resolve or .reject
    .then(() => {
      return User.findById(req.params.id).count();
    })
    .then(count => {
      if (count === 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'User not found',
          location: 'id'
        });
      }
      if (userValid.password) {
        return User.hashPassword(userValid.password);
      } 
      return false;
    })
    .then(hash => {
      if (hash) userValid.password = hash;
      return User.findByIdAndUpdate(req.params.id,
        { $set: userValid },
        { new: true },
        function (err, user) {
          if (err) return res.send(err);
          const filteredUser = user.apiRepr();
          res.status(201).json(filteredUser);
        }
      );
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

module.exports = { router };