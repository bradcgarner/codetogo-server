'use strict';
// endpoint is /api/quizzes/
// index: helpers, put, post, delete (no post)

const express = require('express');
const router = express.Router();

const { Quiz, Question } = require('./models');
const { Choice, choiceApiRepr } = require('../choices');
const { User } = require('../users');

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
  console.log('choicesCorrect', choicesCorrect); 
  const correct = choicesCorrect.length;
  console.log('correct',correct); 
  return { correct, completed };
};

// NOT for use with take or add; for use with user.lastSession
// check promise handling!!!!!!!!!!!
const scoreQuiz = (quizId, userId, attempt) => {
  Choice.find({ quizId: quizId, userId: userId , attempt: attempt })
    .then(choices=>{
      console.log('choices[0]', choices[0]);
      if(choices.length>0) {
        return calcCompletedAndCorrect(choices);
      } else {
        console.log('no choices');
        return;
      }
    });
};


const ensureLastSessionIsCurrent = returnQuiz => {
  const matchingSession = returnQuiz.user.lastSession.find(quiz=>{
    quiz.id === returnQuiz.quiz.id && quiz.attempt === returnQuiz.attempt;
  });
  if (!matchingSession) {
    returnQuiz.user.lastSession.push({
      quizId: returnQuiz.quiz.quizId, 
      userId: returnQuiz.user.userId, 
      attempt: returnQuiz.quiz.attempt
    });      
  }
  return returnQuiz;
};

const ensureAttemptIsCurrent = returnQuiz => {
  const index = returnQuiz.user.quizzes.findIndex(quiz=>{
    quiz.id === returnQuiz.quiz.id;
  });
  // what if we don't find a match? should never happen, since we will have just checked that...
  if (index) {
    returnQuiz.user.quizzes[index].attempt = returnQuiz.quiz.attempt;    
  }
  return returnQuiz;
};

const mapChoicesOntoQuestions =(quiz, questions, choices) => {
  const formattedChoices = choices.map(choice=>choiceApiRepr(choice)); // change _id to id
  let oldQuestions = [];
  let newQuestions = [];
  // update quiz question list to include prior choices (as array of strings)
  questions.forEach((question, index)=>{
    const choiceFound = formattedChoices.find(choice=>choice.questionId === question.questionId);
    question.stickyIndex = index;
    if (choiceFound) { 
      question.choices = choiceFound.choices; 
      question.correct = choiceFound.correct; 
      oldQuestions.push(question);
    } else {
      newQuestions.push(question);
    }
  });
  return {oldQuestions, newQuestions};
};


// @@@@@@@@@@  T A K E     O R     A D D     Q U I Z  @@@@@@@@@@@@@@
// get quiz id, get user's choices if any, update user if needed
router.put('/:quizId/users/:userId/:add/:attempt/:next', jwtAuth, (req, res) => {
  const [quizId, userId, add, attempt, next] = [req.params.quizId, req.params.userId, req.params.add, req.params.attempt, req.params.next];
  const returnQuiz = {
    quiz: null,
    user: null
  };
  let formattedQuestions, mappedQuestions;

  return Quiz.findById(quizId)// response should include id, name, total, category, difficulty
    .then(quiz=>{
      returnQuiz.quiz = quiz;
      returnQuiz.quiz.attempt = attempt;
      returnQuiz.quiz.archive = false;
      console.log('returnQuiz',returnQuiz);
    })
    .then(()=>{
      if (next !== 'take') {
        return;

      } else {
        return Question.find({quizId})
          .then(questions => {
            formattedQuestions = questions.map(question=>questionApiRepr(question));
            returnQuiz.quiz.originalLength = formattedQuestions.length;  
            
            return Choice.find({ quizId: quizId, userId: userId , attempt: attempt });
          })
          .then(choices => {
            if (choices.length <= 0 || !choices) {
              returnQuiz.quiz.completed = 0;
              returnQuiz.quiz.correct = 0;
            } else {
              let score = calcCompletedAndCorrect(choices);
              returnQuiz.quiz.completed = score.completed || 0;
              returnQuiz.quiz.correct = score.correct || 0;
              mappedQuestions = mapChoicesOntoQuestions(returnQuiz.quiz, formattedQuestions, choices);
            }

            returnQuiz.quiz.total = returnQuiz.quiz.newQuestions.length;
            
          });
      } // end else next === take
    }) // end then (for next === take)
    .then(()=>{
      return User.findById(userId);
    })

    .then(user=>{
      returnQuiz.user = user.apiRepr();
      if (add === 'add') { returnQuiz.user.quizzes.push(returnQuiz.quiz); }
      // this following 2 functions mutate the object passed into it
      // this adds the current quiz & attempt if not already on the last session
      ensureLastSessionIsCurrent(returnQuiz);
      // this makes sure that that user's current attempt matches the attempt passed to the parent function
      ensureAttemptIsCurrent(returnQuiz);

      return User.findByIdAndUpdate(userId,
        { $set: {quizzes: returnQuiz.user.quizzes, lastSession: returnQuiz.user.lastSession } }, // later update recent
        { new: true }
      );        
    })

    .then(user=>{
      returnQuiz.user = user;
      returnQuiz.quiz.oldQuestions = mappedQuestions.oldQuestions;
      returnQuiz.quiz.newQuestions = mappedQuestions.newQuestions;
      console.log('returnQuiz to send', returnQuiz); 
      res.status(201).json(returnQuiz);  
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: `Internal server error ${err}` });
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

module.exports = { router, scoreQuizzes };