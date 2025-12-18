const mongoose = require('mongoose');
const {Schema} = mongoose;

const streakSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastCompletedDate: {
        type: Date,
        default: null
    },
    completedChallenges: [{
        challengeDate: {
            type: Date,
            required: true
        },
        problemId: {
            type: Schema.Types.ObjectId,
            ref: 'problem',
            required: true
        }
    }]
}, {
    timestamps: true
});

const Streak = mongoose.model('streak', streakSchema);

module.exports = Streak;

