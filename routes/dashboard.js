const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// @route   GET api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Get current date and first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all transactions for the current user
        const transactions = await Transaction.find({ user: req.user.id });

        // Calculate total balance
        const totalBalance = transactions.reduce((acc, transaction) => {
            return acc + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
        }, 0);

        // Calculate monthly income and expenses
        const monthlyTransactions = transactions.filter(t => t.date >= firstDayOfMonth);
        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        // Get recent transactions (last 5)
        const recentTransactions = await Transaction.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(5);

        // Get expenses by category
        const categoryExpenses = await Transaction.aggregate([
            {
                $match: {
                    user: req.user.id,
                    type: 'expense',
                    date: { $gte: firstDayOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' }
                }
            },
            {
                $project: {
                    name: '$_id',
                    value: '$total',
                    _id: 0
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalBalance,
                monthlyIncome,
                monthlyExpenses,
                recentTransactions,
                categoryExpenses
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