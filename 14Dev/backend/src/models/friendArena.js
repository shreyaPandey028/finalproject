const mongoose = require('mongoose');
const { Schema } = mongoose;

const friendArenaSchema = new Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    topic: {
        type: String,
        enum: ['array', 'linkedList', 'graph', 'dp'],
        required: true
    },
    problems: [{
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    }],
    participants: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        startTime: {
            type: Date
        },
        endTime: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: true
        },
        tabSwitches: {
            type: Number,
            default: 0
        },
        isDisqualified: {
            type: Boolean,
            default: false
        },
        disqualificationReason: {
            type: String
        }
    }],
    leaderboard: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        problemsSolved: {
            type: Number,
            default: 0
        },
        totalTestCasesPassed: {
            type: Number,
            default: 0
        },
        submissions: [{
            problemId: {
                type: Schema.Types.ObjectId,
                ref: 'problem'
            },
            solved: {
                type: Boolean,
                default: false
            },
            testCasesPassed: {
                type: Number,
                default: 0
            },
            totalTestCases: {
                type: Number,
                default: 0
            },
            submissionTime: Date,
            attempts: {
                type: Number,
                default: 0
            }
        }]
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'active', 'ended'],
        default: 'waiting'
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for room code lookup
friendArenaSchema.index({ roomCode: 1 });
friendArenaSchema.index({ status: 1 });

const FriendArena = mongoose.model('friendArena', friendArenaSchema);

module.exports = FriendArena;

