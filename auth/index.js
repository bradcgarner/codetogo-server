'use strict';

const {router} = require('./router');

const { jwtStrategy } = require('./jwt-strategy');
const { localStrategy } = require('./local-strategy');

module.exports = {router, localStrategy, jwtStrategy};