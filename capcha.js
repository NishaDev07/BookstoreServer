const express = require('express');
const axios = require('axios'); // To make HTTP requests to Google's reCAPTCHA verification API
const { ConnectToDb, getDb } = require('./db');
const cors = require('cors');
const { ObjectId } = require('mongodb');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000' // Adjust this if your frontend runs on a different port or domain
}));

let db;

// Connect to your database (MongoDB, in this example)
ConnectToDb(async (err) => {
    if (!err) {
        app.listen(5000, () => {
            console.log("Listening at port 5000");
        });
        db = await getDb();
    }
});

// Use your secret key for reCAPTCHA
const recaptchaSecretKey = '6LcX2mkqAAAAABKgDUkBJSkPJOwo8pH7S1Za_rzy';

// Endpoint to verify the CAPTCHA token
app.post('/setToken', async (req, res) => {
    const { captchaToken } = req.body;

    // Check if the CAPTCHA token is present
    if (!captchaToken) {
        return res.status(400).json({ error: 'CAPTCHA token is missing' });
    }

    try {
        // Verify the CAPTCHA token with Google's API
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: recaptchaSecretKey, // Your secret key
                response: captchaToken      // The token from the client
            }
        });

        const { success, score } = response.data;

        // If CAPTCHA verification fails
        if (!success) {
            return res.status(400).json({ error: 'CAPTCHA verification failed' });
        }

        // Optionally, check the score for reCAPTCHA v3
        if (score < 0.5) { // For v2, you may skip this step
            return res.status(400).json({ error: 'Low CAPTCHA score' });
        }

        // Once CAPTCHA is verified, proceed with token generation or login logic
        const result = await db.collection('SessionTokens').insertOne({ type: "LoginToken" });
        return res.status(200).json({ insertedId: result.insertedId });

    } catch (error) {
        console.error("Error during CAPTCHA verification:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Additional routes for login and token management...
