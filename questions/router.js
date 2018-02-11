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
  console.log('idQuestion', idQuestion);
  const { 
    // idQuestion is in the body, and we should compare it, but we are officially using the req.param version
    idUser,
    idQuiz, 
    choices,
    scoreIfTrue,
    scoreIfFalse,
    indexCurrent,
    scorePrior, 
    indexNextPrior, 
    indexInsertAfterIfTrue, 
    indexInsertAfterIfFalse,
    indexInsertBeforeIfTrue,
    indexInsertBeforeIfFalse 
  } = req.body;
  let correct = false;
  let scoreNew = scorePrior;
  let indexInsertAfter, indexInsertBefore;
  let indexRedirect, indexNextNew, indexInsertAfterNext, indexRedirectNext, answers;
  const formattedChoices = (choices).sort((a,b) => a-b).join(','); 
  console.log( 'idUser',idUser,
    'idQuiz', idQuiz,
    'choices',choices,
    'scoreIfTrue',scoreIfTrue,
    'scoreIfFalse',scoreIfFalse,
    'indexCurrent',indexCurrent,
    'scorePrior', scorePrior,
    'indexNextPrior', indexNextPrior,
    'indexInsertAfterIfTrue', indexInsertAfterIfTrue,
    'indexInsertAfterIfFalse',indexInsertAfterIfFalse,
    'indexInsertBeforeIfTrue',indexInsertBeforeIfTrue,
    'indexInsertBeforeIfFalse',indexInsertBeforeIfFalse );
  console.log('formattedChoices',formattedChoices);
  
  // get the question by id from db, 
  return Question.findById(idQuestion)
    .then(currentQuestion=>{
      console.log('currentQuestion',currentQuestion);
      
      // score the choice, set new score
      const formattedCorrectAnswers = formatQuestionOptionIds(currentQuestion);     // format answers as a sorted string
      console.log('formattedCorrectAnswers',formattedCorrectAnswers);
      correct = formattedCorrectAnswers === formattedChoices;   // compare, return true or false, hoist
      console.log('correct',correct);
      scoreNew = correct ? scoreIfTrue : scoreIfFalse;
      console.log('scoreNew',scoreNew);
      answers = currentQuestion.answers;
      console.log('answers',answers);
      indexInsertAfter = correct ? indexInsertAfterIfTrue : indexInsertAfterIfFalse;
      console.log('indexInsertAfter',indexInsertAfter);
      indexInsertBefore = correct ? indexInsertBeforeIfTrue : indexInsertBeforeIfFalse;
      console.log('indexInsertBefore',indexInsertBefore);
      indexNextNew = indexInsertBefore;
      console.log('indexNextNew',indexNextNew);
      indexInsertAfterNext = indexCurrent;
      console.log('indexInsertAfterNext',indexInsertAfterNext);

      // FIND REDIRECT (WHAT POINTS TO CURRENT QUESTION NOW)
      return Question.find(
        {idQuiz: ObjectId(idQuiz),
          accepted: true,
          indexNext: indexCurrent}
      );
    })
    // UPDATE REDIRECT
    .then(redirectFound=>{
      console.log('redirectFound', redirectFound);
      indexRedirect = redirectFound[0].index;
      indexRedirectNext = indexNextPrior;
      console.log('indexRedirect', indexRedirect);
      return Question.update(
        {idQuiz: ObjectId(idQuiz),
          accepted: true,
          index: indexRedirect},
        {$set: {
          indexNext: indexRedirectNext}}
      );
    })

    // UPDATE CURRENT QUESTION (POINTERS & SCORE)
    .then(()=>{
      return Question.findByIdAndUpdate(idQuestion,
        {$set: {score: scoreNew, indexNext: indexNextNew}},
        {new: true}
      );
    })

    // UPDATE INSERTAFTER POINTER
    .then(updatedQuestion=>{
      console.log('updatedQuestion',updatedQuestion);
      return Question.update(
        {idQuiz: ObjectId(idQuiz),
          accepted: true,
          index: indexInsertAfter},
        {$set: {
          indexNext: indexInsertAfterNext
        }}
      );
    })

    // SAVE CHOICE FOR FUTURE USE
    .then(() =>{
      return Choice.create({idUser, idQuiz, idQuestion, choices, correct, score: scoreNew}, {new: true});
    })

    // RESPONSE TO CLIENT
    .then(choiceCreated => {
      console.log('choiceCreated',choiceCreated);
      const response = {
        answers,
        correct,
        indexInsertBefore,
        indexInsertAfter,
        indexRedirect,
        scoreNew,
        indexNextNew,
        indexInsertAfterNext, 
        indexRedirectNext,
      };
      console.log('response',response);
      res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };