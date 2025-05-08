const Goal = require('../models/Goal');
const { validationResult } = require('express-validator');

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: goals.length,
            data: goals
        });
    } catch (err) {
        console.error('Error fetching goals:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const newGoal = new Goal({
            user: req.user.id,
            type: req.body.type,
            targetAmount: parseFloat(req.body.targetAmount),
            currentAmount: parseFloat(req.body.currentAmount || 0),
            deadline: req.body.deadline ? new Date(req.body.deadline) : null,
            description: req.body.description,
            status: req.body.status || 'in-progress'
        });

        const goal = await newGoal.save();

        res.status(201).json({
            success: true,
            data: goal
        });
    } catch (err) {
        console.error('Goal creation error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
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
        console.error('Error updating goal:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
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

        await goal.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error('Error deleting goal:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update goal progress
// @route   PUT /api/goals/:id/progress
// @access  Private
exports.updateGoalProgress = async (req, res) => {
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

        // Update current amount
        goal.currentAmount = parseFloat(req.body.amount);
        
        // Check if goal is completed
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = 'completed';
        }

        await goal.save();

        res.json({
            success: true,
            data: goal
        });
    } catch (err) {
        console.error('Error updating goal progress:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 