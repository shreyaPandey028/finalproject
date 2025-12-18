// const express = require('express');
// const aiRouter =  express.Router();
// const userMiddleware = require("../middleware/userMiddleware");
// const solveDoubt = require('../controllers/solveDoubt');

// aiRouter.post('/chat', userMiddleware, solveDoubt);

// module.exports = aiRouter;


const express = require('express');
const aiRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const solveDoubt = require('../controllers/solveDoubt');

// AI Chat endpoint
aiRouter.post('/chat', userMiddleware, solveDoubt);

// Optional: Health check endpoint for AI service
aiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'AI Chat',
        timestamp: new Date().toISOString()
    });
});

module.exports = aiRouter;