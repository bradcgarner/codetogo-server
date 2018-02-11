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

// only post; badges are never updated, just new ones created
router.post('/', jwtAuth, (req, res) => {
  
  const badge = {
    idUser: req.body.idUser,
    name: req.body.name,
    category: req.body.category,
    score: req.body.score,
    label: req.body.label,
    timestampCreated: new Date()
  };
  return Badge.create(badge, {new: true})
    .then(badgeCreated=>{
      res.status(200).json(badgeCreated.apiRepr());
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };