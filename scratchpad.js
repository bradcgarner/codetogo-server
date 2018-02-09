'use strict';

/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImZpcnN0TmFtZSI6InJlZmFjdG9yaW5nIiwibGFzdE5hbWUiOiJyZWZhY3RvcmluZyIsInVzZXJuYW1lIjoicmVmYWN0b3JpbmciLCJxdWl6emVzIjpbXSwicmVjZW50IjpbXSwiaWQiOiI1YTEwNTlmMmU3NWYyNDc4NGY0MmIzMTQifSwiaWF0IjoxNTExMDIxMDY3LCJleHAiOjE1MTE2MjU4NjcsInN1YiI6InJlZmFjdG9yaW5nIn0.hcMcXrPuLcdVpD_AbZshmGCJcduALzIwB5MNpQrIYCI

refactoring id
5a1059f2e75f24784f42b314

HTML quiz
59ec0f3514f8ec02e57566d2

CSS
59ec0f3514f8ec02e57566d3

JS
59ec0f3514f8ec02e57566d4

React
59ec0f3514f8ec02e57566d6

*/

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