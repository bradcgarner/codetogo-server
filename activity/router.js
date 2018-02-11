'use strict';
// endpoint is /api/activity/

const express = require('express');
const router = express.Router();

const { Activity } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });

const { validateKeysPresent, limitKeys, validateValuesSize, validateValuesTrimmed, validateTypes } = require('../helpers/helper');

const validateActivityPost = activity => {
  const requiredKeys = ['idUser', 'name', 'category', 'action'];
  const isPresent = validateKeysPresent(activity, requiredKeys);
  if( isPresent !== 'ok') {
    throw `Missing keys: ${JSON.stringify(isPresent)}`;
  }

  const stringFields = requiredKeys;
  const isString = validateTypes(activity, stringFields, 'string');
  if( isString !== 'ok') {
    throw `Mis-typed values: ${JSON.stringify(isString)}`;
  }
};

// only post; activity are never updated, just new ones created
router.post('/', jwtAuth, (req, res) => {
  
  validateActivityPost(req.body); // no return value, only throws errors

  const allowedKeys = ['idUser', 'name', 'category', 'action'];
  const activity = limitKeys(req.body, allowedKeys);
  activity.timestampCreated = new Date();

  return Activity.create(activity, {new: true})
    .then(activityCreated=>{
      res.status(200).json(activityCreated.apiRepr());
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };