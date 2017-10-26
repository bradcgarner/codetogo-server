'use strict';
const express = require('express');

const {PORT, DATABASE_URL} = require('./config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const app = express();

const { Quiz } = require('./quizzes');
const { User } = require('./users');

const listOfQuizzes = [
  {
    name: 'HTML Quiz',
    description: 'This is a quiz of HTML',
    questions: [{
      id: 1, 
      question: 'What is a DOM?',
      answers: [{
        answer: 'Document Object Model',
        correct: true,
        id: 1
      },
      {
        answer: 'Name of Dog',
        correct: false,
        id: 2
      },
      {
        answer: 'Mobster Name',
        correct: false,
        id: 3
      },
      {
        answer: 'Department of Ministry',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 2, 
      question: 'What is a HTML5?',
      answers: [{
        answer: 'name of HTML',
        correct: false,
        id: 1
      },
      {
        answer: 'version of HTML',
        correct: true,
        id: 2
      },
      {
        answer: 'Structure of HTML',
        correct: false,
        id: 3 
      },
      {
        answer: 'name of DOM',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 3, 
      question: 'What is a semantic HTML?',
      answers: [{
        answer: 'Name of HTML tag',
        correct: false,
        id: 1
      },
      {
        answer: 'HTML version',
        correct: false,
        id: 2
      },
      {
        answer: 'Meaning and Information of the webpage',
        correct: true,
        id: 3 
      },
      {
        answer: 'use of HTML',
        correct: false,
        id: 4
      }
      ]
    }
    ] // end of array of questions
  }, // end of quiz
  { // start new quiz
    name: 'CSS Quiz',
    description: 'This is a quiz of CSS',
    questions: [{
      id: 1, 
      question: 'What is a CSS?',
      answers: [{
        answer: 'Cascading Style Sheet',
        correct: true,
        id: 1
      },
      {
        answer: 'Customer style sheet',
        correct: false,
        id: 2
      },
      {
        answer: 'Version of style sheet',
        correct: false,
        id: 3 
      },
      {
        answer: 'use of style sheet',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 2, 
      question: 'Why is CSS used?',
      answers: [{
        answer: 'For layout of webpage',
        correct: false,
        id: 1
      },
      {
        answer: 'styling to the web page',
        correct: true,
        id: 2
      },
      {
        answer: 'conect with the database',
        correct: false,
        id: 3 
      },
      {
        answer: 'to connect JQuery',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 3, 
      question: 'What does \'Cascade\' refer to?',
      answers: [{
        answer: 'Dishwashing liqud',
        correct: false,
        id: 1
      },
      {
        answer: 'A place to whitewater raft',
        correct: false,
        id: 2
      },
      {
        answer: 'The most confusing rule of CSS property assignment',
        correct: true,
        id: 3 
      },
      {
        answer: 'What CSS does when it breaks',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 4, 
      question: 'How do you use hex colors in CSS?',
      answers: [{
        answer: 'Doesn\'t matter as long as you use 6',
        correct: false,
        id: 1
      },
      {
        answer: '#abc',
        correct: true,
        id: 2
      },
      {
        answer: '#80fc53',
        correct: true,
        id: 3 
      },
      {
        answer: 'CSS doesn\'t use hex colors',
        correct: false,
        id: 4
      }
      ]
    },
    {
      id: 5, 
      question: 'What is relative positioning?',
      answers: [{
        answer: 'That\'s physics, not CSS',
        correct: false,
        id: 1
      },
      {
        answer: 'Offset from static positioning',
        correct: true,
        id: 2
      },
      {
        answer: 'A way to float the darkest colors to the front',
        correct: false,
        id: 3 
      },
      {
        answer: 'A way to get ahead in front-end development',
        correct: false,
        id: 4
      }
      ]
    }
    ]
  }];

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
    Quiz.insertMany(listOfQuizzes)
      .then(quizzes => {
        console.log(quizzes);
      })
      .catch(err => {
        console.log(err);
      });
  });