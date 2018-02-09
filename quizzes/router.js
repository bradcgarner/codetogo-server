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
router.get('/:idQuiz', (req, res) => {
  let quiz;
  return Quiz.findById(req.params.idQuiz)
    .then(quizFound => {
      quiz = quizFound.apiRepr();

      return Question.find({
        accepted: true,
        idQuiz: ObjectId(req.params.idQuiz)
      });
    })
    .then(questionsFound=>{
      const questions = questionsFound.map(question=>question.apiRepr()).sort((a,b)=>a.index-b.index);
      const response = Object.assign({}, quiz, {questions: questions});
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

// access quiz [from library] by id; get all questions; copy quiz to user; copy questions to user's quiz
router.put('/:idQuiz/users/:idUser', (req, res) => {
  console.log('req.params.idQuiz',req.params.idQuiz);

  // verify quiz with name and idUser doesn't already exist

  let quizLibrary, quizUser, idQuizUser;

  // find quiz in library
  return Quiz.findById(req.params.idQuiz)
    .then(quizFound => {
      console.log('quizFound',quizFound);
      if (ObjectId(quizFound._id).toString() !== req.params.idQuiz){
        throw 'Quiz not found!';
      }
      quizLibrary = quizFound;

      // copy quiz to user... damn Mongo doesn't allow Object.assign
      const quizToCreate = {
        name: quizFound.name,
        description: quizFound.description,
        category: quizFound.category,
        difficulty: quizFound.difficulty,
        total: quizFound.total,
        idUser: ObjectId(req.params.idUser),
        score: 0,
        indexCurrent: 0,
        library: false,
      };
      console.log('quizToCreate',quizToCreate);
      return Quiz.create(quizToCreate);
    })
    .then(()=>{
      return Quiz.find({
        name: quizLibrary.name,
        idUser: ObjectId(req.params.idUser)
      });
    })
    .then(quizCreated=>{
      quizUser = quizCreated[0];
      console.log('quizUser',quizUser);
      console.log('quizUser.idUser',quizUser.idUser);
      console.log('typeof',typeof quizUser.idUser);
      if (ObjectId(quizUser.idUser).toString() !== req.params.idUser){
        throw 'Quiz not successfully copied to user!';
      }

      // find questions in library
      return Question.find({
        accepted: true,
        idQuiz: ObjectId(req.params.idQuiz)
      });
    }).then(questionsFound=>{
      console.log('questionsFound[0]',questionsFound.length, questionsFound[0]);
      if (ObjectId(questionsFound[0].idQuiz).toString() !== ObjectId(quizLibrary._id).toString()){
        throw 'Questions not found';
      }
      // copy questions to user
      console.log('quizUser._id',quizUser._id);
      console.log('typeof ',typeof quizUser._id);
      idQuizUser = ObjectId(quizUser._id).toString();

      const questionsUser = questionsFound.map(question=>{
        return {
          accepted: true,
          idUser: ObjectId(req.params.idUser),
          idQuiz: ObjectId(idQuizUser),
          nameQuiz: question.name,
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
      return Question.insertMany(questionsUser);

      // Mongo makes us find the questions ourselves... damn Mongo!
    }).then(()=>{

      console.log('idQuizUser',idQuizUser);
      console.log('typeof ',typeof idQuizUser);
      return Question.find({
        accepted: true,
        idQuiz: ObjectId(idQuizUser)
      });

      // respond
    }).then(rawQuestions=>{
      const questions = rawQuestions.map(question=>question.apiRepr()).sort((a,b)=>a.index-b.index);
      console.log('questions[0]',questions[0]);

      if (ObjectId(questions[0].idQuiz).toString() !== idQuizUser){
        throw 'Questions not successfully copied to user';
      }
      const response = {
        name: quizUser.name,
        description: quizUser.description,
        category: quizUser.category,
        difficulty: quizUser.difficulty,
        total: quizUser.total,
        idUser: quizUser.idUser,
        score: quizUser.score,
        indexCurrent: quizUser.indexCurrent,
        questions: questions
      };
      return res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
    });
});

module.exports = { router };