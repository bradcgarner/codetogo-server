'use strict';

const validateUserFieldsTrimmed = user => {
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => user[field].trim() !== user[field]
  );
  if (nonTrimmedField) {
    return {
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    };
  }
  return true ;
};  

const user = {
  username: 'bradgarner',
  firstName: 'Brad',
  lastName: 'Garner',
  password: 'verysecure'
};

console.log(validateUserFieldsTrimmed(user));