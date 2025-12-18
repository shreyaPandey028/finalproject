const express = require('express');
const friendArenaRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const {
    createFriendArenaRoom,
    joinFriendArenaRoom,
    startFriendArenaContest,
    trackTabSwitch,
    runFriendArenaCode,
    submitFriendArenaCode,
    endFriendArenaContest,
    getFriendArenaByCode
} = require('../controllers/friendArenaController');

friendArenaRouter.post('/create', userMiddleware, createFriendArenaRoom);
friendArenaRouter.post('/join', userMiddleware, joinFriendArenaRoom);
friendArenaRouter.post('/start', userMiddleware, startFriendArenaContest);
friendArenaRouter.post('/track-tab-switch', userMiddleware, trackTabSwitch);
friendArenaRouter.post('/run', userMiddleware, runFriendArenaCode);
friendArenaRouter.post('/submit', userMiddleware, submitFriendArenaCode);
friendArenaRouter.post('/end', userMiddleware, endFriendArenaContest);
friendArenaRouter.get('/:roomCode', userMiddleware, getFriendArenaByCode);

module.exports = friendArenaRouter;

