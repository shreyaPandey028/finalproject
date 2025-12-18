const FriendArena = require('../models/friendArena');
const Problem = require('../models/problem');
const User = require('../models/user');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

// Generate unique room code
const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Create a new Friend Arena room
const createFriendArenaRoom = async (req, res) => {
    try {
        const userId = req.result._id;
        const { topic } = req.body;

        if (!topic || !['array', 'linkedList', 'graph', 'dp'].includes(topic)) {
            return res.status(400).json({ message: 'Valid topic is required (array, linkedList, graph, dp)' });
        }

        // Generate unique room code
        let roomCode;
        let isUnique = false;
        while (!isUnique) {
            roomCode = generateRoomCode();
            const existing = await FriendArena.findOne({ roomCode });
            if (!existing) {
                isUnique = true;
            }
        }

        // Get 2 random problems from the selected topic
        const problems = await Problem.find({ tags: topic });
        if (problems.length < 2) {
            return res.status(400).json({ message: `Not enough problems available for topic: ${topic}` });
        }

        // Randomly select 2 problems
        const shuffled = problems.sort(() => 0.5 - Math.random());
        const selectedProblems = shuffled.slice(0, 2).map(p => p._id);

        const arena = await FriendArena.create({
            roomCode,
            topic,
            problems: selectedProblems,
            createdBy: userId,
            status: 'waiting',
            participants: [{
                userId,
                joinedAt: new Date()
            }],
            leaderboard: [{
                userId,
                problemsSolved: 0,
                totalTestCasesPassed: 0,
                submissions: selectedProblems.map(problemId => ({
                    problemId,
                    solved: false,
                    testCasesPassed: 0,
                    totalTestCases: 0,
                    attempts: 0
                }))
            }]
        });

        const populatedArena = await FriendArena.findById(arena._id)
            .populate('participants.userId', 'firstName lastName')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        res.status(201).json({
            success: true,
            arena: populatedArena
        });
    } catch (err) {
        console.error('Error creating Friend Arena room:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

// Join a Friend Arena room
const joinFriendArenaRoom = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode } = req.body;

        if (!roomCode) {
            return res.status(400).json({ message: 'Room code is required' });
        }

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() })
            .populate('problems');

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'waiting') {
            return res.status(400).json({ message: 'Contest has already started or ended' });
        }

        // Check if user already joined
        const existingParticipant = arena.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (existingParticipant) {
            const populatedArena = await FriendArena.findById(arena._id)
                .populate('participants.userId', 'firstName lastName')
                .populate('leaderboard.userId', 'firstName lastName')
                .populate('problems');
            return res.status(200).json({
                success: true,
                message: 'Already joined room',
                arena: populatedArena
            });
        }

        // Add user as participant
        arena.participants.push({
            userId,
            joinedAt: new Date()
        });

        // Add to leaderboard
        arena.leaderboard.push({
            userId,
            problemsSolved: 0,
            totalTestCasesPassed: 0,
            submissions: arena.problems.map(problemId => ({
                problemId,
                solved: false,
                testCasesPassed: 0,
                totalTestCases: 0,
                attempts: 0
            }))
        });

        await arena.save();

        const populatedArena = await FriendArena.findById(arena._id)
            .populate('participants.userId', 'firstName lastName')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        // Broadcast updated arena to all participants
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`friend-arena-${roomCode}`).emit('friend-arena-data', {
                    arena: populatedArena,
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Error broadcasting arena data:', err);
        }

        res.status(200).json({
            success: true,
            message: 'Successfully joined room',
            arena: populatedArena
        });
    } catch (err) {
        console.error('Error joining Friend Arena room:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

// Start Friend Arena contest
const startFriendArenaContest = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode } = req.body;

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() });

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'waiting') {
            return res.status(400).json({ message: 'Contest already started or ended' });
        }

        if (arena.participants.length < 2) {
            return res.status(400).json({ message: 'Need at least 2 participants to start' });
        }

        const now = new Date();
        arena.status = 'active';
        arena.startedAt = now;

        // Set start and end times for all participants
        arena.participants.forEach(participant => {
            participant.startTime = now;
            participant.endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour duration
            participant.isActive = true;
        });

        await arena.save();

        const populatedArena = await FriendArena.findById(arena._id)
            .populate('participants.userId', 'firstName lastName')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        // Broadcast updated arena to all participants
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`friend-arena-${roomCode}`).emit('friend-arena-data', {
                    arena: populatedArena,
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Error broadcasting arena data:', err);
        }

        res.status(200).json({
            success: true,
            message: 'Contest started',
            arena: populatedArena
        });
    } catch (err) {
        console.error('Error starting Friend Arena contest:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

// Track tab switch
const trackTabSwitch = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode } = req.body;

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() });

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'active') {
            return res.status(400).json({ message: 'Contest is not active' });
        }

        const participant = arena.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        if (participant.isDisqualified) {
            return res.status(400).json({ message: 'Already disqualified' });
        }

        participant.tabSwitches += 1;

        if (participant.tabSwitches > 1) {
            participant.isDisqualified = true;
            participant.isActive = false;
            participant.disqualificationReason = 'Tab switched more than once';
        }

        await arena.save();

        res.status(200).json({
            success: true,
            tabSwitches: participant.tabSwitches,
            isDisqualified: participant.isDisqualified
        });
    } catch (err) {
        console.error('Error tracking tab switch:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

// Run code in Friend Arena
const runFriendArenaCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode, problemId, code, language } = req.body;

        if (!code || !language || !problemId) {
            return res.status(400).send('Code, language, and problemId are required');
        }

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() });

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'active') {
            return res.status(400).json({ message: 'Contest is not active' });
        }

        const participant = arena.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant || participant.isDisqualified || !participant.isActive) {
            return res.status(403).json({ message: 'You are not allowed to submit' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        const lang = language === 'cpp' ? 'c++' : language;
        const languageId = getLanguageById(lang);

        // Run against visible test cases
        const submissions = problem.visibleTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = true;
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime = runtime + parseFloat(test.time);
                memory = Math.max(memory, test.memory);
            } else {
                if (test.status_id === 4) {
                    status = false;
                    errorMessage = test.stderr;
                } else {
                    status = false;
                    errorMessage = test.stderr;
                }
            }
        }

        res.status(201).json({
            success: status,
            testCases: testResult,
            runtime,
            memory
        });
    } catch (err) {
        console.error('Error running Friend Arena code:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

// Submit code in Friend Arena
const submitFriendArenaCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode, problemId, code, language } = req.body;

        if (!code || !language || !problemId) {
            return res.status(400).send('Code, language, and problemId are required');
        }

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() });

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'active') {
            return res.status(400).json({ message: 'Contest is not active' });
        }

        const participant = arena.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant || participant.isDisqualified || !participant.isActive) {
            return res.status(403).json({ message: 'You are not allowed to submit' });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }

        const lang = language === 'cpp' ? 'c++' : language;
        const languageId = getLanguageById(lang);

        // Submit against hidden test cases
        const submissions = problem.hiddenTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = 'wrong';
        let errorMessage = null;
        let isAccepted = false;

        for (const test of testResult) {
            if (test.status_id === 3) {
                testCasesPassed++;
                runtime = runtime + parseFloat(test.time);
                memory = Math.max(memory, test.memory);
            } else {
                if (test.status_id === 4) {
                    status = 'error';
                    errorMessage = test.stderr || 'Runtime Error';
                } else {
                    status = 'wrong';
                }
            }
        }

        if (testCasesPassed === problem.hiddenTestCases.length) {
            status = 'accepted';
            isAccepted = true;
        }

        // Update leaderboard
        const leaderboardEntry = arena.leaderboard.find(
            l => l.userId.toString() === userId.toString()
        );

        if (leaderboardEntry) {
            const submissionEntry = leaderboardEntry.submissions.find(
                s => s.problemId.toString() === problemId.toString()
            );

            if (submissionEntry) {
                submissionEntry.attempts += 1;
                if (isAccepted && !submissionEntry.solved) {
                    submissionEntry.solved = true;
                    submissionEntry.submissionTime = new Date();
                    leaderboardEntry.problemsSolved += 1;
                }
                submissionEntry.testCasesPassed = testCasesPassed;
                submissionEntry.totalTestCases = problem.hiddenTestCases.length;
            }

            // Update total test cases passed
            leaderboardEntry.totalTestCasesPassed = leaderboardEntry.submissions.reduce(
                (sum, sub) => sum + sub.testCasesPassed, 0
            );

            await arena.save();
        }

        // Broadcast leaderboard update via Socket.io
        try {
            const broadcastFriendArenaLeaderboard = req.app.get('broadcastFriendArenaLeaderboard');
            if (broadcastFriendArenaLeaderboard) {
                await broadcastFriendArenaLeaderboard(roomCode);
            }
        } catch (err) {
            console.error('Error broadcasting leaderboard:', err);
        }

        const populatedArena = await FriendArena.findById(arena._id)
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        res.status(201).json({
            accepted: isAccepted,
            status: status,
            passedTestCases: testCasesPassed,
            totalTestCases: problem.hiddenTestCases.length,
            runtime: runtime.toFixed(3),
            memory: memory,
            errorMessage: errorMessage,
            leaderboard: populatedArena.leaderboard.sort((a, b) => {
                if (b.problemsSolved !== a.problemsSolved) {
                    return b.problemsSolved - a.problemsSolved;
                }
                return b.totalTestCasesPassed - a.totalTestCasesPassed;
            })
        });
    } catch (err) {
        console.error('Error submitting Friend Arena code:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

// End Friend Arena contest
const endFriendArenaContest = async (req, res) => {
    try {
        const userId = req.result._id;
        const { roomCode } = req.body;

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() });

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (arena.status !== 'active') {
            return res.status(400).json({ message: 'Contest is not active' });
        }

        // Check if user is a participant
        const participant = arena.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant && arena.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to end contest' });
        }

        // End the contest immediately when anyone clicks end
        arena.status = 'ended';
        arena.endedAt = new Date();
        arena.participants.forEach(p => {
            p.isActive = false;
        });

        await arena.save();

        const populatedArena = await FriendArena.findById(arena._id)
            .populate('participants.userId', 'firstName lastName')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        // Sort leaderboard
        const sortedLeaderboard = populatedArena.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalTestCasesPassed - a.totalTestCasesPassed;
        });

        // Broadcast updated arena to all participants
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`friend-arena-${roomCode}`).emit('friend-arena-data', {
                    arena: populatedArena,
                    timestamp: Date.now()
                });
            }
        } catch (err) {
            console.error('Error broadcasting arena data:', err);
        }

        res.status(200).json({
            success: true,
            message: 'Contest ended',
            arena: populatedArena,
            leaderboard: sortedLeaderboard
        });
    } catch (err) {
        console.error('Error ending Friend Arena contest:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

// Get Friend Arena by room code
const getFriendArenaByCode = async (req, res) => {
    try {
        const { roomCode } = req.params;

        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() })
            .populate('participants.userId', 'firstName lastName')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('problems');

        if (!arena) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Sort leaderboard
        const sortedLeaderboard = arena.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalTestCasesPassed - a.totalTestCasesPassed;
        });

        res.status(200).json({
            success: true,
            arena: {
                ...arena.toObject(),
                leaderboard: sortedLeaderboard
            }
        });
    } catch (err) {
        console.error('Error fetching Friend Arena:', err);
        res.status(500).json({ message: 'Internal Server Error: ' + err.message });
    }
};

module.exports = {
    createFriendArenaRoom,
    joinFriendArenaRoom,
    startFriendArenaContest,
    trackTabSwitch,
    runFriendArenaCode,
    submitFriendArenaCode,
    endFriendArenaContest,
    getFriendArenaByCode
};

