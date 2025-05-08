const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
    getTransactions,
    createTransaction,
    getTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlyStats
} = require('../controllers/transactionController');

// Validation middleware
const transactionValidation = [
    check('type', 'Type is required').isIn(['income', 'expense']),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('category', 'Category is required').isIn([
        // Income categories
        'Salary', 'Freelance', 'Investments', 'Other',
        // Expense categories
        'Food', 'Transportation', 'Entertainment', 'Utilities', 
        'Housing', 'Healthcare', 'Education', 'Shopping', 'Other'
    ]),
    check('description', 'Description is required').not().isEmpty()
];

// Routes
router.get('/', protect, getTransactions);
router.post('/', [protect, ...transactionValidation], createTransaction);
router.get('/:id', protect, getTransaction);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.get('/stats/monthly', protect, getMonthlyStats);

module.exports = router; 