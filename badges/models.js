'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const BadgeSchema = mongoose.Schema({
  idUser:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:             { type: String },
  category:         { type: String },
  score:            { type: Number },
  label:            { type: String },
  timestampCreated: { type: String }, // created by User
});

BadgeSchema.methods.apiRepr = function () {
  return { 
    id: this._id,
    idUser: this.idUser,
    name: this.name,
    category: this.category,
    score: this.score,
    label: this.label,
    timestampCreated: this.timestampCreated,
  };
};

const Badge = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);

module.exports = { Badge };