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
  // console.log('all Quiz Choices ', choices); 
  const completed = choices.length;
  // console.log('completed',completed); 
  const choicesCorrect = choices.filter(choice => choice.correct === true );
  // console.log('choicesCorrect', choicesCorrect); 
  const correct = choicesCorrect.length;
  // console.log('correct',correct); 
  return { correct, completed };
};

// NOT for use with take or add; for use with user.lastSession
// check promise handling!!!!!!!!!!!
const scoreQuiz = (quiz, quizId, userId, attempt) => {
  // console.log('score:',quiz, quizId, userId, attempt);
  return Choice.find({ quizId: quizId, userId: userId , attempt: attempt })
    .then(choices=>{
      console.log('choices', choices);
      if(choices.length>0) {
        let score = calcCompletedAndCorrect(choices);
        console.log('score',score);
        quiz.completed = score.completed;
        quiz.correct = score.correct;
        return;
      } else {
        console.log('no choices');
        return;
      }
    });
};

const scoreQuizzes = (allQuizzes, lastSession) => {
  console.log('inside scoreQuizzes:');
  console.log('lastSession', lastSession);
  console.log('--');
  console.log('allQuizzes', allQuizzes);
  const arrayOfPromises = [];
  let promiseCount = 0;
  lastSession.forEach(priorQuiz=>{
    console.log('priorQuiz.quizId:', priorQuiz.quizId);
    console.log('allQuizzes', allQuizzes.length, allQuizzes[0]);
    for (let i = 0; i<allQuizzes.length; i++ ) {
      console.log(i, 'comparison', String(allQuizzes[i].id),String(priorQuiz.quizId), String(allQuizzes[i].id) === String(priorQuiz.quizId));
      if (String(allQuizzes[i].id) === String(priorQuiz.quizId)) {
        console.log('found',i);
        promiseCount++;
        const scorePromise = scoreQuiz(
          allQuizzes[i],
          priorQuiz.quizId, 
          priorQuiz.userId, 
          priorQuiz.attempt
        );
        arrayOfPromises.push(scorePromise);
        i = allQuizzes.length + 1;        
      }
    }
  });
  console.log('arrayOfPromises, allQuizzes, lastSession', arrayOfPromises, allQuizzes, lastSession);
  console.log('-space-');  
  if (promiseCount > 0) {
    console.log('promiseCount',promiseCount);
    return Promise.all(arrayOfPromises);    
  } else {
    console.log('no promises');
    return new Promise ((resolve, reject)=> {
      resolve(true);
    });
  }
};


const ensureLastSessionIsCurrent = returnQuiz => {
  const matchingSession = returnQuiz.user.lastSession.find(quiz=>{
    quiz.id === returnQuiz.quiz.id && quiz.attempt === returnQuiz.attempt;
  });
  if (!matchingSession) {
    returnQuiz.user.lastSession.push({
      quizId: returnQuiz.quiz.id, 
      userId: returnQuiz.user.id, 
      attempt: returnQuiz.quiz.attempt
    });      
  }
  return returnQuiz;
};

const ensureAttemptIsCurrent = returnQuiz => {
  // console.log('user quiz[0] id, quiz id',returnQuiz.user.quizzes[0].id, returnQuiz.quiz.id);
  // console.log('boolean',returnQuiz.user.quizzes[0].id === returnQuiz.quiz.id);
  const index = returnQuiz.user.quizzes.findIndex(quiz=> quiz.id === returnQuiz.quiz.id);
  // console.log('attempt check index', index);
  // what if we don't find a match? should never happen, since we will have just checked that...
  if (index >= 0) {
    returnQuiz.user.quizzes[index].attempt = returnQuiz.quiz.attempt;   
    // console.log('attempt updated #', index);
  }
  // console.log('attempt returning');
  return returnQuiz;
};

