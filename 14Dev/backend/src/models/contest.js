const mongoose = require('mongoose');
const { Schema } = mongoose;

const contestSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // Duration in minutes (90 minutes = 1:30hr)
        default: 90,
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
            type: Date // When the user actually started the contest
        },
        endTime: {
            type: Date // When the user's contest will end (startTime + duration)
        },
        isActive: {
            type: Boolean,
            default: true
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
        totalScore: {
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
        enum: ['upcoming', 'active', 'ended'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

// Index for better query performance
contestSchema.index({ startTime: 1, endTime: 1 });
contestSchema.index({ 'participants.userId': 1 });

const Contest = mongoose.model('contest', contestSchema);

module.exports = Contest;

