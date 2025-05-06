const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Shopping', 'Other']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide a budget amount'],
        min: [0, 'Budget amount cannot be negative']
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    currency: {
        type: String,
        default: 'USD'
    },
    notifications: {
        enabled: {
            type: Boolean,
            default: true
        },
        threshold: {
            type: Number,
            default: 80, // Percentage of budget used
            min: 0,
            max: 100
        }
    }
}, {
    timestamps: true
});

// Index for faster queries
budgetSchema.index({ user: 1, category: 1 });
budgetSchema.index({ user: 1, startDate: 1 });

module.exports = mongoose.model('Budget', budgetSchema); 