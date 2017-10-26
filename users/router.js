'use strict';
// endpoint is /api/users/
// index: helpers, post, put, get, delete

const express = require('express');
const router = express.Router();

var qs = require('qs');
var assert = require('assert');

const { User, } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

function validateUserFields(user) {
  // split this into 3 PURE helper functions
  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in user && typeof user[field] !== 'string'
  );

  if (nonStringField) {
    return {
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    };
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => user[field].trim() !== user[field]
  );

  if (nonTrimmedField) {
    return {
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    };
  }

  const sizedFields = {
    username: { min: 1 },
    password: { min: 10, max: 72 }
  };
  const tooSmallField = Object.keys(sizedFields).find(field =>
    'min' in sizedFields[field] &&
    user[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(field =>
    'max' in sizedFields[field] &&
    user[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return {
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    };
  }

  return { valid: true };
}

function confirmUniqueUsername(username) {
  return User.find({ username })
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already takken',
          location: 'username'
        });
      } else {
        return Promise.resolve();
      }
    });
}

// quizzes are archived is a user clicks 'delete quiz'
const removeArchivedQuizzes = user => {
  console.log('removeArchivedQuizzes start',user);
  const userQuizzes = user.quizzes;
  const noArchiveQuizzes = userQuizzes.filter(quiz=>quiz.archive !== true);
  user.quizzes = noArchiveQuizzes;
  console.log('removeArchivedQuizzes end',user);
  return user;  
};

// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

// create a new user
router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const missingField = requiredFields.find(field => !(field in req.body));
  console.log('new user request body', req.body);
  console.log('new user missing field', missingField);
  // only used when creating user
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  let userValid = {};
  // used whenever changing or creating user
  if (validateUserFields(req.body).valid === true) {
    userValid = req.body;
  } else {
    let code = validateUserFields(req.body).code || 422;
    return res.status(code).json(validateUserFields(req.body));
  }

  console.log('user validated');
  let { username, password, lastName, firstName } = userValid;

  return User.find({ username })
    .count()
    .then(count => {
      if (count > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({ username, password: hash, lastName, firstName });
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// update a user profile
router.put('/:id', jsonParser, jwtAuth, (req, res) => {

  let userValid = {};
  if (validateUserFields(req.body).valid === true) {
    userValid = req.body;
  } else {
    let code = validateUserFields(req.body).code;
    return res.status(code).json(validateUserFields(req.body));
  }

  return confirmUniqueUsername(userValid.username)
    .then(() => {
      return User.findById(req.params.id)
        .count()
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
          } else {
            return '';
          }
        })
        .then((hash) => {
          if (hash) {
            userValid.password = hash;
          }
        })
        .then(() => {
          return User.findByIdAndUpdate(req.params.id,
            { $set: userValid },
            { new: true },
            function (err, user) {
              if (err) return res.send(err);
              const filteredUser = removeArchivedQuizzes(user.apiRepr());
              res.status(201).json(filteredUser);
            }
          );
        });
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// update a user data (any data other than credentials)
router.put('/:id/data', jsonParser, jwtAuth, (req, res) => { // add back jwtAuth
  const updateUser = req.body;
  console.log('req.body', req.body);
  console.log('updateUser', updateUser);
  return User.findByIdAndUpdate(req.params.id,
    { $set: updateUser },
    { new: true },
    function (err, user) {
      if (err) return res.send(err);
      const filteredUser = removeArchivedQuizzes(user.apiRepr());      
      res.status(201).json(filteredUser);
    }
  ) // end findByIdAndUpdate
    // .catch(err => {
    //   if (err.reason === 'ValidationError') {
    //     return res.status(err.code).json(err);
    //   }
    //   res.status(500).json({ code: 500, message: 'Internal server error' });
    // });
});

// get user by id, do NOT return archived quizzes
router.get('/user/:userId', (req, res) => {
  console.log('res', res);
  return User.findById(req.params.userId)
    .then(user => {
      const filteredUser = removeArchivedQuizzes(user.apiRepr());
      return res.status(200).json(filteredUser);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// @@@@@@@@@@@@@@@@@@ START ADMIN ENDPOINTS @@@@@@@@@@@@@@@@@

// get user by id, DO return archived quizzes
router.get('/user/:userId/history', (req, res) => {
  console.log('res', res);
  return User.findById(req.params.userId)
    .then(user => {
      return res.status(200).json(user.apiRepr());
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// get all users DANGER ZONE!!!!
router.get('/', (req, res) => {
  console.log(User.find());
  return User.find()
    .then(users => {
      let usersJSON = users.map(user=>user.apiRepr());
      return res.status(200).json(usersJSON);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});


// delete user
router.delete('/:id', jwtAuth, (req, res) => {
  User
    .findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      return res.status(500).json({ message: 'something went wrong' });
    });
});

module.exports = { router };