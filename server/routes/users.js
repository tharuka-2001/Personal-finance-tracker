const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, profileController.getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth,
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail()
    ]
], profileController.updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', [
    auth,
    [
        check('currentPassword', 'Current password is required').not().isEmpty(),
        check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ]
], profileController.changePassword);

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', auth, profileController.deleteAccount);

module.exports = router; 