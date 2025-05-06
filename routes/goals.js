const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');

// @route   GET api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id })
            .sort({ targetDate: 1 });

        res.json({
            success: true,
            count: goals.length,
            data: goals
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST api/goals
// @desc    Create a goal
// @access  Private
router.post('/', [
    protect,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('targetAmount', 'Target amount is required').not().isEmpty(),
        check('targetDate', 'Target date is required').not().isEmpty(),
        check('category', 'Category is required').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newGoal = new Goal({
            user: req.user.id,
            ...req.body
        });

        const goal = await newGoal.save();

        res.status(201).json({
            success: true,
            data: goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Make sure user owns goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.json({
            success: true,
            data: goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Make sure user owns goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        goal = await Goal.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: goal
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Make sure user owns goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await goal.remove();

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

// @route   PUT api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
    try {
        const { currentAmount } = req.body;

        let goal = await Goal.findById(req.params.id);

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Make sure user owns goal
        if (goal.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        goal.currentAmount = currentAmount;
        
        // Update status based on progress
        const progress = (currentAmount / goal.targetAmount) * 100;
        if (progress >= 100) {
            goal.status = 'Completed';
        } else if (progress > 0) {
            goal.status = 'In Progress';
        }

        await goal.save();

        res.json({
            success: true,
            data: goal
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