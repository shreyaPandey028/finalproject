const DailyChallenge = require('../models/DailyChallenge');
const Streak = require('../models/Streak');
const Problem = require('../models/problem');
const User = require('../models/user');
const { getLanguageById, submitBatch, submitToken } = require('../utils/problemUtility');

// Get today's daily challenge
const getTodayChallenge = async (req, res) => {
    try {
        const userId = req.result._id;
        
        // Get today's date at midnight UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        // Check if challenge exists for today
        let challenge = await DailyChallenge.findOne({ date: today }).populate('problemId');
        
        if (!challenge) {
            // Get all problems
            const allProblems = await Problem.find({});
            
            if (allProblems.length === 0) {
                return res.status(404).json({ message: 'No problems available for daily challenge' });
            }
            
            // Get the last challenge to determine day number
            const lastChallenge = await DailyChallenge.findOne().sort({ date: -1 });
            const dayNumber = lastChallenge ? lastChallenge.dayNumber + 1 : 1;
            
            // Randomly select a problem
            const randomIndex = Math.floor(Math.random() * allProblems.length);
            const selectedProblem = allProblems[randomIndex];
            
            // Create new daily challenge
            challenge = await DailyChallenge.create({
                date: today,
                problemId: selectedProblem._id,
                dayNumber: dayNumber
            });
            
            challenge = await DailyChallenge.findById(challenge._id).populate('problemId');
        }
        
        // Get user's streak info
        let userStreak = await Streak.findOne({ userId });
        if (!userStreak) {
            userStreak = await Streak.create({
                userId,
                currentStreak: 0,
                longestStreak: 0
            });
        }
        
        // Check if user already completed today's challenge
        const todayStr = today.toISOString().split('T')[0];
        const completedToday = userStreak.completedChallenges.some(ch => {
            const chDate = new Date(ch.challengeDate);
            chDate.setUTCHours(0, 0, 0, 0);
            const chDateStr = chDate.toISOString().split('T')[0];
            return chDateStr === todayStr && ch.problemId.toString() === challenge.problemId._id.toString();
        });
        
        res.status(200).json({
            challenge: challenge.problemId,
            dayNumber: challenge.dayNumber,
            date: challenge.date,
            userStreak: {
                currentStreak: userStreak.currentStreak,
                longestStreak: userStreak.longestStreak,
                completedToday: completedToday
            }
        });
    } catch (err) {
        console.error('Error getting today challenge:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

// Run code for daily challenge
const runDailyChallengeCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { code, language } = req.body;
        
        if (!code || !language) {
            return res.status(400).send('Code and language are required');
        }
        
        // Get today's challenge
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const challenge = await DailyChallenge.findOne({ date: today }).populate('problemId');
        
        if (!challenge) {
            return res.status(404).send('No daily challenge found for today');
        }
        
        const problem = challenge.problemId;
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
        console.error('Error running daily challenge code:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

// Submit code for daily challenge
const submitDailyChallengeCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const { code, language } = req.body;
        
        if (!code || !language) {
            return res.status(400).send('Code and language are required');
        }
        
        // Get today's challenge
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const challenge = await DailyChallenge.findOne({ date: today }).populate('problemId');
        
        if (!challenge) {
            return res.status(404).send('No daily challenge found for today');
        }
        
        const problem = challenge.problemId;
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
            
            // Update streak
            await updateStreak(userId, challenge.problemId._id, today);

            // Mark problem as solved for the user if not already
            const user = await User.findById(userId);
            if (user) {
                const alreadySolved = user.problemSolved?.some(
                    (pid) => pid.toString() === challenge.problemId._id.toString()
                );
                if (!alreadySolved) {
                    user.problemSolved.push(challenge.problemId._id);
                    await user.save();
                }
            }
        }
        
        res.status(201).json({
            accepted: isAccepted,
            status: status,
            passedTestCases: testCasesPassed,
            totalTestCases: problem.hiddenTestCases.length,
            runtime: runtime.toFixed(3),
            memory: memory,
            errorMessage: errorMessage,
            dayNumber: challenge.dayNumber
        });
    } catch (err) {
        console.error('Error submitting daily challenge code:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

// Helper function to update streak
const updateStreak = async (userId, problemId, challengeDate) => {
    try {
        let userStreak = await Streak.findOne({ userId });
        
        // Normalize dates to UTC midnight for comparison
        const today = new Date(challengeDate);
        today.setUTCHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        if (!userStreak) {
            userStreak = await Streak.create({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastCompletedDate: today,
                completedChallenges: [{
                    challengeDate: today,
                    problemId: problemId
                }]
            });
            return;
        }
        
        // Check if already completed today
        const alreadyCompleted = userStreak.completedChallenges.some(ch => {
            const chDate = new Date(ch.challengeDate);
            chDate.setUTCHours(0, 0, 0, 0);
            const chDateStr = chDate.toISOString().split('T')[0];
            return chDateStr === todayStr && ch.problemId.toString() === problemId.toString();
        });
        
        if (alreadyCompleted) {
            return; // Already completed today, don't update streak
        }
        
        // Check if last completion was yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const lastCompletedDate = userStreak.lastCompletedDate 
            ? new Date(userStreak.lastCompletedDate)
            : null;
        
        if (lastCompletedDate) {
            lastCompletedDate.setUTCHours(0, 0, 0, 0);
            const lastCompletedStr = lastCompletedDate.toISOString().split('T')[0];
            
            if (lastCompletedStr === yesterdayStr) {
                // Continue streak
                userStreak.currentStreak += 1;
            } else if (lastCompletedStr === todayStr) {
                // Already completed today (shouldn't happen, but check anyway)
                return;
            } else {
                // Reset streak (gap detected)
                userStreak.currentStreak = 1;
            }
        } else {
            // First completion ever
            userStreak.currentStreak = 1;
        }
        
        // Update longest streak if needed
        if (userStreak.currentStreak > userStreak.longestStreak) {
            userStreak.longestStreak = userStreak.currentStreak;
        }
        
        userStreak.lastCompletedDate = today;
        userStreak.completedChallenges.push({
            challengeDate: today,
            problemId: problemId
        });
        
        await userStreak.save();
    } catch (err) {
        console.error('Error updating streak:', err);
    }
};

// Get user streak info
const getUserStreak = async (req, res) => {
    try {
        const userId = req.result._id;
        
        let userStreak = await Streak.findOne({ userId });
        
        if (!userStreak) {
            userStreak = await Streak.create({
                userId,
                currentStreak: 0,
                longestStreak: 0
            });
        }
        
        res.status(200).json({
            currentStreak: userStreak.currentStreak,
            longestStreak: userStreak.longestStreak,
            lastCompletedDate: userStreak.lastCompletedDate
        });
    } catch (err) {
        console.error('Error getting user streak:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    }
};

module.exports = {
    getTodayChallenge,
    runDailyChallengeCode,
    submitDailyChallengeCode,
    getUserStreak
};

