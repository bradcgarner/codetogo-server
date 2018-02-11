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

// only post; activity are never updated, just new ones created
router.post('/', jwtAuth, (req, res) => {
  
  const activity = {
    idUser: req.body.idUser,
    actions: req.body.actions,
    name: req.body.name,
    category: req.body.category,
    timestampCreated: new Date()
  };
  return Activity.create(activity, {new: true})
    .then(activityCreated=>{
      res.status(200).json(activityCreated);
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };