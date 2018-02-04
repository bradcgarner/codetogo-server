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
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String }, // HTML, CSS, JS
  difficulty: { type: Number }, // scale of 1 easy 5 advanced
  total: { type: Number }, // total number of questions, populated via script
  score: { type: Number },
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // we'll set library to 0
  indexCurrent: { type: Number } // default to 0
});

QuizSchema.methods.apiRepr = function () {
  return { 
    name: this.name,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    total: this.total,
    score: this.score,
    idUser: this.idUser,
    indexCurrent: this.indexCurrent,
    id: this._id };
};

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

module.exports = { Quiz };
