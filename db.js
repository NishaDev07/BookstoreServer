const { MongoClient } = require('mongodb');

let dBConnection;

module.exports = {
    ConnectToDb: (callBackFn) => {
        // Check if callBackFn is a function
        if (typeof callBackFn !== 'function') {
            console.error('Error: callBackFn must be a function');
            return; // Exit if the callback is not a function
        }

        // Connect to the MongoDB database
        MongoClient.connect("mongodb+srv://dbUser01:k1fWY3Ty3CS0Og0q@mainclusterm0.wec8a.mongodb.net/BookNExt")
            .then((client) => {
                dBConnection = client.db();
                return callBackFn(null); // Call the callback with no error
            })
            .catch((err) => {
                console.log(err);
                return callBackFn(err); // Call the callback with the error
            });
    },
    getDb: () => dBConnection
};
