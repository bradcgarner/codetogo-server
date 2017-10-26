'use strict';
const express = require('express');

const {PORT, DATABASE_URL} = require('./config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const app = express();

const { Quiz, Question } = require('./quizzes');
const { User, Choice } = require('./users');

const listOfQuizzes = [
  {
    name: 'HTML Very Basic',
    description: 'This is a quiz of HTML',
    category: 'HTML',
    difficulty: 1,
    total: 1
  }, 
  { 
    name: 'CSS Basic',
    description: 'This is a quiz of CSS',
    category: 'CSS',
    difficulty: 1,
    total: null
  },
  {
    name: 'JS Basic',
    description: 'This is a quiz of HTML',
    category: 'JS',
    difficulty: 1,
    total: null
  }, 
  { 
    name: 'jQuery Quiz',
    description: 'Are you still using that?',
    category: 'JS',
    difficulty: 2,
    total: null
  },  {
    name: 'React Quiz',
    description: 'Oh yeah!',
    category: 'JS',
    difficulty: 3,
    total: null
  }, 
  { 
    name: 'HTML a11y',
    description: 'Learn it! Use it!',
    category: 'HTML',
    difficulty: 2,
    total: null
  }
];


const listOfQuestions = [
  // @@@@@@@@@@@@ 1ST LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ HTML QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a DOM?',
      answers: [{
        option: 'Document Object Model',
        correct: true,
      },
      {
        option: 'Name of Dog',
        correct: false,
      },
      {
        option: 'Mobster Name',
        correct: false,
      },
      {
        option: 'Department of Ministry',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a HTML5?',
      answers: [{
        option: 'name of HTML',
        correct: false,
      },
      {
        option: 'version of HTML',
        correct: true,
      },
      {
        option: 'Structure of HTML',
        correct: false,
      },
      {
        option: 'name of DOM',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a semantic HTML?',
      answers: [{
        option: 'Name of HTML tag',
        correct: false,
      },
      {
        option: 'HTML version',
        correct: false,
      },
      {
        option: 'Meaning and Information of the webpage',
        correct: true,
      },
      {
        option: 'use of HTML',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
  // @@@@@@@@@@@@ 2ND LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ CSS QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a CSS?',
      answers: [{
        option: 'Cascading Style Sheet',
        correct: true,
      },
      {
        option: 'Customer style sheet',
        correct: false,
      },
      {
        option: 'Version of style sheet',
        correct: false,
      },
      {
        option: 'use of style sheet',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'Why is CSS used?',
      answers: [{
        option: 'For layout of webpage',
        correct: false,
      },
      {
        option: 'styling to the web page',
        correct: true,
      },
      {
        option: 'conect with the database',
        correct: false,
      },
      {
        option: 'to connect JQuery',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What does \'Cascade\' refer to?',
      answers: [{
        option: 'Dishwashing liqud',
        correct: false,
      },
      {
        option: 'A place to whitewater raft',
        correct: false,
      },
      {
        option: 'The most confusing rule of CSS property assignment',
        correct: true,
      },
      {
        option: 'What CSS does when it breaks',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'How do you use hex colors in CSS?',
      answers: [{
        option: 'Doesn\'t matter as long as you use 6',
        correct: false,
      },
      {
        option: '#abc',
        correct: true,
      },
      {
        option: '#80fc53',
        correct: true,
      },
      {
        option: 'CSS doesn\'t use hex colors',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is relative positioning?',
      answers: [{
        option: 'That\'s physics, not CSS',
        correct: false,
      },
      {
        option: 'Offset from static positioning',
        correct: true,
      },
      {
        option: 'A way to float the darkest colors to the front',
        correct: false,
      },
      {
        option: 'A way to get ahead in front-end development',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
  // @@@@@@@@@@@@ 3RD LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ JS BASIC QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a DOM?',
      answers: [{
        option: 'Document Object Model',
        correct: true,
      },
      {
        option: 'Name of Dog',
        correct: false,
      },
      {
        option: 'Mobster Name',
        correct: false,
      },
      {
        option: 'Department of Ministry',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a HTML5?',
      answers: [{
        option: 'name of HTML',
        correct: false,
      },
      {
        option: 'version of HTML',
        correct: true,
      },
      {
        option: 'Structure of HTML',
        correct: false,
      },
      {
        option: 'name of DOM',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a semantic HTML?',
      answers: [{
        option: 'Name of HTML tag',
        correct: false,
      },
      {
        option: 'HTML version',
        correct: false,
      },
      {
        option: 'Meaning and Information of the webpage',
        correct: true,
      },
      {
        option: 'use of HTML',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
  // @@@@@@@@@@@@ 4TH LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ JQUER QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a CSS?',
      answers: [{
        option: 'Cascading Style Sheet',
        correct: true,
      },
      {
        option: 'Customer style sheet',
        correct: false,
      },
      {
        option: 'Version of style sheet',
        correct: false,
      },
      {
        option: 'use of style sheet',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'Why is CSS used?',
      answers: [{
        option: 'For layout of webpage',
        correct: false,
      },
      {
        option: 'styling to the web page',
        correct: true,
      },
      {
        option: 'conect with the database',
        correct: false,
      },
      {
        option: 'to connect JQuery',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What does \'Cascade\' refer to?',
      answers: [{
        option: 'Dishwashing liqud',
        correct: false,
      },
      {
        option: 'A place to whitewater raft',
        correct: false,
      },
      {
        option: 'The most confusing rule of CSS property assignment',
        correct: true,
      },
      {
        option: 'What CSS does when it breaks',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'How do you use hex colors in CSS?',
      answers: [{
        option: 'Doesn\'t matter as long as you use 6',
        correct: false,
      },
      {
        option: '#abc',
        correct: true,
      },
      {
        option: '#80fc53',
        correct: true,
      },
      {
        option: 'CSS doesn\'t use hex colors',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is relative positioning?',
      answers: [{
        option: 'That\'s physics, not CSS',
        correct: false,
      },
      {
        option: 'Offset from static positioning',
        correct: true,
      },
      {
        option: 'A way to float the darkest colors to the front',
        correct: false,
      },
      {
        option: 'A way to get ahead in front-end development',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
  // @@@@@@@@@@@@ 5TH LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ REACT QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a DOM?',
      answers: [{
        option: 'Document Object Model',
        correct: true,
      },
      {
        option: 'Name of Dog',
        correct: false,
      },
      {
        option: 'Mobster Name',
        correct: false,
      },
      {
        option: 'Department of Ministry',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a HTML5?',
      answers: [{
        option: 'name of HTML',
        correct: false,
      },
      {
        option: 'version of HTML',
        correct: true,
      },
      {
        option: 'Structure of HTML',
        correct: false,
      },
      {
        option: 'name of DOM',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is a semantic HTML?',
      answers: [{
        option: 'Name of HTML tag',
        correct: false,
      },
      {
        option: 'HTML version',
        correct: false,
      },
      {
        option: 'Meaning and Information of the webpage',
        correct: true,
      },
      {
        option: 'use of HTML',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
  // @@@@@@@@@@@@ 6TH LIST OF QUESTIONS @@@@@@@@@
  // @@@@@@@@@@@@ A11Y QUIZ @@@@@@@@@
  [
    {
      inputType: 'checkbox', 
      question: 'What is a CSS?',
      answers: [{
        option: 'Cascading Style Sheet',
        correct: true,
      },
      {
        option: 'Customer style sheet',
        correct: false,
      },
      {
        option: 'Version of style sheet',
        correct: false,
      },
      {
        option: 'use of style sheet',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'Why is CSS used?',
      answers: [{
        option: 'For layout of webpage',
        correct: false,
      },
      {
        option: 'styling to the web page',
        correct: true,
      },
      {
        option: 'conect with the database',
        correct: false,
      },
      {
        option: 'to connect JQuery',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What does \'Cascade\' refer to?',
      answers: [{
        option: 'Dishwashing liqud',
        correct: false,
      },
      {
        option: 'A place to whitewater raft',
        correct: false,
      },
      {
        option: 'The most confusing rule of CSS property assignment',
        correct: true,
      },
      {
        option: 'What CSS does when it breaks',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'How do you use hex colors in CSS?',
      answers: [{
        option: 'Doesn\'t matter as long as you use 6',
        correct: false,
      },
      {
        option: '#abc',
        correct: true,
      },
      {
        option: '#80fc53',
        correct: true,
      },
      {
        option: 'CSS doesn\'t use hex colors',
        correct: false,
      }
      ]
    },
    {
      inputType: 'checkbox', 
      question: 'What is relative positioning?',
      answers: [{
        option: 'That\'s physics, not CSS',
        correct: false,
      },
      {
        option: 'Offset from static positioning',
        correct: true,
      },
      {
        option: 'A way to float the darkest colors to the front',
        correct: false,
      },
      {
        option: 'A way to get ahead in front-end development',
        correct: false,
      }
      ]
    }
  ], // END ARRAY OF QUESTIONS
];

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
    const arrayOfPromises = listOfQuizzes.map((quiz, index)=>{
      console.log('1 in array of promises');
      console.log('quiz#', index, quiz);
      return Quiz.create(listOfQuizzes[index]);
    });
    console.log('array of promises', arrayOfPromises);
    return Promise.all(arrayOfPromises);
  })
  .then((quizzes)=> {
    // console.log(quizzes);
    return quizzes.map(quiz=>quiz._id);
  })
  .then((ids)=>{
    return listOfQuestions.forEach((questionArray, index)=>{
      questionArray.forEach((question) => {
        question.quizId = ids[index];
      });
    });
  })
  .then(()=> {
    const arrayOfQuestionPromises = listOfQuestions.map((question, index)=>{
      return Question.insertMany(listOfQuestions[index]); // insertMany because inner array
    });
    return Promise.all(arrayOfQuestionPromises);
  })
  .then(questions => {
    // loop through questions and get total # per quiz, and update total property in quizzes;
    console.log('SUCCESS! CHECK YOUR DATABASE!!');
  })
  .then(()=>{
    const arrayOfUpdates = listOfQuizzes.map(quiz => {
      return Quiz.find({'name': quiz.name})
        .then(quiz=>{
          console.log('1',  quiz);
          return quiz[0]._id;
        })
        .then((id)=>{
          console.log('2', id);
          return Question.find({quizId: id});
        })
        .then((questions)=>{
          console.log('3 questions', questions);
          const count = questions.length;
          const quizId = questions[0].quizId;
          console.log('4 count, quizId', count, quizId);
          return Quiz.findByIdAndUpdate(quizId, {$set: {'total': count}}, { new: true });
        })
        .then((quiz)=>{
          return console.log('5 updated quiz', quiz);
        });
    }); // end arrayOfUpdates
    console.log('start promises');
    return Promise.all(arrayOfUpdates);
  })
  .then(()=>{
    console.log('SUCCESS! TOTALS ADDED TO DATABASE!!');        
  })    
  .catch(err => {
    console.log(err);
  });