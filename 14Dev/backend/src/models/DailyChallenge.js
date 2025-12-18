const mongoose = require('mongoose');
const {Schema} = mongoose;

const dailyChallengeSchema = new Schema({
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    dayNumber: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Index to ensure one challenge per day
dailyChallengeSchema.index({ date: 1 }, { unique: true });

const DailyChallenge = mongoose.model('dailyChallenge', dailyChallengeSchema);

module.exports = DailyChallenge;

