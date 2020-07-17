'use strict';
let aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });

const sqs = new aws.SQS({ apiVersion: '2020-07-16' });

module.exports.submit = async event => {
  
  event.Records.forEach(record => {
    if (record.eventName === 'INSERT') {
      const firstName = JSON.stringify(record.dynamodb.NewImage.firstName.S);
      const lastName = JSON.stringify(record.dynamodb.NewImage.lastName.S);
      const phoneNumber = JSON.stringify(record.dynamodb.NewImage.phoneNumber.N);
    }

    const params = {
      MessageAttributes: {
        'FirstName': {
          DataType: 'String',
          StringValue: firstName
        },
        'LastName': {
          DataType: 'String',
          StringValue: lastName
        },
        'PhoneNumber': {
          DataType: 'Number',
          StringValue: phoneNumber
        }
      },
      MessageBody: 'Lead information',
      QueueUrl: 'MyFirstQueueURL'
    };

    sqs.sendMessage(params, (err, data) => {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success', data.MessageId);
      }
    });
  });

  return {};

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
