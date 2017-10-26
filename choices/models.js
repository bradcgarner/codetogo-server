'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ChoiceSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  attempt: { type: Number },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  choices: [ { type: String } ], // these should match answer ids
  correct: {type: Boolean} // comparison on server side at time of scoring
});

ChoiceSchema.methods.apiRepr = function () {
  return { 
    userId: this.userId,
    quizId: this.quizId,
    attempt: this.attempt,
    questionId: this.questionId,
    choices: this.choices,
    correct: this.correct,
    id: this._id 
  };
};

const Choice = mongoose.models.Choice || mongoose.model('Choice', ChoiceSchema);

module.exports = { Choice };