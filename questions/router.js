'use strict';
// endpoint is /api/questions/

const express = require('express');
const router = express.Router();

const { Question } = require('./models');
const { Choice } = require('../choices/models');
const { ObjectId } = require('mongodb').ObjectId;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@@ HELPERS @@@@@@@@@@@@@@@@

const setScore = (scorePrior, correct) => {
  const multCorrect = 2;
  const multIncorrect = .5;
  let score;
  let right;
  if (correct) {
    score = scorePrior * multCorrect;
  } 
  else {
    score = Math.ceil(scorePrior * multIncorrect);  
  } 
  return score;
};

const formatQuestionOptionIds = question => {
  let correct = question.answers.filter(answer => answer.correct);
  let correctId = correct.map(answer=>ObjectId(answer.id).toString());
  let correctSort = correctId.sort((a,b)=>a-b);   
  let correctJoin = correctSort.join(',');   
  return correctJoin;
};

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// create put endpoint(s) to update quiz, including add comments (after MVP)
router.put('/:idQuestion', jwtAuth, (req, res) => {
  
  const idQuestion = req.params.idQuestion;
  const { idUser, nameQuiz, idQuiz, indexCurrent, score, choices, indexNext, indexTrue, indexFalse } = req.body;
  let correct = false;
  let scoreNew = score;
  let questionNext, indexToUpdate, answers;
  let formattedChoices = (choices).sort((a,b) => a-b).join(','); 
  
  // get the question by id from db, 
  return Question.findById(idQuestion)
    .then(currentQuestion=>{
      
      // score the choice, set new score
      const questionIds = formatQuestionOptionIds(currentQuestion);     // format answers as a sorted string
      correct = questionIds === formattedChoices;   // compare, return true or false, hoist
      scoreNew = setScore(score, correct);
      answers = currentQuestion.answers;
      indexToUpdate = correct ? indexTrue : indexFalse;
      return correct;   // compare, return true or false, hoist
    })

    // get questionNext
    .then(()=>{
      return Question.findOne({
        nameQuiz,
        index: indexNext,
        accepted: true,
      });
    })
    .then(foundQuestion=>{
      questionNext = foundQuestion.apiRepr();

      // respond to client here ????

      // start update pointers, find by either indexTrue or indexFalse
      // set find the question that points to the current question and update its pointer
      return Question.update({
        nameQuiz,
        indexNext: indexCurrent,
        accepted: true,
      },
      {
        $set: { indexNext }
      });
    })
    // set currentQuestion's index as futureQuestion's indexNext
    .then(()=>{
      return Question.update({
        nameQuiz,
        index: indexToUpdate,
        accepted: true,
      },
      {
        $set: { indexNext: indexCurrent }
      });
    })

    // save choice in DB for historical purposes
    .then(() =>{
      return Choice.create({idUser, idQuiz, idQuestion, choices, correct });
    })

    // DB: update questionCurrent score and indexNext
    .then(()=>{
      return Question.findByIdAndUpdate(req.params.idQuestion,
        { $set: {
          score: scoreNew,
          indexNext: correct ? indexTrue : indexFalse,
        } }
      );
    })

    // respond to client
    .then(() => {
      const response = {
        questionCurrent: {
          score: scoreNew,
          correct,
          indexNext,
          answers
        },
        questionNext
      };
      res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };