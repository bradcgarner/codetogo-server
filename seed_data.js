'use strict';
const express = require('express');

const {PORT, DATABASE_URL} = require('./config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const app = express();

const { Quiz } = require('./quizzes');
const { Question } = require('./questions');
const ObjectId = require('mongodb').ObjectId;

const quiz = {
  name: 'HTML Very Basic 15',
  version: 1,
  notes: '',
  category: 'HTML',
  description: 'This is a quiz of HTML',
  difficulty: 1,
};

const questions = [
  {
    question: 'how did 0 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 1 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 2 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 3 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 4 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 5 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 6 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 7 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 8 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 9 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 10 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 11 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 12 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 13 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 14 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 15 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 16 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 17 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 18 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
    difficulty: 3,
  },
  {
    question: 'how did 19 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 20 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
  {
    question: 'how did 21 chicken cross the street?',
    typeQuestion: 'trivia',
    answers: [
      { option: 'a good option', correct: true },
      { option: 'a bad option' }
    ],
    typeAnswer: 'radio',
    source: [
      'The Google',
      'bradgarner.com'
    ],
    reason: 'because I just know!',
  },
];

const formatQuestions = (questions, idQuiz) => {
  return questions.map((question,index)=>{
    return Object.assign({},
      question, 
      {
        accepted: typeof question.accepted === 'boolean' ? question.accepted : true ,
        library: true,
        idQuiz,
        version: quiz.version,
        answers: question.answers.map(answer=>{
          return Object.assign({}, answer, {id: ObjectId()});
        }),
        difficulty: typeof question.difficulty === 'number' ? question.difficulty : quiz.difficulty ,
        score: 2,
        index,
        indexNext: (index + 1) === questions.length ? 0 : index + 1,
        timestampCreated: new Date(),
      }
    );
  });
};

function dbConnect(url = DATABASE_URL) {
  return mongoose.connect(DATABASE_URL, {useMongoClient: true}).catch(err => {
    console.error('Mongoose failed to connect');
    console.error(err);
  });
}
  
let server;
  
function runServer(url = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(url, { useMongoClient: true }, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

return runServer()  
  .then(()=> {
    const formattedQuiz = Object.assign({}, quiz,
      {
        library: true,
        total: questions.length,
        score: 0,
        indexCurrent: 0,
      });
    console.log('formattedQuiz',formattedQuiz);
    return Quiz.create(formattedQuiz);
  })
  .then(returnedQuiz=> {
    console.log('returnedQuiz',returnedQuiz);
    const listOfQuestions = formatQuestions(questions, returnedQuiz._id);
    console.log('listOfQuestions',listOfQuestions);
    return Question.insertMany(listOfQuestions);
  })
  .then(questions => {
    console.log('questions',questions);
    // loop through questions and get total # per quiz, and update total property in quizzes;
    console.log('SUCCESS! CHECK YOUR DATABASE!!');
  })   
  .catch(err => {
    console.log(err);
  });