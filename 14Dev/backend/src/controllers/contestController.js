const Contest = require("../models/contest");
const ContestSubmission = require("../models/contestSubmission");
const Problem = require("../models/problem");
const User = require("../models/user");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

// Create a new contest (Admin only)
const createContest = async (req, res) => {
    try {
        const userId = req.result._id;
        const { title, description, startTime, endTime, problemIds } = req.body;

        if (!title || !description || !startTime || !endTime || !problemIds || !Array.isArray(problemIds)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (problemIds.length < 3 || problemIds.length > 4) {
            return res.status(400).json({ message: "Contest must have 3-4 problems" });
        }

        // Validate that all problems exist
        const problems = await Problem.find({ _id: { $in: problemIds } });
        if (problems.length !== problemIds.length) {
            return res.status(400).json({ message: "Some problems not found" });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = Math.round((end - start) / (1000 * 60)); // Duration in minutes

        if (duration !== 90) {
            return res.status(400).json({ message: "Contest duration must be exactly 90 minutes (1:30hr)" });
        }

        if (start >= end) {
            return res.status(400).json({ message: "Start time must be before end time" });
        }

        const contest = await Contest.create({
            title,
            description,
            startTime: start,
            endTime: end,
            duration: 90,
            problems: problemIds,
            createdBy: userId,
            status: start > new Date() ? 'upcoming' : 'active'
        });

        res.status(201).json({
            success: true,
            contest: await Contest.findById(contest._id).populate('problems')
        });
    } catch (err) {
        console.error("Error creating contest:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Get all contests
const getAllContests = async (req, res) => {
    try {
        const contests = await Contest.find()
            .populate('problems', 'title difficulty tags')
            .populate('createdBy', 'firstName lastName')
            .sort({ startTime: -1 });

        res.status(200).json({ success: true, contests });
    } catch (err) {
        console.error("Error fetching contests:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Get contest by ID
const getContestById = async (req, res) => {
    try {
        const contestId = req.params.id;
        const contest = await Contest.findById(contestId)
            .populate('problems')
            .populate('leaderboard.userId', 'firstName lastName')
            .populate('participants.userId', 'firstName lastName');

        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        res.status(200).json({ success: true, contest });
    } catch (err) {
        console.error("Error fetching contest:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Join contest
const joinContest = async (req, res) => {
    try {
        const userId = req.result._id;
        const contestId = req.params.id;

        const contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        const now = new Date();
        if (now < contest.startTime) {
            return res.status(400).json({ message: "Contest has not started yet" });
        }
        if (now > contest.endTime) {
            return res.status(400).json({ message: "Contest has ended" });
        }

        // Check if user already joined
        const existingParticipant = contest.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (existingParticipant) {
            // User already joined, update their times if needed
            if (!existingParticipant.startTime) {
                existingParticipant.startTime = now;
                existingParticipant.endTime = new Date(now.getTime() + contest.duration * 60 * 1000);
                await contest.save();
            }

            // Check if leaderboard entry exists
            let leaderboardEntry = contest.leaderboard.find(
                l => l.userId.toString() === userId.toString()
            );
            if (!leaderboardEntry) {
                contest.leaderboard.push({
                    userId,
                    problemsSolved: 0,
                    totalScore: 0,
                    submissions: []
                });
                await contest.save();
            }

            return res.status(200).json({
                success: true,
                message: "Already joined contest",
                contest: await Contest.findById(contestId).populate('problems')
            });
        }

        // Add user as participant
        const userStartTime = now;
        const userEndTime = new Date(userStartTime.getTime() + contest.duration * 60 * 1000);

        contest.participants.push({
            userId,
            startTime: userStartTime,
            endTime: userEndTime,
            isActive: true
        });

        // Add to leaderboard
        contest.leaderboard.push({
            userId,
            problemsSolved: 0,
            totalScore: 0,
            submissions: contest.problems.map(problemId => ({
                problemId,
                solved: false,
                attempts: 0
            }))
        });

        await contest.save();

        res.status(200).json({
            success: true,
            message: "Successfully joined contest",
            contest: await Contest.findById(contestId).populate('problems'),
            userStartTime,
            userEndTime
        });
    } catch (err) {
        console.error("Error joining contest:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Submit code during contest
const submitContestCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const contestId = req.params.contestId;
        const problemId = req.params.problemId;
        let { code, language } = req.body;

        if (!userId || !code || !contestId || !problemId || !language) {
            return res.status(400).json({ message: "Some field missing" });
        }

        const contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Check if user is a participant
        const participant = contest.participants.find(
            p => p.userId.toString() === userId.toString()
        );
        if (!participant) {
            return res.status(403).json({ message: "You are not a participant in this contest" });
        }

        // Check if contest has been ended by user
        if (!participant.isActive) {
            return res.status(400).json({ message: "You have already ended this contest" });
        }

        // Check if contest is active for this user
        const now = new Date();
        if (participant.startTime && now > participant.endTime) {
            return res.status(400).json({ message: "Your contest time has ended" });
        }

        // Check if problem is part of contest
        if (!contest.problems.some(p => p.toString() === problemId)) {
            return res.status(400).json({ message: "Problem is not part of this contest" });
        }

        // Fetch the problem
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        if (language === 'cpp') language = 'c++';

        // Create contest submission
        const contestSubmission = await ContestSubmission.create({
            userId,
            contestId,
            problemId,
            code,
            language,
            status: 'pending',
            testCasesTotal: problem.hiddenTestCases.length,
            submissionTime: now
        });

        // Submit to Judge0
        const languageId = getLanguageById(language);
        const submissions = problem.hiddenTestCases.map((testcase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        const testResult = await submitToken(resultToken);

        // Process results
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

        // Update submission
        contestSubmission.status = status;
        contestSubmission.testCasesPassed = testCasesPassed;
        contestSubmission.runtime = runtime;
        contestSubmission.memory = memory;
        contestSubmission.errorMessage = errorMessage;
        contestSubmission.isAccepted = isAccepted;
        await contestSubmission.save();

        // Update leaderboard if accepted
        if (isAccepted) {
            const leaderboardEntry = contest.leaderboard.find(
                l => l.userId.toString() === userId.toString()
            );

            if (leaderboardEntry) {
                const problemSubmission = leaderboardEntry.submissions.find(
                    s => s.problemId.toString() === problemId
                );

                if (problemSubmission && !problemSubmission.solved) {
                    problemSubmission.solved = true;
                    problemSubmission.submissionTime = now;
                    leaderboardEntry.problemsSolved += 1;
                    // Calculate score (problems solved + penalty for attempts)
                    leaderboardEntry.totalScore = leaderboardEntry.problemsSolved * 100 - problemSubmission.attempts * 10;
                } else if (problemSubmission) {
                    problemSubmission.attempts += 1;
                }
            }
        } else {
            // Increment attempts even if not solved
            const leaderboardEntry = contest.leaderboard.find(
                l => l.userId.toString() === userId.toString()
            );
            if (leaderboardEntry) {
                const problemSubmission = leaderboardEntry.submissions.find(
                    s => s.problemId.toString() === problemId
                );
                if (problemSubmission) {
                    problemSubmission.attempts += 1;
                }
            }
        }

        await contest.save();

        // Broadcast leaderboard update via socket.io
        const io = req.app.get('io');
        const broadcastLeaderboard = req.app.get('broadcastLeaderboard');
        if (io && broadcastLeaderboard) {
            await broadcastLeaderboard(contestId);
        }

        res.status(200).json({
            success: isAccepted,
            submission: contestSubmission,
            contest: await Contest.findById(contestId)
                .populate('leaderboard.userId', 'firstName lastName')
        });
    } catch (err) {
        console.error("Error submitting contest code:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const contestId = req.params.id;
        const contest = await Contest.findById(contestId)
            .populate('leaderboard.userId', 'firstName lastName emailId')
            .select('leaderboard');

        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Sort leaderboard by problemsSolved (desc) and totalScore (desc)
        const sortedLeaderboard = contest.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalScore - a.totalScore;
        });

        res.status(200).json({ success: true, leaderboard: sortedLeaderboard });
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// Get user's submissions for a contest
const getUserSubmissions = async (req, res) => {
    try {
        const userId = req.result._id;
        const contestId = req.params.id;

        const submissions = await ContestSubmission.find({
            userId,
            contestId
        })
            .populate('problemId', 'title')
            .sort({ submissionTime: -1 });

        res.status(200).json({ success: true, submissions });
    } catch (err) {
        console.error("Error fetching submissions:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

// End/Submit contest for user
const endContest = async (req, res) => {
    try {
        const userId = req.result._id;
        const contestId = req.params.id;

        const contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }

        // Check if user is a participant
        const participant = contest.participants.find(
            p => p.userId.toString() === userId.toString()
        );
        
        if (!participant) {
            return res.status(403).json({ message: "You are not a participant in this contest" });
        }

        // Mark participant as inactive (contest ended for them)
        participant.isActive = false;
        
        // Optionally, set their end time to now if not already set
        if (!participant.endTime || new Date() < participant.endTime) {
            participant.endTime = new Date();
        }

        await contest.save();

        // Get final leaderboard
        const updatedContest = await Contest.findById(contestId)
            .populate('leaderboard.userId', 'firstName lastName emailId');

        // Sort leaderboard
        const sortedLeaderboard = updatedContest.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalScore - a.totalScore;
        });

        res.status(200).json({
            success: true,
            message: "Contest submitted successfully",
            leaderboard: sortedLeaderboard,
            contest: updatedContest
        });
    } catch (err) {
        console.error("Error ending contest:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};

module.exports = {
    createContest,
    getAllContests,
    getContestById,
    joinContest,
    submitContestCode,
    getLeaderboard,
    getUserSubmissions,
    endContest
};

