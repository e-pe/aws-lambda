'use strict';

var AWS = require('aws-sdk');

var sqs = new AWS.SQS({
    "region": "eu-central-1"
});

var s3 = new AWS.S3({
    "region": "eu-central-1"
});


var receiveOneMessage = function (onReceive) {
    var params = {
        "QueueUrl": "https://sqs.eu-central-1.amazonaws.com/462882701258/url2png",
        "MaxNumberOfMessages": 1,
        "VisibilityTimeout": 120,
        "WaitTimeSeconds": 10
    };

    sqs.receiveMessage(params, function (err, data) {
        if (err) { 
            onReceive(err, null);
        } else { 
            if (data.Messages === undefined) { 
                onReceive(null, null);
            } else { 
                console.log(data.Messages[0]);

                onReceive(null, data.Messages[0]); 
            } 
        } 
    });
};

var processOneMessage = function (data, onProcess) {
    var body = JSON.parse(data.Body);
	var file = body.id + '.html';

    var params = {
        "Bucket": "backup.syncway.org",
        "Key": file,
        "ACL": "public-read",
        "ContentType": "application/html",
        "Body": "dfgd11111"
    };
    s3.putObject(params, function(err) {
        if (err) {
            onProcess(err);
        } else {
            onProcess(err);
        }
    });               
};

var acknowledgeOneMessage = function (data, onAcknowledge) {
    var params = {
		"QueueUrl": "https://sqs.eu-central-1.amazonaws.com/462882701258/url2png",
		"ReceiptHandle": data.ReceiptHandle
	};
    sqs.deleteMessage(params, (error) => {
        onAcknowledge(error);
    });
};

var run = function (onRun) {
    receiveOneMessage((error, data) => {
        if (error) {
            onRun(error);
            throw error;
        } else {
            if (data) {
                console.log(data);
                processOneMessage(data, (error) => {
                    if (error) {
                        onRun(error);
                        throw error;
                    } else {
                        acknowledgeOneMessage(data, (error) => {
                            if (error) {
                                onRun(error);
                                throw error;
 
                            } else {
                                onRun(null, data);
                            }
                        });
                    }
                });
            } else {
                onRun(null, data);
            }
        }
    });
};

exports.runHandler = function (event, context, callback) {
    console.log(event);
    run(function (error, data) {
        console.log(JSON.stringify(error));
        console.log(context.callbackWaitsForEmptyEventLoop);
        callback(JSON.stringify(error), data);
    });
};