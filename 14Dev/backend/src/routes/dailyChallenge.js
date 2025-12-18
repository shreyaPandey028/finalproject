const express = require('express');
const dailyChallengeRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
    getTodayChallenge,
    runDailyChallengeCode,
    submitDailyChallengeCode,
    getUserStreak
} = require('../controllers/dailyChallenge');

dailyChallengeRouter.get('/today', userMiddleware, getTodayChallenge);
dailyChallengeRouter.post('/run', userMiddleware, runDailyChallengeCode);
dailyChallengeRouter.post('/submit', userMiddleware, submitDailyChallengeCode);
dailyChallengeRouter.get('/streak', userMiddleware, getUserStreak);

module.exports = dailyChallengeRouter;

