'use strict';

const {Quiz,Question} = require('./models');
const {router, scoreQuizzes} = require('./router');

module.exports = {Quiz, router, Question, scoreQuizzes};
