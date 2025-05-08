const Budget = require('../models/Budget');
const { validationResult } = require('express-validator');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: budgets.length,
            data: budgets
        });
    } catch (err) {
        console.error('Error fetching budgets:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const newBudget = new Budget({
            user: req.user.id,
            category: req.body.category,
            amount: parseFloat(req.body.amount),
            period: req.body.period,
            startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
            endDate: req.body.endDate ? new Date(req.body.endDate) : null,
            description: req.body.description
        });

        const budget = await newBudget.save();

        res.status(201).json({
            success: true,
            data: budget
        });
    } catch (err) {
        console.error('Budget creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
    try {
        let budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        // Make sure user owns budget
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        budget = await Budget.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: budget
        });
    } catch (err) {
        console.error('Error updating budget:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        // Make sure user owns budget
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await budget.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Error deleting budget:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get budget statistics
// @route   GET /api/budgets/stats
// @access  Private
exports.getBudgetStats = async (req, res) => {
    try {
        const stats = await Budget.aggregate([
            {
                $match: {
                    user: req.user._id
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalBudget: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        console.error('Error fetching budget stats:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 