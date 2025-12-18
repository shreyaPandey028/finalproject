const express = require('express');
const router = express.Router();
const { analyzeComplexity } = require('../controllers/complexityAnalyzer');
const userMiddleware = require('../middleware/userMiddleware');

// POST /complexity/analyze - Analyze code complexity
router.post('/analyze', userMiddleware, analyzeComplexity);

module.exports = router;