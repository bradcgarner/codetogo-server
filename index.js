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

app.use(morgan('combined'));

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

// option below is to serve up html from the server, vs client
app.use(express.static('public'));
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/views/index.html');
// });

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

function closeServer() {
  return mongoose.disconnect()
    .then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = {app, runServer, closeServer};