'use strict';
// endpoint is /api/quizzes/
// index: helpers, put, post, delete (no post)

const express = require('express');
const router = express.Router();

const { Quiz, Question } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// create put endpoint(s) to update quiz, including add comments (after MVP)
router.put('/:quizId', jsonParser, jwtAuth, (req, res) => {
  return Quiz.findByIdAndUpdate(req.params.quizid, {
    $set: {
      name:req.body.name,
      description: req.body.description,
      category: req.body.category,
      difficulty: req.body.difficulty,
      questions: req.body.questions
    }
  })
    .then(quiz => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Internal server error' }));
});

// show all quizzes
router.get('/', (req, res) => {
  return Quiz.find()
    .then(quizzes => {
      let quizzesArray = quizzes.map(quiz => quiz.apiRepr());
      return res.status(200).json(quizzesArray);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// access quiz by id (load entire quiz array, then user cycles through array)
router.get('/:quizId', (req, res) => {
  return Quiz.findById(req.params.quizId)
    .then(quiz => {
      return res.status(200).json(quiz.apiRepr());
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// get all questions by quiz id
router.get('/:quizId/questions/', (req, res) => {
  return Question.find({quizId: req.params.quizId})
    .then(questions => {
      console.log('unformatted', questions);
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
      const formattedQuestions = questions.map(question=>questionApiRepr(question));
      console.log('formattedQuestions',formattedQuestions);      
      return res.status(200).json(formattedQuestions);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

module.exports = { router };