const express = require('express');
const { registerUser, loginUser, getAllUsers,getUserDetails,updateAccountStatus,forgotPassword, resetPassword, editUserDetails, deleteUser } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.get('/details', protect, getUserDetails);
router.put('/update-status', protect, authorizeRoles('admin'), updateAccountStatus);
// Forgot Password Route
router.post('/forgot-password', forgotPassword);

// Reset Password Route
router.post('/reset-password', resetPassword);

// Edit User (Admin only)
router.put('/edit-user/:userId', protect, authorizeRoles('admin'), editUserDetails);

// Delete User (Admin only)
router.delete('/delete-user/:userId', protect, authorizeRoles('admin'), deleteUser);
module.exports = router;
