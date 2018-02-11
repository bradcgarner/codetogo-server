'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ActivitySchema = mongoose.Schema({
  idUser:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:             { type: String },
  actions:          { type: String },
  category:         { type: String },
  timestampCreated: { type: String }, // created by User
});

ActivitySchema.methods.apiRepr = function () {
  return { 
    id: this._id,
    idUser: this.idUser,
    action: this.action,
    name: this.name,
    category: this.category,
    timestampCreated: this.timestampCreated,
  };
};

const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);

module.exports = { Activity };