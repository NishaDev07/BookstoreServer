// routes/user.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

module.exports = (authDb) => {
    const router = express.Router();

    // User signup
    router.post('/signup', async (req, res) => {
        const { email, password } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await authDb.collection('Users').insertOne({ email, password: hashedPassword });
            res.status(201).json({ message: "User created successfully", userId: result.insertedId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Could not create user" });
        }
    });

    // User login
    router.post('/login', async (req, res) => {
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

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Could not log in" });
        }
    });

    // Token-related routes
    router.get('/fetchToken/:id', (req, res) => {
        authDb.collection('SessionTokens')
            .findOne({ email: req.params.id })
            .then(auth => {
                if (!auth) {
                    return res.status(404).json({ error: "Token not found" });
                }
                res.status(200).json(auth);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Could not authenticate the transaction" });
            });
    });

    router.post('/setToken', (req, res) => {
        authDb.collection('SessionTokens')
            .insertOne({ type: "LoginToken" })
            .then(auth => res.status(200).json(auth))
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Could not generate the token" });
            });
    });

    router.get('/getToken/:tokenID', (req, res) => {
        const tokenID = req.params.tokenID;

        if (!ObjectId.isValid(tokenID)) {
            return res.status(400).json({ error: "Invalid Token ID" });
        }

        authDb.collection('SessionTokens')
            .findOne({ _id: new ObjectId(tokenID) })
            .then(auth => {
                if (!auth) {
                    return res.status(404).json({ error: "Token not found" });
                }
                res.status(200).json(auth);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: "Could not verify the token" });
            });
    });

    return router;
};
