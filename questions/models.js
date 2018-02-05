'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const QuestionSchema = mongoose.Schema({
  accepted: { type: Boolean }, // accepted by Admin for inclusion
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // each question belongs to 1 only user
  idQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, // each question belongs to 1 only quiz
  nameQuiz: { type: String },
  question: { type: String },
  typeQuestion: { type: String }, // fact, code, trivia
  answers: { type: Array },
  // Answers does not have its own schema. Each answer is comprised of the following:
  // option: { type: String },
  // correct: { type: Boolean },
  // id: { type: Number }, // Mongo is currently creating ObjectId here...
  typeAnswer: { type: String }, // radio, checkbox, text
  source: { type: String },
  reason: { type: String }, // explanation of correct answer
  difficulty: { type: Number },
  score: { type: Number }, // user's score, after copied to user, defaults to 2
  index: { type: Number }, // sort order of array
  indexNext: { type: Number }, // index number of array
  timestampCreated: { type: String }, // created by Admin
  timestampUpdated: { type: String }, // last answered by User
});

QuestionSchema.methods.apiRepr = function () {
  return { 
    id: this._id,
    question: this.question,
    typeQuestion: this.typeQuestion,
    answers: this.answers.map(answer=>({option: answer.option, id: answer.id})), 
    typeAnswer: this.typeAnswer,
    source: this.source,
    reason: this.reason,
    difficulty: this.difficulty,
    score: this.score,
    index: this.index,
    indexNext: this.indexNext,
  };
};

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

module.exports = { Question };
