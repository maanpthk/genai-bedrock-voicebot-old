const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {chat} = require('./components/chat-service');
const { authenticateJWT } = require("./components/auth-service");

const app = express();
const PORT = process.env.PORT || 8080;

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Your existing stream endpoint
app.get("/stream", authenticateJWT, async (req, res) => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const chatMsg = req.query.chat;
        const translationLanguage = req.query.translationLanguage;
        const isSpeakerEnabled = req.query.isSpeakerEnabled;
        
        if (!chatMsg) {
            res.status(401).send("Exception: Chat Param is missing.");
            return;
        }

        const response = await chat(
            chatMsg,
            res.locals.decodedToken,
            res,
            isSpeakerEnabled,
            translationLanguage
        );

        req.on("close", () => {
            res.end();
        });
    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start server with error handling
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
    console.error('Server startup error:', error);
});
