'use strict';
// endpoint is /api/choices/
// index: helpers, post, get (no put, no delete)

const express = require('express');
const router = express.Router();

const { User, Choice } = require('./models');
const { Question } = require('../quizzes');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

const formatQuestionOptionIds = question => {
  let correct = question.answers.filter(answer => answer.correct);
  let correct_id = correct.map(answer=>String(answer._id));
  let correctSort = correct_id.sort((a,b)=>a-b);   
  let correctJoin = correctSort.join(',');   
  return correctJoin;
};

const choiceApiRepr = choice => { // improve this to use apply()
  return { 
    userId: choice.userId,
    questionId: choice.questionId,
    quizId: choice.username,
    choices: choice.choices,
    correct: choice.correct,
    id: choice._id 
  };
};

// post choice (answer a question)
router.post('/', jsonParser, jwtAuth, (req, res)=> {

  let userId = req.body.userId; // string
  let questionId = req.body.questionId; // string
  let attempt = req.body.attempt; // number
  let quizId = req.body.quizId; // string
  let choices = req.body.choices; // array of strings
  
  let formattedChoices = (choices).sort((a,b) => a-b).join(','); 
  let correct;

  // FIND QUESTION AND SCORE CHOICE
  return Question.findById( questionId )
    .then(question=>{
      const questionIds = formatQuestionOptionIds(question);     // format answers as a sorted string
      correct = questionIds === formattedChoices;   // compare, return true or false, hoist
      console.log('SCORING: correct questionIds ===', questionIds, 'and ', 'formattedChoices ===', formattedChoices);
      return correct;   // compare, return true or false, hoist
    })

    // SAVE CHOICE IN DB
    .then(()=>{
      return Choice.create({userId, questionId, attempt, quizId, choices, correct });
    })

    // FIND ALL CHOICES THIS USER, THIS QUIZ, THIS ATTEMPT
    .then(()=>{
      return Choice.find({ userId: userId, quizId: quizId, attempt: attempt });
    })
    .then(choices => {
      console.log('choices found', choices);
      const formattedChoices = choices.map(choice=>choiceApiRepr(choice));
      console.log('formatted choices found', formattedChoices);
      return res.status(200).json(formattedChoices);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// get choice by quiz id and user id
router.get('/quizzes/:quizId/users/:userId/:attempt', (req, res) => {
  return Choice.find({ quizId: req.params.quizId, userId: req.params.userId , attempt: req.params.attempt })
    .then(choices => {
      console.log('choices found', choices);
      const formattedChoices = choices.map(choice=>choiceApiRepr(choice));
      console.log('formatted choices found', formattedChoices);
      return res.status(200).json(formattedChoices);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
      console.log(err);
    });
});

module.exports = { router };