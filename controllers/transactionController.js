const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id })
            .sort({ date: -1 });

        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Log the request body
        console.log('Creating transaction with data:', {
            user: req.user.id,
            type: req.body.type,
            amount: req.body.amount,
            category: req.body.category,
            description: req.body.description,
            date: req.body.date
        });

        // Create new transaction
        const newTransaction = new Transaction({
            user: req.user.id,
            type: req.body.type,
            amount: parseFloat(req.body.amount),
            category: req.body.category,
            description: req.body.description,
            date: req.body.date ? new Date(req.body.date) : new Date()
        });

        // Log the transaction object before saving
        console.log('Transaction object before save:', newTransaction);

        // Save transaction
        const transaction = await newTransaction.save();
        console.log('Transaction saved successfully:', transaction);

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        console.error('Transaction creation error:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        
        // Check for specific error types
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(err.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Make sure user owns transaction
        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (err) {
        console.error('Error fetching transaction:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Make sure user owns transaction
        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        transaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: transaction
        });
    } catch (err) {
        console.error('Error updating transaction:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Make sure user owns transaction
        if (transaction.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await transaction.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Error deleting transaction:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get monthly statistics
// @route   GET /api/transactions/stats/monthly
// @access  Private
exports.getMonthlyStats = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            {
                $match: {
                    user: req.user._id
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        type: "$type"
                    },
                    total: { $sum: "$amount" }
                }
            },
            {
                $sort: {
                    "_id.year": -1,
                    "_id.month": -1
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error('Error fetching monthly stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 