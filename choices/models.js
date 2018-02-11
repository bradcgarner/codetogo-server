'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ChoiceSchema = mongoose.Schema({
  idUser:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idQuiz:           { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  idQuestion:       { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  version:          { type: Number },
  choices:        [ { type: String } ], // for multiple choice: array of ids of the user's answer (choice), for field just a string
  correct:          { type: Boolean },
  score:            { type: Number },
  timestampCreated: { type: String }, // created by User
});

ChoiceSchema.methods.apiRepr = function () {
  return { 
    id: this._id,
    idUser: this.idUser,
    idQuiz: this.idQuiz,
    idQuestion: this.idQuestion,
    choices: this.choices,
    correct: this.correct,
  };
};

const Choice = mongoose.models.Choice || mongoose.model('Choice', ChoiceSchema);

module.exports = { Choice };