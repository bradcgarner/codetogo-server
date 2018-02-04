'use strict';
// endpoint is /api/quizzes/
// index: helpers, put, post, delete (no post)

const express = require('express');
const router = express.Router();

const { Quiz } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@ HELPERS @@@@@@@@@@@@@

const questionApiRepr = function (question) {
  console.log('single question', question);
  return { 
    answers: question.answers.map(answer=> {
      return {
        option: answer.option,
        id: answer._id
      };
    }), 
    question: question.question,
    inputType: question.inputType,
    id: question._id };
};

// @@@@@@@@@@@ ENDPOINTS @@@@@@@@@@@@@

// access quiz by id (get only 1st question)
router.get('/:quizId', (req, res) => {
  return Quiz.findById(req.params.quizId)
    .then(quiz => {
      return res.status(200).json(quiz.apiRepr());
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

module.exports = { router };