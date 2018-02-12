'use strict';
// endpoint is /api/quizzes/

const express = require('express');
const router = express.Router();

const { Quiz } = require('./models');
const { Question } = require('../questions');
const { ObjectId } = require('mongodb').ObjectId;

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

// @@@@@@@@@@@ ENDPOINTS @@@@@@@@@@@@@

// access quiz by id; get all questions
router.get('/:idQuiz/users/:idUser', (req, res) => {
  let quiz;

  return Quiz.findById(req.params.idQuiz)
    .then(quizFound => {
      quiz = quizFound.apiRepr();
      if(ObjectId(quiz.idUser).toString() !== req.params.idUser){
        throw 'Sorry, but this quiz does not seem to belong to this user';
      }
      return Question.find({
        accepted: true,
        idQuiz: ObjectId(req.params.idQuiz)
      });
    })
    .then(questionsFound=>{
      const questions = questionsFound.map(question=>question.apiRepr()).sort((a,b)=>a.index-b.index);
      const response = Object.assign({}, {quiz: quiz, questions: questions});
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

// access quiz [from library] by id; get all questions; copy quiz to user; copy questions to user's quiz
router.put('/:idQuiz/users/:idUser', (req, res) => {
  console.log('req.params.idQuiz',req.params.idQuiz);
  let quizLibrary, quizUser, idQuizUser, idQuizUserString, existingQuizFound;

  // verify quiz with name and idUser doesn't already exist
  return Quiz.find({
    idUser: ObjectId(req.params.idUser),
    idOrigin: ObjectId(req.params.idQuiz)
  })
    .then(existingQuizzesFound=>{
      if (Array.isArray(existingQuizzesFound)){
        if(existingQuizzesFound.length > 0) {
          const existingQuizzes = existingQuizzesFound.map(quiz=>{
            return { id: quiz._id, version: quiz.version};
          }).sort((a,b)=>b.version-a.version);
          return existingQuizzes[0];
        }
      }
      return {id: null, version: null};
    })
    .then(mostRecentExistingQuizFound=>{
      existingQuizFound = mostRecentExistingQuizFound;
      console.log('existingQuizFound',existingQuizFound);
      // find quiz in library
      return Quiz.findById(req.params.idQuiz);
    })
    .then(quizFound => {
      console.log('quizFound',quizFound);
      if (ObjectId(quizFound._id).toString() !== req.params.idQuiz){
        throw 'Quiz not found!';
      }
      if (!(quizFound.library)){
        throw 'Quiz cannot be copied!';
      }
      if (quizFound.version === existingQuizFound.version){
        throw 'Quiz not copied, already exists!';
      }
      quizLibrary = quizFound;

      // copy quiz to user... damn Mongo doesn't allow Object.assign
      const quizToCreate = {
        idOrigin: ObjectId(req.params.idQuiz),
        idUser: ObjectId(req.params.idUser),
        library: false,
        name: quizFound.name,
        version: quizFound.version,
        notes: quizFound.notes,
        category: quizFound.category,
        description: quizFound.description,
        difficulty: quizFound.difficulty,
        total: quizFound.total,
        score: 0,
        indexCurrent: 0,
      };
      // console.log('quizToCreate',quizToCreate);
      return Quiz.create(quizToCreate);
    })
    .then(()=>{
      return Quiz.find({
        name: quizLibrary.name,
        idUser: ObjectId(req.params.idUser)
      });
    })
    .then(quizCreated=>{
      quizUser = quizCreated[0].apiRepr();
      // console.log('quizUser',quizUser);
      // console.log('quizUser.idUser',quizUser.idUser);
      // console.log('typeof',typeof quizUser.idUser);
      if (ObjectId(quizUser.idUser).toString() !== req.params.idUser){
        throw 'Quiz not successfully copied to user!';
      }

      // find questions in library
      return Question.find({
        accepted: true,
        idQuiz: ObjectId(req.params.idQuiz)
      });
    }).then(questionsFound=>{
      // console.log('questionsFound[0]',questionsFound.length, questionsFound[0]);
      if (ObjectId(questionsFound[0].idQuiz).toString() !== ObjectId(quizLibrary._id).toString()){
        throw 'Questions not found';
      }
      // copy questions to user
      // console.log('quizUser._id',quizUser._id);
      // console.log('typeof ',typeof quizUser._id);
      idQuizUserString = ObjectId(quizUser._id).toString();
      console.log('idQuizUserString',typeof idQuizUserString,idQuizUserString);
      idQuizUser = quizUser._id;

      const questionsUser = questionsFound.map(question=>{
        return {
          accepted: true,
          idUser: ObjectId(req.params.idUser),
          idQuiz: ObjectId(idQuizUserString),
          nameQuiz: question.name,
          version: question.version,
          question: question.question,
          typeQuestion: question.typeQuestion,
          answers: question.answers,
          typeAnswer: question.typeAnswer,
          source: question.source,
          reason: question.reason,
          difficulty: question.difficulty,
          score: 0,
          index: question.index,
          indexNext: question.indexNext,
          timestampCreated: new Date(),
          timestampUpdated: new Date(),
        };
      });
      console.log('questionsUser[0]',questionsUser[0]);
      console.log('questionsUser[0].idQuiz',typeof questionsUser[0].idQuiz, questionsUser[0].idQuiz);
      return Question.insertMany(questionsUser);

      // Mongo makes us find the questions ourselves... damn Mongo!
    }).then(()=>{

      // console.log('idQuizUser',idQuizUser);
      // console.log('typeof ',typeof idQuizUser);
      return Question.find({
        accepted: true,
        idQuiz: ObjectId(idQuizUserString)
      });

      // respond
    }).then(rawQuestions=>{
      const questions = rawQuestions.map(question=>question.apiRepr()).sort((a,b)=>a.index-b.index);
      // console.log('questions[0]',questions[0]);

      if (ObjectId(questions[0].idQuiz).toString() !== idQuizUserString){
        throw 'Questions not successfully copied to user';
      }
      const response = { quiz: quizUser, questions: questions };
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

router.put('/:idQuiz/reset', (req, res) => {
  return Question.find({
    idQuiz: ObjectId(req.params.idQuiz)
  })
    .then(questions=>{
      const promiseArray = questions.map(question=>{
        const id = ObjectId(question._id).toString();
        return Question.findByIdAndUpdate(id, {
          score: 2,
          indexNext: question.index === questions.length -1 ? 0 : question.index + 1 ,
        });
      });
      return Promise.all(promiseArray);
    })
    .then(()=>{
      res.sendStatus(204);
    })
    .catch(err=>{
      console.log('error', err);
    });
});

module.exports = { router };