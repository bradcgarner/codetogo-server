'use strict';
// endpoint is /api/quizzes/
// index: helpers, put, post, delete (no post)

const express = require('express');
const router = express.Router();

const { Choice, Quiz, Question } = require('./models');
const { choiceApiRepr } = require('./choices');
const { User } = require('./users');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });


const calcCompletedAndCorrect = (choices) => {
  console.log('all Quiz Choices ', choices); 
  const completed = choices.length;
  console.log('completed',completed); 
  const choicesCorrect = choices.filter(choice => choice.correct === true );
  console.log('choicesCorrect',choicesCorrect); 
  const correct = choicesCorrect.length;
  console.log('correct',correct); 
  return { correct, completed };
};


// TAKE OR ADD QUIZ
// get quiz id, get user's choices if any, update user if needed
router.put('/:quizId/users/:userId/:attempt', jwtAuth, (req, res) => {
  const [quizId, userId, attempt] = [req.params.quizId, req.params.userId, req.params.attempt];
  const returnQuiz = {attempt, correct: 0, completed: 0};
  let formattedChoices, formattedQuestions, newQuestions, oldQuestions;
  // find questions this quiz
  return Question.find({quizId})
    .then(questions => {
      // format questions
      formattedQuestions = questions.map(question=>questionApiRepr(question));
      returnQuiz.originalLength = formattedQuestions.length;      
      // if user has made any prior attempts
      if (attempt) {
        // find prior choices
        return Choice.find({quizId, userId, attempt})
          .then(choices => {
            if (choices) {
              formattedChoices = choices.map(choice=>choiceApiRepr(choice)); // change _id to id
              // score quiz
              const score = calcCompletedAndCorrect(formattedChoices);
              returnQuiz.correct; score.correct;
              returnQuiz.completed = score.completed; 
              // update quiz question list to include prior choices (as array of strings)
              formattedQuestions.forEach(question=>{
                const theChoice = formattedChoices.find(choice=>choice.questionId === question.questionId);
                if (theChoice) { 
                  question.choices = theChoice.choices; 
                  question.correct = theChoice.correct; 
                  oldQuestions.push(question);
                } else {
                  newQuestions.push(question);
                }
              });
              returnQuiz.total = newQuestions.length;
              res.status(201).json(returnQuiz); 
            }
          });
      } else {
        return Quiz.findById(quizId)
        // should include id, name, total, category, difficulty
          .then(quiz=>{
            quiz.attempt = 0;
            quiz.archive = false;
            quiz.completed = 0;
            quiz.correct = 0;
          })
          .then(quiz=>{
            return User.findByIdAndUpdate(userId,
              { $push: {quizzes: quiz } }, // recent: updateUser.recent
              { new: true },
              function (err, user) {
                // console.log('err after err, user',err);
                if (err) return res.status(500).json({message: 'user not found', error: err});
                // console.log('found');
                const formattedUser = user.apiRepr();    
                // console.log('filteredUser', filteredUser);
                res.status(201).json(formattedUser);
              });
          });
      } 
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
      // console.log(err);
    });
});

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

const questionApiRepr = function (question) {
  // console.log('single question', question);
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

// get all questions by quiz id
router.get('/:quizId/questions/', (req, res) => {
  return Question.find({quizId: req.params.quizId})
    .then(questions => {
      // console.log('unformatted', questions);
      const formattedQuestions = questions.map(question=>questionApiRepr(question));
      // console.log('formattedQuestions',formattedQuestions);      
      return res.status(200).json(formattedQuestions);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

module.exports = { router };