'use strict';

const bcrypt = require('bcryptjs');

const hashPassword = function(password) {
  return bcrypt.hash(password, 12);
};

const validatePassword = function(suppliedPW, userPW) {
  return bcrypt.compare(suppliedPW, userPW);
};

module.exports = { hashPassword, validatePassword };