'use strict';
const axios = require('axios');
let aws = require('aws-sdk');
aws.config.update({ region: 'us-east-1' });
const sqs = new aws.SQS({ apiVersion: '2020-07-16' });
const sns = new aws.SNS({ apiVersion: '2020-07-16' });

const CRM_URL = '/crm';

module.exports.submit = async event => {

  event.Records.forEach(record => {
    const { FirstName, LastName, PhoneNumber } = record.MessageAttributes;

    // Call Mock CRM API
    axios.post(CRM_URL, {
      firstName: FirstName.StringValue,
      lastName: LastName.StringValue,
      phoneNumber: PhoneNumber.StringValue
    })
    .then(res => {
      record.QueueUrl = 'MySecondQueueURL';
      sqs.sendMessage(record, (err, data) => {
        if (err) {
          console.log('Error', err);
        } else {
          console.log('Success', data.MessageId);
        }
      });
    })
    .catch(err => {
      console.log(err);
      // SNS
      const params = {
        Message: 'Failed to insert to CRM',
        TopicArn: 'AlarmTopic'
      };
      sns.publish(params)
      .then(data => {
        // send to original queue
        record.QueueUrl = 'MyFirstQueueURL';
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
