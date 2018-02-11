'use strict';
// endpoint is /api/badges/

const express = require('express');
const router = express.Router();

const { Badge } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', { session: false });

const { validateKeysPresent, limitKeys, validateTypes, confirmUserExists } = require('../helpers/helper');

const validateBadgePost = badgePost => {
  const requiredKeys = ['idUser', 'name', 'category', 'score', 'label'];
  const isPresent = validateKeysPresent(badgePost, requiredKeys);
  if( isPresent !== 'ok') {
    throw `Missing keys: ${JSON.stringify(isPresent)}`;
  }

  const stringFields = ['idUser', 'name', 'category', 'label'];
  const isString = validateTypes(badgePost, stringFields, 'string');
  if( isString !== 'ok') {
    throw `Mis-typed values: ${JSON.stringify(isString)}`;
  }

  const numberFields = ['score'];
  const isNumber = validateTypes(badgePost, numberFields, 'number');
  if( isNumber !== 'ok') {
    throw `Mis-typed values: ${JSON.stringify(isNumber)}`;
  }
};
// only post; badges are never updated, just new ones created
router.post('/', jwtAuth, (req, res) => {
  
  validateBadgePost(); // no return value, only throws errors

  const allowedKeys = ['idUser', 'name', 'category', 'score', 'label'];
  const badge = limitKeys(req.body, allowedKeys);
  badge.timestampCreated = new Date();

  return confirmUserExists(badge.idUser) // returns a promise, or throws errors
    .then(()=>{
      return Badge.create(badge, {new: true});
    })
    .then(badgeCreated=>{
      res.status(200).json(badgeCreated.apiRepr());
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };