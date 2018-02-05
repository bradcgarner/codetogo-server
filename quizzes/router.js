'use strict';
// endpoint is /api/quizzes/

const express = require('express');
const router = express.Router();

const { Quiz } = require('./models');
const { Question } = require('../questions');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@ ENDPOINTS @@@@@@@@@@@@@

// access quiz by id (get only 1st question)
router.get('/:quizId', (req, res) => {
  let quiz, nameQuiz;
  return Quiz.findById(req.params.quizId)
    .then(quizFound => {
      nameQuiz = quizFound.name;
      quiz = quizFound.apiRepr();

      // find question matching indexCurrent
      // need a failsafe incase this doesn't work...
      return Question.findOne({
        index: quiz.indexCurrent,
        accepted: true,
        nameQuiz
      });
    })
    .then(questionFound=>{

      const questionCurrent = questionFound.apiRepr();
      const response = Object.assign({}, quiz, questionCurrent);
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

module.exports = { router };