const mapChoicesOntoQuestions =(quiz, questions, choices) => {
  const formattedChoices = choices.map(choice=>choiceApiRepr(choice)); // change _id to id
  let oldQuestions = [];
  let newQuestions = [];
  // update quiz question list to include prior choices (as array of strings)
  questions.forEach((question, index)=>{
    const choiceFound = formattedChoices.find(choice=>choice.questionId === question.questionId);
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

const questionApiRepr = function (question, index) {
  // console.log('single question', question);
  return { 
    answers: question.answers.map(answer=> {
      return {
        option: answer.option,
        id: answer._id,
      };
    }), 
    question: question.question,
    inputType: question.inputType,
    stickyIndex: index,    
    id: question._id };
};


// @@@@@@@@@@  T A K E     O R     A D D     Q U I Z  @@@@@@@@@@@@@@
// get quiz id, get user's choices if any, update user if needed
router.put('/:quizId/users/:userId/:add/:attempt/:next', jwtAuth, (req, res) => {
  const [quizId, userId, add, next] = [req.params.quizId, req.params.userId, req.params.add, req.params.next];
  const attempt = parseInt(req.params.attempt);
  const returnQuiz = {
    quiz: null,
    user: null
  };
  let formattedQuestions, mappedQuestions;

  return Quiz.findById(quizId)// response should include id, name, total, category, difficulty
    .then(quiz=>{
      returnQuiz.quiz = quiz.apiRepr();
      returnQuiz.quiz.attempt = attempt;
      returnQuiz.quiz.archive = false;
      console.log('initial returnQuiz',returnQuiz);
    })
    .then(()=>{
      if (next !== 'take') {
        return;

      } else {
        return Question.find({quizId})
          .then(questions => {
            console.log('questions from db, not apiRepr', questions);
            formattedQuestions = questions.map((question,index)=>questionApiRepr(question, index));
            console.log('formattedQuestions', formattedQuestions);
            returnQuiz.quiz.originalLength = formattedQuestions.length;  
            console.log('originalLength', returnQuiz.quiz.originalLength);
            
            return Choice.find({ quizId: quizId, userId: userId , attempt: attempt });
          })
          .then(choices => {
            console.log('FOUND PRIOR CHOICES ~~~~~~~~', choices);
            if (choices.length <= 0 || !choices) {
              returnQuiz.quiz.completed = 0;
              returnQuiz.quiz.correct = 0;
              returnQuiz.quiz.total = formattedQuestions.length;
              console.log('returnQuiz.quiz.total', returnQuiz.quiz.total);
              console.log('returnQuiz no choice w/score:', returnQuiz);
            } else {
              let score = calcCompletedAndCorrect(choices);
              returnQuiz.quiz.completed = score.completed || 0;
              returnQuiz.quiz.correct = score.correct || 0;
              console.log('returnQuiz choices w/score', returnQuiz);
              mappedQuestions = mapChoicesOntoQuestions(returnQuiz.quiz, formattedQuestions, choices);
              console.log('mappedQuestions', mappedQuestions);
              returnQuiz.quiz.total = mappedQuestions.newQuestions.length;
              console.log('returnQuiz.quiz.total', returnQuiz.quiz.total);
            }
            
          });
      } // end else next === take
    }) // end then (for next === take)
    .then(()=>{
      return User.findById(userId);
    })

    .then(user=>{
      console.log('user from db, not apiRepr', user);
      
      returnQuiz.user = user.apiRepr();
      console.log('returnQuiz.user apiRepr', returnQuiz.user);
      
      if (add === 'add') { 
        console.log('add', add);
        returnQuiz.user.quizzes.push(returnQuiz.quiz); 
      }
      console.log('returnQuiz.user.quizzes after add', returnQuiz.user.quizzes);
      
      // this following 2 functions mutate the object passed into it
      // this adds the current quiz & attempt if not already on the last session
      ensureLastSessionIsCurrent(returnQuiz);
      console.log('ensureLastSessionIsCurrent', returnQuiz);
      
      // this makes sure that that user's current attempt matches the attempt passed to the parent function
      ensureAttemptIsCurrent(returnQuiz);
      console.log('ensureAttemptIsCurrent', returnQuiz);
      
      return User.findByIdAndUpdate(userId,
        { $set: {quizzes: returnQuiz.user.quizzes, lastSession: returnQuiz.user.lastSession } }, // later update recent
        { new: true }
      );        
    })

    .then(user=>{
      console.log('user after update', user);
      returnQuiz.user = user;
      console.log('returnQuiz with updated user', returnQuiz); 
      
      if (next === 'take') {
        if (returnQuiz.quiz.completed > 0) {
          returnQuiz.quiz.oldQuestions = mappedQuestions.oldQuestions;        
          returnQuiz.quiz.newQuestions = mappedQuestions.newQuestions;
          console.log('returnQuiz with old & new questions', returnQuiz); 
        } else {
          returnQuiz.quiz.oldQuestions = null;
          returnQuiz.quiz.newQuestions = formattedQuestions;
          console.log('returnQuiz with new questions', returnQuiz); 
        }
      } else {
        returnQuiz.quiz.oldQuestions = null;
        returnQuiz.quiz.newQuestions = null;
        console.log('returnQuiz questions null:', returnQuiz.quiz.newQuestions, returnQuiz.quiz.oldQuestions); 
      }
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

// get all questions by quiz id
router.get('/:quizId/questions/', (req, res) => {
  return Question.find({quizId: req.params.quizId})
    .then(questions => {
      // console.log('unformatted', questions);
      const formattedQuestions = questions.map((question,index)=>questionApiRepr(question, index));
      // console.log('formattedQuestions',formattedQuestions);      
      return res.status(200).json(formattedQuestions);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

module.exports = { router, scoreQuizzes };