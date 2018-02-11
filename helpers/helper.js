'use strict';

const { User } = require('../users');

const validateKeysPresent = (object, keys) => {
  // confirms that keys ARE present in an object, allows other keys
  const missingKey = keys.find(field => (!(field in object)));
  if (missingKey) {
    const response = {
      message: 'Missing field',
      location: missingKey
    };
    return response;
  }
  return 'ok';
};

const limitKeys = (object, keys) => {
  // takes an object and list of keys; returns an object containing ONLY those keys
  // good to convert a user-defined object and confirm it meets criteria for our schema
  const newObject = {};
  keys.forEach(key=>{
    if(object[key]) newObject[key] = object[key];
  });
  return newObject;
};


const validateTypes = (object, keys, type) => {
  // type validation per object property; use once per type
  let misTypedValue;
  if(type === 'array') {
    misTypedValue = keys.find(
      field => field in object && !(Array.isArray(object[field]))
    );
  } else {
    misTypedValue = keys.find(
      field => field in object && typeof object[field] !== type
    );
  }

  if (misTypedValue) {
    return {
      message: `Incorrect field type: expected ${type}`,
      location: misTypedValue
    };
  }
  return 'ok';
};  

const validateValuesTrimmed = (object, keys) => {
  // validates explicitly trimmed keys, generally limit to username and password
  const nonTrimmedKeys = [];
  keys.forEach( field => {
    if (object[field]) {
      if (object[field].trim() !== object[field]) {
        nonTrimmedKeys.push(field);
      }
    }
  });
  if (nonTrimmedKeys.length > 0) {
    return {
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedKeys.join(', ')
    };
  }
  return 'ok' ;
};   

const validateValuesSize = (object, keys) => {  
  // confirms that keys are within size parameters, object parameter should have 1 key per property to validate, with a 'min' and 'max' key
  // objec
  const tooSmallField = [];
  const tooLargeField = [];

  for(let prop in keys) {
    if (object[prop]) {
      if (object[prop].length < keys[prop].min) {
        tooSmallField.push(`${prop} must be at least ${keys[prop].min} characters.`);
      } else if (object[prop].length > keys[prop].max) {
        tooLargeField.push(`${prop} cannot exceed ${keys[prop].max} characters.`);
      }
    }
  }

  if (tooSmallField.length > 0 || tooLargeField.length > 0) {
    const tooSmallMessage = tooSmallField.join(', ');
    const tooLargeMessage = tooLargeField.join(', ');
    return [tooSmallMessage, tooLargeMessage].join(', ');
  }
  return 'ok' ;
};  

const confirmUserExists = idUser => {
  return User.findById(idUser)
    .then(userFound=>{
      if(!userFound) throw 'User not found';
      return Promise.resolve();
    });
};

module.exports = { validateKeysPresent, limitKeys, validateValuesSize, validateValuesTrimmed, validateTypes, confirmUserExists };