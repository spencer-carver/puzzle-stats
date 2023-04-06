const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const dynamo = new DynamoDB();

async function getAll(params) {
    return new Promise(function(resolve, reject) {
        dynamo.scan(params, function (err, data) {
            if (err) {
                return reject(err);
            }
    
            return resolve(data.Item);
        });
    });
}

async function insertItem(params) {
    return new Promise(function(resolve, reject) {
        dynamo.putItem(params, function (err, data) {
            if (err) {
                return reject(err);
            }
    
            return resolve(data.Item);
        });
    });
}

async function queryItem(params) {
    return new Promise(function(resolve, reject) {
        dynamo.getItem(params, function (err, data) {
            if (err) {
                return reject(err);
            }

            return resolve(data.Item);
        });
    });
}

module.exports = {
    getAll,
    insertItem,
    queryItem
};
