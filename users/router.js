'use strict';
// endpoint is /api/users/
// index: helpers, post, put, get, delete

const express = require('express');
const router = express.Router();

const { User, } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

const validateUserFieldsPresent = user => {
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const missingField = requiredFields.find(field => !(field in user));
  console.log('new user request body', user);
  console.log('new user missing field', missingField);
  if (missingField) {
    return {
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    };
  }
  return true;
};

const validateUserFieldsString = user => {
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
  return true;
};  

const validateUserFieldsTrimmed = user => {
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
  return true ;
};  

const validateUserFieldsSize = user => {  
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
  return true ;
};  

const validateUserFields = (user, type) => { // type = new or existing
  if (!(validateUserFieldsPresent(user)) && type === 'new') {
    return validateUserFieldsPresent(user); 

  } else if (!(validateUserFieldsString(user)) ) {
    return validateUserFieldsString(user);

  } else if (!(validateUserFieldsTrimmed(user)) ) {
    return validateUserFieldsTrimmed(user);

  } else if (!(validateUserFieldsSize(user)) ) {
    return validateUserFieldsSize(user);

  } else {
    return true;
  }
};

function confirmUniqueUsername(username) {
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
      } else {
        return Promise.resolve();
      }
    });
}

// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

// create a new user
router.post('/', jsonParser, (req, res) => {
  let userValid = {};
  if (!(validateUserFields(req.body, 'new')) ) {
    console.log('not valid',validateUserFields(req.body, 'new'));
    let code = validateUserFields(req.body).code || 422;
    return res.status(code).json(validateUserFields(req.body));
  } else {
    userValid = req.body;
  }

  console.log('user validated');
  let { username, password, lastName, firstName } = userValid;

  return confirmUniqueUsername(username)
    .then(() => {
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
  if (validateUserFields(req.body, 'existing') === true) {
    userValid = req.body;
  } else {
    let code = validateUserFields(req.body).code;
    return res.status(code).json(validateUserFields(req.body));
  }

  return confirmUniqueUsername(userValid.username) // returns Promise.resolve or .reject
    .then(() => {
      return User.findById(req.params.id);
    })
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
        return false;
      }
    })
    .then(hash => {
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

// update a user data (any data other than credentials)
router.put('/:id/data', jwtAuth, jsonParser, (req, res) => {  
  const updateUser = req.body;
  console.log('req.params.id', req.params.id);
  console.log('req.body at :id/data', req.body);
  console.log('updateUser', updateUser);

  User.findByIdAndUpdate(req.params.id,
    { $set: {quizzes: updateUser.quizzes, recent: updateUser.recent } }, // recent: updateUser.recent
    { new: true },
    function (err, user) {
      console.log('err after err, user',err);
      if (err) return res.status(500).json({message: 'user not found', error: err});
      console.log('found');
      const filteredUser = user.apiRepr();    
      console.log('filteredUser', filteredUser);
      res.status(201).json(filteredUser);
    });
});

// get user by id
router.get('/user/:userId', jwtAuth, (req, res) => {
  console.log('res', res);
  return User.findById(req.params.userId)
    .then(user => {
      const filteredUser = user.apiRepr();
      return res.status(200).json(filteredUser);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// @@@@@@@@@@@@@@@@@@ START ADMIN ENDPOINTS @@@@@@@@@@@@@@@@@

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