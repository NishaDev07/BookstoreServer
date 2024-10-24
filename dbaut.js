const { MongoClient } = require('mongodb');

let dBConnection;

module.exports = {
    ConnectToDb: (callBackFn) => {
        // Check if callBackFn is a function
        if (typeof callBackFn !== 'function') {
            console.error('Error: callBackFn must be a function');
            return; // Exit if the callback is not a function
        }

        MongoClient.connect("mongodb://localhost:27017/UserData")
            .then((client) => {
                dBConnection = client.db();
                return callBackFn(null); // Call callback with no error
            })
            .catch((err) => {
                console.log(err);
                return callBackFn(err); // Call callback with the error
            });
    },
    getDb: () => dBConnection
};
