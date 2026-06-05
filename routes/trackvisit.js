import express from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, '../visitors.json');

const router = express.Router();

// Helper functions to persist metrics to file storage matrix
const getStoredCount = () => {
    try {
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, JSON.stringify({ totalViews: 0 }));
            return 0;
        }
        const data = fs.readFileSync(logFilePath, 'utf8');
        return JSON.parse(data).totalViews || 0;
    } catch (err) {
        console.error("Telemetry read error, falling back:", err);
        return 0;
    }
};

const saveStoredCount = (count) => {
    try {
        fs.writeFileSync(logFilePath, JSON.stringify({ totalViews: count }, null, 2));
    } catch (err) {
        console.error("Telemetry write error:", err);
    }
};

// 1. POST Request Endpoint (Registers brand new traffic sessions)
router.post('/visit', async (req, res) => {
    try {
        // Read current state from file, bump arithmetic index index, overwrite file
        let currentViews = getStoredCount();
        currentViews += 1;
        saveStoredCount(currentViews);

        // Send a push message directly to your phone via Pushover API
        if (process.env.PUSHOVER_API_TOKEN && process.env.PUSHOVER_USER_KEY) {
            await axios.post('https://api.pushover.net/1/messages.json', {
                token: process.env.PUSHOVER_API_TOKEN,
                user: process.env.PUSHOVER_USER_KEY,
                message: `Portfolio hit tracked! 🚀 Unique instances: ${currentViews}`
            });
        }

        res.status(200).json({
            success: true,
            message: "Telemetry synchronized",
            value: currentViews
        });

    } catch (error) {
        console.error("Notification alert failed:", error.message);
        // Resend fallback baseline if notification endpoints time out
        const currentViews = getStoredCount();
        res.status(200).json({
            success: true,
            message: "Metrics saved locally",
            value: currentViews
        });
    }
});

// 2. GET Request Endpoint (Loads telemetry metrics safely without compounding counts)
router.get('/visit', (req, res) => {
    const currentViews = getStoredCount();
    res.status(200).json({
        success: true,
        value: currentViews
      });
});

export default router;