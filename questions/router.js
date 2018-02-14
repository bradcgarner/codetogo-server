'use strict';
// endpoint is /api/questions/

const express = require('express');
const router = express.Router();

const { Question } = require('./models');
const { Quiz } = require('../quizzes/models');
const { Choice } = require('../choices/models');
const { ObjectId } = require('mongodb').ObjectId;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

const { validateKeysPresent, limitKeys, validateValuesSize, validateValuesTrimmed, validateTypes } = require('../helpers/helper');

// @@@@@@@@@@@@ HELPERS @@@@@@@@@@@@@@@@

const formatQuestionOptionIds = question => {
  let correct = question.answers.filter(answer => answer.correct);
  let correctId = correct.map(answer=>ObjectId(answer.id).toString());
  let correctSort = correctId.sort((a,b)=>a-b);   
  let correctJoin = correctSort.join(',');   
  return correctJoin;
};

const validateAnswer = (answer, idQuestion) => {
  const requiredKeys = [
    'idUser',
    'idQuiz', 
    'choices',
    'scoreIfTrue',
    'scoreIfFalse',
    'indexCurrent',
    'scorePrior', 
    'indexNextPrior', 
    'indexInsertAfterIfTrue', 
    'indexInsertAfterIfFalse',
    'indexInsertBeforeIfTrue',
    'indexInsertBeforeIfFalse' 
  ];
  const isPresent = validateKeysPresent(answer, requiredKeys);
  if( isPresent !== 'ok') {
    throw `Missing keys: ${JSON.stringify(isPresent)}`;
  }
  const stringKeys = [
    'idUser',
    'idQuiz', 
  ];
  const isString = validateTypes(answer, stringKeys, 'string');
  if( isString !== 'ok') {
    throw `Incorrect types:: ${JSON.stringify(isString)}`;
  }
  const numberKeys = [
    'scoreIfTrue',
    'scoreIfFalse',
    'indexCurrent',
    'scorePrior', 
    'indexNextPrior', 
    'indexInsertAfterIfTrue', 
    'indexInsertAfterIfFalse',
    'indexInsertBeforeIfTrue',
    'indexInsertBeforeIfFalse' 
  ];
  const isNumber = validateTypes(answer, numberKeys, 'number');
  if( isNumber !== 'ok') {
    throw `Incorrect types:: ${JSON.stringify(isNumber)}`;
  }
  const arrayKeys = [ 'choices' ];
  const isArrayy = validateKeysPresent(answer, arrayKeys);
  if( isArrayy !== 'ok') {
    throw `Incorrect types: ${JSON.stringify(isArrayy)}`;
  }

  if (answer.idQuestion !== idQuestion) {
    throw 'Question is mis-identified.';
  }
};

const validateQuestion = (question, idUser, idQuiz) => {
  if(!question) {
    throw 'Question not found!';
  }
  if(question.library){
    throw 'Sorry, this question cannot be answered';
  }
  if(ObjectId(question.idUser).toString() !== idUser){
    throw 'Sorry, this is not your question to answer';
  }
  if(ObjectId(question.idQuiz).toString() !== idQuiz){
    throw 'Sorry, this question belongs to a quiz other than the quiz listed';
  }
};

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// answer a question (submit a choice)
router.put('/:idQuestion', jwtAuth, (req, res) => {
  
  const idQuestion = req.params.idQuestion;
  console.log('idQuestion', idQuestion);

  validateAnswer(req.body, idQuestion); // no return value, just throws errors

  const { 
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
  } = req.body; // not using limitKeys here, because it is more useful to split into multiple individual variables
  let correct = false;
  let scoreNew = scorePrior;
  let indexInsertAfter, indexInsertBefore;
  let indexRedirect, indexNextNew, indexRedirectNext, answers, version;
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
      validateQuestion(currentQuestion, idUser, idQuiz); // no return value, only throws errors
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
        {$set: {indexNext: indexRedirectNext}}
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
      version = updatedQuestion.version;
      console.log('updatedQuestion',updatedQuestion);

      return Question.update(
        {idQuiz: ObjectId(idQuiz),
          accepted: true,
          index: indexInsertAfter},
        {$set: {
          indexNext: indexCurrent
        }}
      );
    })

  // UPDATE QUIZ CURRENT INDEX
    .then(()=>{
      console.log('questionupdated');
      console.log('Quiz', Quiz);
      console.log('Quiz', 'id', idQuiz, typeof idQuiz, 'indexNextPrior', indexNextPrior);
      return Quiz.findById(idQuiz);
    })
    // UPDATE QUIZ CURRENT INDEX
    .then(quizFound=>{
      console.log('Quiz found', quizFound);
      return Quiz.findByIdAndUpdate(idQuiz,
        { $set: {indexCurrent: indexNextPrior}},
        {new: true});
    })

    // SAVE CHOICE FOR FUTURE USE
    .then(() =>{
      console.log('quizupdated');
      return Choice.create({idUser, idQuiz, idQuestion, choices, correct, version, score: scoreNew}, {new: true});
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
        indexRedirectNext,
      };
      console.log('response',response);
      res.status(200).json(response);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: `Internal server error ${err}` });
    });
});

module.exports = { router };