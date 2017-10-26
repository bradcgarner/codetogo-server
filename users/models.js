'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  quizzes: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    name: { type: String },
    attempt: { type: Number },
    archive: { type: Boolean },
    total: { type: Number },
    completed: { type: Number },
    correct: { type: Number },
    category: {type: String },
    difficulty: {type: Number }
  }],
  badges: { type: String },
  recent: [{type: String}]
});

UserSchema.methods.apiRepr = function () {
  return { 
    firstName: this.firstName,
    lastName: this.lastName,
    username: this.username,
    quizzes: this.quizzes, 
    badges: this.badges, 
    recent: this.recent,
    id: this._id 
  };
};

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = { User };