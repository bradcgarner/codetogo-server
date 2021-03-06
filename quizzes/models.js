'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Quizzes are populated by script that:
// creates a quiz and gets its id
// creates questions and adds the quiz id to the questions
// counts the questions added successfully
// populates the total count of questions in the quiz
// default values are set via script

// Quizzes are copied to the user when the user adds or takes a quiz
// user never refers back to library except to add a quiz
// values, such as indexCurrent and score become unique to the user

const QuizSchema = mongoose.Schema({
  idOrigin:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  idUser:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // we'll set library to 0
  library:      { type: Boolean },
  name:         { type: String },
  version:      { type: Number },
  notes:        { type: String }, // notes about this version
  category:     { type: String }, // HTML, CSS, JS
  description:  { type: String }, // timeless subject matter description (see notes for versioning separately)
  difficulty:   { type: Number }, // scale of 1 easy 5 advanced
  total:        { type: Number }, // total number of questions, populated via script
  score:        { type: Number }, // default to 0 by script
  indexCurrent: { type: Number }, // default to 0 by script
});

QuizSchema.methods.apiRepr = function () {
  return { 
    id: this._id,
    idUser: this.idUser,
    name: this.name,
    version: this.version,
    notes: this.notes,
    category: this.category,
    difficulty: this.difficulty,
    description: this.description,
    total: this.total,
    score: this.score,
    indexCurrent: this.indexCurrent,
  };
};

QuizSchema.methods.initializeRepr = function () {
  return { 
    id: this._id,
    name: this.name,
    category: this.category,
    difficulty: this.difficulty,
    description: this.description,
    total: this.total,
    version: this.version,
    notes: this.notes,
  };
};

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

module.exports = { Quiz };
