'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ChoiceSchema = mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  idQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  choices: [ { type: String } ], // these should match answer ids
  correct: {type: Boolean} // comparison on server side at time of scoring
});

ChoiceSchema.methods.apiRepr = function () {
  return { 
    idUser: this.idUser,
    idQuiz: this.idQuiz,
    idQuestion: this.idQuestion,
    choices: this.choices,
    correct: this.correct,
    id: this._id 
  };
};

const Choice = mongoose.models.Choice || mongoose.model('Choice', ChoiceSchema);

module.exports = { Choice };