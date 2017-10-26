'use strict';
const express = require('express');
const app = express();

const {PORT, CLIENT_ORIGIN, DATABASE_URL} = require('./config');

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const { router: userRouter } = require('./users');
const { router: quizRouter } = require('./quizzes');
const { router: choiceRouter } = require('./choices');

const { router: authRouter, basicStrategy, jwtStrategy } = require('./auth');
const passport = require('passport');
passport.use(basicStrategy);
passport.use(jwtStrategy);

const cors = require('cors');
const morgan = require('morgan');

// app.use(
//   morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
//     skip: (req, res) => process.env.NODE_ENV === 'test'
//   })
// );
app.use(morgan('combined'));

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);



app.use('/api/users', userRouter);
app.use('/api/choices', choiceRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/auth/', authRouter);

app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

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
          console.error('Express failed to start');
          console.error(err);
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = {app};
