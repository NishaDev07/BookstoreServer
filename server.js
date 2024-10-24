const express = require('express');
const { ConnectToDb: ConnectToBookDb, getDb: getBookDb } = require('./db'); // Use the book DB module
const { ConnectToDb: ConnectToAuthDb, getDb: getAuthDb } = require('./dbaut'); // Use the auth DB module
const cors = require('cors');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt'); // Make sure to install bcrypt
const jwt = require('jsonwebtoken'); // Make sure to install jsonwebtoken
require('dotenv').config(); // Load environment variables

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

let bookDb, authDb;

// Connect to both databases
function connectDatabases() {
    ConnectToBookDb((err) => {
        if (err) {
            console.error("Error connecting to book database:", err);
            return; // Exit if there's an error
        }
        bookDb = getBookDb(); // Get the book database connection

        ConnectToAuthDb((err) => {
            if (err) {
                console.error("Error connecting to auth database:", err);
                return; // Exit if there's an error
            }
            authDb = getAuthDb(); // Get the auth database connection

            app.listen(5000, () => {
                console.log("Listening at port 5000");
            });
        });
    });
}

connectDatabases();

// Book-related routes
app.get('/fetchFiveBestSellerBooks', async (req, res) => {
    try {
        const books = await bookDb.collection('Books')
            .find()
            .sort({ SoldQty: -1 })
            .limit(5)
            .toArray();
        res.status(200).json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch the documents" });
    }
});

app.get('/fetchBooks', async (req, res) => {
    try {
        const books = await bookDb.collection('Books')
            .find()
            .limit(5)
            .toArray();
        res.status(200).json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch the documents" });
    }
});

app.get('/fetchAllBooks', async (req, res) => {
    try {
        const books = await bookDb.collection('Books').find().toArray();
        res.status(200).json(books);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch the documents" });
    }
});

app.get('/fetchBooks/:id', async (req, res) => {
    const bookID = req.params.id;
    try {
        const book = await bookDb.collection('Books').findOne({ _id: new ObjectId(bookID) });
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }
        res.status(200).json(book);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch the document" });
    }
});

// User Authentication routes
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await authDb.collection('Users').insertOne({ email, password: hashedPassword });
        res.status(201).json({ message: "User created successfully", userId: result.insertedId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not create user" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await authDb.collection('Users').findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not log in" });
    }
});

// Token-related routes
app.get('/fetchToken/:id', async (req, res) => {
    try {
        const auth = await authDb.collection('SessionTokens').findOne({ email: req.params.id });
        if (!auth) {
            return res.status(404).json({ error: "Token not found" });
        }
        res.status(200).json(auth);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not authenticate the transaction" });
    }
});

app.post('/setToken', async (req, res) => {
    try {
        const auth = await authDb.collection('SessionTokens').insertOne({ type: "LoginToken" });
        res.status(200).json(auth);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not generate the token" });
    }
});

app.get('/getToken/:tokenID', async (req, res) => {
    const tokenID = req.params.tokenID;

    if (!ObjectId.isValid(tokenID)) {
        return res.status(400).json({ error: "Invalid Token ID" });
    }

    try {
        const auth = await authDb.collection('SessionTokens').findOne({ _id: new ObjectId(tokenID) });
        if (!auth) {
            return res.status(404).json({ error: "Token not found" });
        }
        res.status(200).json(auth);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not verify the token" });
    }
});

// Add other authentication-related routes here...

app.post('/addBook', async (req, res) => {
    const newBookObj = req.body;
    try {
        const result = await bookDb.collection('Books').insertOne(newBookObj);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not insert the book" });
    }
});

// The server is started inside the database connection callbacks above.
