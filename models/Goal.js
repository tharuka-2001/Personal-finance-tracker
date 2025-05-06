const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a goal name'],
        trim: true
    },
    targetAmount: {
        type: Number,
        required: [true, 'Please provide a target amount'],
        min: [0, 'Target amount cannot be negative']
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: [0, 'Current amount cannot be negative']
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetDate: {
        type: Date,
        required: [true, 'Please provide a target date']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['Savings', 'Investment', 'Purchase', 'Debt Repayment', 'Other']
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Abandoned'],
        default: 'Not Started'
    },
    currency: {
        type: String,
        default: 'USD'
    },
    autoAllocate: {
        enabled: {
            type: Boolean,
            default: false
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for faster queries
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
    return (this.currentAmount / this.targetAmount) * 100;
});

module.exports = mongoose.model('Goal', goalSchema); 