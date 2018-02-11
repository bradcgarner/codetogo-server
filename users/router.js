'use strict';
// endpoint is /api/users/
// index: helpers, post, put, get, delete

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

const validateUserFieldsPresent = user => {
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const missingField = requiredFields.find(field => (!(field in user)));
  if (missingField) {
    const response = {
      message: 'Missing field',
      location: missingField
    };
    return response;
  }
  return 'ok';
};

const validateUserFieldsString = user => {
  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in user && typeof user[field] !== 'string'
  );
  if (nonStringField) {
    return {
      message: 'Incorrect field type: expected string',
      location: nonStringField
    };
  }
  return 'ok';
};  

const validateUserFieldsTrimmed = user => {
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedFields = [];
  explicityTrimmedFields.forEach( field => {
    if (user[field]) {
      if (user[field].trim() !== user[field]) {
        nonTrimmedFields.push(field);
      }
    }
  });
  if (nonTrimmedFields.length > 0) {
    return {
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedFields.join(', ')
    };
  }
  return 'ok' ;
};   

const validateUserFieldsSize = user => {  
  const sizedFields = {
    username: { min: 1,  max: 99 },
    password: { min: 10, max: 72 }
  };
  const tooSmallField = [];
  const tooLargeField = [];

  for(let prop in sizedFields) {
    if (user[prop]) {
      if (user[prop].length < sizedFields[prop].min) {
        tooSmallField.push(`${prop} must be at least ${sizedFields[prop].min} characters.`);
      } else if (user[prop].length > sizedFields[prop].max) {
        tooLargeField.push(`${prop} cannot exceed ${sizedFields[prop].max} characters.`);
      }
    }
  }

  if (tooSmallField.length > 0 || tooLargeField.length > 0) {
    const tooSmallMessage = tooSmallField.join(', ');
    const tooLargeMessage = tooLargeField.join(', ');
    return [tooSmallMessage, tooLargeMessage].join(', ');
  }
  return 'ok' ;
};  

const validateUserFields = (user, type) => { // type = new or existing
  const isPresentt = type === 'new' ? validateUserFieldsPresent(user): 'ok';
  const isStringg = validateUserFieldsString(user);
  const isTrimmedd = validateUserFieldsTrimmed(user);
  const isSize = validateUserFieldsSize(user);
  
  if (isPresentt !== 'ok' && type === 'new') {
    return isPresentt; 
  } else if (isStringg !== 'ok') {
    return isStringg;
  } else if (isTrimmedd !== 'ok' ) {
    return isTrimmedd;
  } else if (isSize !== 'ok' ) {
    return isSize;
  } else {
    return 'ok';
  }
};

function confirmUniqueUsername(username, type) {
  if (!username && type !== 'new') {
    return Promise.resolve();
  }
  return User.find({ username })
    .then(count => {
      const maxMatch = type === 'existingUser' ? 1 : 0 ;
      if (count > maxMatch) {
        return Promise.reject({
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      } else {
        return Promise.resolve();
      }
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
  } else {
    userValid = req.body;
  }

  let { username, password, lastName, firstName, email, avatar } = userValid;

  return confirmUniqueUsername(username, 'new')
    .then(() => {
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({ username, password: hash, lastName, firstName, email, avatar });
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
  const userValid = {};
  const allowedKeys = ['username', 'password', 'firstName', 'lastName', 'email', 'avatar'];
  allowedKeys.forEach(key=>{
    if(req.body[key]) userValid[key] = req.body[key];
  });

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
        return User.hashPassword(req.body.password);
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