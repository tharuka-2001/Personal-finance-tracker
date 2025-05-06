const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @route   GET api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.id });

        res.json({
            success: true,
            count: budgets.length,
            data: budgets
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/budgets
// @desc    Create a budget
// @access  Private
router.post('/', [
    protect,
    [
        check('category', 'Category is required').not().isEmpty(),
        check('amount', 'Amount is required').not().isEmpty(),
        check('period', 'Period is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newBudget = new Budget({
            user: req.user.id,
            ...req.body
        });

        const budget = await newBudget.save();

        res.status(201).json({
            success: true,
            data: budget
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', protect, async (req, res) => {
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

        res.json({
            success: true,
            data: budget
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', protect, async (req, res) => {
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
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', protect, async (req, res) => {
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

        await budget.remove();

        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/budgets/:id/progress
// @desc    Get budget progress
// @access  Private
router.get('/:id/progress', protect, async (req, res) => {
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

        // Calculate date range based on budget period
        const now = new Date();
        let startDate = new Date();
        switch (budget.period) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate.setDate(now.getDate() - now.getDay());
                break;
            case 'monthly':
                startDate.setDate(1);
                break;
            case 'yearly':
                startDate.setMonth(0, 1);
                break;
        }

        // Get total expenses for the category in the period
        const expenses = await Transaction.aggregate([
            {
                $match: {
                    user: req.user._id,
                    category: budget.category,
                    type: 'expense',
                    date: { $gte: startDate, $lte: now }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const spent = expenses.length > 0 ? expenses[0].total : 0;
        const remaining = budget.amount - spent;
        const progress = (spent / budget.amount) * 100;

        res.json({
            success: true,
            data: {
                budget: budget.amount,
                spent,
                remaining,
                progress
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 