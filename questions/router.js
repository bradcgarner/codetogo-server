'use strict';
// endpoint is /api/quizzes/
// index: helpers, put, post, delete (no post)

const express = require('express');
const router = express.Router();

const { Question } = require('./models');
const { Choice } = require('../choices/models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@@ FROM SPACED REP @@@@@@@@@@@@@@@@

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
  let correct_id = correct.map(answer=>String(answer._id));
  let correctSort = correct_id.sort((a,b)=>a-b);   
  let correctJoin = correctSort.join(',');   
  return correctJoin;
};

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// create put endpoint(s) to update quiz, including add comments (after MVP)
router.put('/:idQuestion', jsonParser, jwtAuth, (req, res) => {
  
  const { idQuiz, idUser, idQuestion, id, index, score, choices, idTrue, idFalse, idNext } = req.body;
  let correct = false;
  let scoreNew = score;
  let questionNext, idToUpdate, indexNext, answers;
  let formattedChoices = (choices).sort((a,b) => a-b).join(','); 

  // get the question by id from db, 
  Question.findById(id)
    .then(currentQuestion=>{
      
      // score the choice, set new score
      const questionIds = formatQuestionOptionIds(currentQuestion);     // format answers as a sorted string
      correct = questionIds === formattedChoices;   // compare, return true or false, hoist
      scoreNew = setScore(score, correct);
      answers = currentQuestion.answers;
      idToUpdate = correct ? idTrue : idFalse;
      console.log('SCORING: correct questionIds ===', questionIds, 'and ', 'formattedChoices ===', formattedChoices);
      return correct;   // compare, return true or false, hoist
    })

    // get questionNext
    .then(()=>{
      return Question.findById(idNext);
    })
    .then(foundQuestion=>{
      questionNext = foundQuestion[0];
      
      // respond to client here ????

      // start update pointers, find by either idTrue or idFalse
      return Question.findById(idToUpdate);
    })
    
    // get indexNext for questionCurrent
    .then(futureQuestion=>{
      indexNext = futureQuestion.indexNext;

      // set currentQuestion's index as futureQuestion's indexNext
      return Question.findByIdAndUpdate(idToUpdate, 
        { $set: { indexNext: index } }
      );
    })

    // save choice in DB for historical purposes
    .then(() =>{
      return Choice.create({idUser, idQuiz, idQuestion, choices, correct });
    })

    // DB: update questionCurrent score and indexNext
    .then(()=>{
      return Question.findByIdAndUpdate(req.params.idQuestion,
        { $set: { score: scoreNew, indexNext } }
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
      res.status(204).json(response);
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` })
    });
});

module.exports = { router };