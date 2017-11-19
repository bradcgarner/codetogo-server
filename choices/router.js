'use strict';
// endpoint is /api/choices/
// index: helpers, post, get (no put, no delete)

const express = require('express');
const router = express.Router();

const { Choice } = require('./models');
const { Question } = require('../quizzes/models');

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
    quizId: choice.quizId,
    choices: choice.choices, // array of answer ids (typeof === string)
    correct: choice.correct,
    id: choice._id, 
    attempt: choice.attempt,
  };
};

// @@@@@@@@@@  S U B M I T     C H O I C E S    @@@@@@@@@@@@@@

router.post('/', jsonParser, jwtAuth, (req, res)=> {

  let userId = req.body.userId; // string
  let questionId = req.body.questionId; // string
  let attempt = req.body.attempt; // number
  let quizId = req.body.quizId; // string
  let choices = req.body.choices; // array of strings
  
  let formattedChoices = (choices).sort((a,b) => a-b).join(','); 
  let correct;
  console.log('userId',userId, 'questionId',questionId, 'attempt',attempt, 'quizId',quizId, 'choices',choices, 'formattedChoices',formattedChoices)

  // FIND QUESTION AND SCORE CHOICE
  Question.findById( questionId )
    .then(question=>{
      console.log('question from db', question);
      const questionIds = formatQuestionOptionIds(question);     // format answers as a sorted string
      console.log('joined ids', questionIds);      
      correct = questionIds === formattedChoices;   // compare, return true or false, hoist
      // console.log('SCORING: correct questionIds ===', questionIds, 'and ', 'formattedChoices ===', formattedChoices);
      console.log('correct', correct);      
      return correct;   // compare, return true or false, hoist
    })

    // SAVE CHOICE IN DB
    .then(()=>{
      return Choice.create({userId, questionId, attempt, quizId, choices, correct });
    })

    .then(choice => {
      console.log('choice successfully inserted', choice);
      const formattedChoice = choiceApiRepr(choice);
      console.log('choice to return', formattedChoice);
      res.status(201).json(formattedChoice);
    })
    .catch(err => {
      // console.log(err);
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// XXXXXXXXXXXXX C H O I C E     B Y     Q U I Z    &    U S E R     I D S  XXXXXXXXXXXXXXX
// NOT CURRENTLY USED !!!!!!
router.get('/quizzes/:quizId/users/:userId/:attempt', (req, res) => {
  return Choice.find({ quizId: req.params.quizId, userId: req.params.userId , attempt: req.params.attempt })
    .then(choices => {
      // console.log('choices found', choices);
      const formattedChoices = choices.map(choice=>choiceApiRepr(choice));
      // console.log('formatted choices found', formattedChoices);
      return res.status(200).json(formattedChoices);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
      // console.log(err);
    });
});

module.exports = { router, choiceApiRepr };