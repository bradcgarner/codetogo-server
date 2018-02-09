'use strict';

const express = require('express');
const router = express.Router();
const { Quiz } = require('../quizzes');

router.get('/initialize', (req, res) => {
  return Quiz.find({library: true})
    .then(quizzes => {
      const quizzesArray = quizzes.map(quiz => quiz.initializeRepr());
      const response = { quizzes: quizzesArray }; // property of object in case we want more properties later
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

module.exports = { router };
