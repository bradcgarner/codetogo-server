'use strict';

quiz {
  id: numberByMongo,
  name: string, 
  questions: [
    {
      question: string,
      type: radio,
      id: questionID,
      answers: [
        {
          answer: string,
          correct: true,
          id: uuid
        }
      ]
    }
  ]
}

user {
  username: string,
  password: string,
  firstName: string,
  lastName: string,
  quizzes: [
    {
      id: fromDb,
      questions: [
        { id: questionId,
          answers: [ id, id, id ]          
        }
      ]
    }
  ]
}