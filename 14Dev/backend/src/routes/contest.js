const express = require('express');
const router = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
    createContest,
    getAllContests,
    getContestById,
    joinContest,
    submitContestCode,
    getLeaderboard,
    getUserSubmissions,
    endContest
} = require('../controllers/contestController');

// Public route - get all contests
router.get('/', getAllContests);

// Admin routes - require admin authentication (should be before parameterized routes)
router.post('/create', adminMiddleware, createContest);

// More specific routes first (before /:id)
router.get('/:id/leaderboard', getLeaderboard);
router.get('/:id/submissions', userMiddleware, getUserSubmissions);
router.post('/:id/join', userMiddleware, joinContest);
router.post('/:id/end', userMiddleware, endContest);
router.post('/:contestId/submit/:problemId', userMiddleware, submitContestCode);

// Public route - get contest by ID (less specific, should be last)
router.get('/:id', getContestById);

module.exports = router;

