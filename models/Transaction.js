const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
        min: [0, 'Amount cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Housing', 'Healthcare', 'Education', 'Shopping', 'Other']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    tags: [{
        type: String,
        trim: true
    }],
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: function() {
            return this.isRecurring;
        }
    },
    recurringEndDate: {
        type: Date,
        required: function() {
            return this.isRecurring;
        }
    },
    currency: {
        type: String,
        default: 'USD'
    },
    exchangeRate: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Index for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('Transaction', transactionSchema); 