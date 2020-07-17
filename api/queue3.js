'use strict';
const axios = require('axios');
let aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });
const sqs = new aws.SQS({ apiVersion: '2020-07-16' });
const sns = new aws.SNS({ apiVersion: '2020-07-16' });
const ddb = new aws.DynamoDB({ apiVersion: '2020-07-16' });


module.exports.submit = async event => {

  event.Records.forEach(record => {
    const { FirstName, LastName, PhoneNumber } = record.MessageAttributes;

    new Promise(/* Insert to dialer functionality here */)
    .then(res => {
      // Update DynamoDB
      const params = {
        TableName: 'LeadDynamoDBTable',
        Item: {
          'firstName': { S: FirstName.StringValue },
          'lastName': { S: LastName.StringValue },
          'phoneNumber': { N: PhoneNumber.StringValue }
        }
      };

      ddb.putItem(params, (err, data) => {
        if (err) {
          console.log('Error', err);
        } else {
          console.log('Success', data);
        }
      });
    })
    .catch(err => {
      console.log(err);
      // SNS
      const params = {
        Message: 'Reinsert to MyThirdQueue',
        TopicArn: 'AlarmTopic'
      };
      sns.publish(params)
      .then(data => {
        // send to myThirdQueue Again
        sqs.sendMessage(record, (err, data) => {
          if (err) {
            console.log('Error', err);
          } else {
            console.log('Success', data.MessageId);
          }
        });
        console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
        console.log("MessageID is " + data.MessageId);
      })
      .catch(err => {
        console.log('Error', err);
      });
    });
  });

  return {};

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
