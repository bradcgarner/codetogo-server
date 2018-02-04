'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const QuestionSchema = mongoose.Schema({
  question: { type: String },
  typeQuestion: { type: String }, // fact, code, trivia
  answers: [{
    option: { type: String },
    correct: { type: Boolean },
    id: { type: Number }, // Mongo is currently creating ObjectId here...
  }],
  typeAnswer: { type: String }, // radio, checkbox, text
  source: { type: String },
  reason: { type: String }, // explanation of correct answer
  difficulty: { type: Number },
  score: { type: Number }, // user's score, after copied to user, defaults to 2
  index: { type: Number }, // sort order of array
  nextIndex: { type: Number }, // index number of array
  idQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }, // each question belongs to 1 only quiz
});

QuestionSchema.methods.apiRepr = function () {
  return { 
    question: this.question,
    typeQuestion: this.typeQuestion,
    answers: this.answers.map(option=>delete option.correct), 
    typeAnswer: this.typeAnswer,
    source: this.source,
    reason: this.reason,
    difficulty: this.difficulty,
    score: this.score,
    index: this.index,
    nextIndex: this.nextIndex,
    idQuiz: this.idQuiz,
    id: this._id };
};

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

module.exports = { Question };
