const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register User
exports.registerUser = async (req, res) => {
    const { name, email, mobileNo, username, pswd, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, mobileNo, username, pswd, role });
        if (user) {
            res.status(201).json({ 
                id: user._id, 
                role: user.role, 
                token: generateToken(user._id, user.role) 
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Login User
exports.loginUser = async (req, res) => {
    const { login, pswd } = req.body; // login can be email or username

    try {
        // Check if login is an email or username and find the user
        const user = await User.findOne({ 
            $or: [{ email: login }, { username: login }] 
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email/username or password' });
        }

// Check if the account is blacklisted
if (user.accountStatus === 'blacklisted') {
    return res.status(400).json({ message: 'Your account is blacklisted. Please contact support.' });
}
        // Compare passwords (hashed password in DB and plain text password input)
        const isMatch = await bcrypt.compare(pswd, user.pswd);
       

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email/username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.status(200).json({
            id: user._id,
            role: user.role,
            token,
        });
    } catch (error) {
        console.error('Error in loginUser:', error.message);
        res.status(500).json({ message: error.message });
    }
};



// Get All Users (Admin Only)
exports.getAllUsers = async (req, res) => {
    try {
        // Fetch users and sort by createdAt field in descending order
        const users = await User.find().sort({ createdAt: -1 }); // -1 for descending order
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.getUserDetails = async (req, res) => {
    try {
        // `req.user` is already populated by the `protect` middleware
        const { name, email, mobileNo, role } = req.user;

        // Respond with the user details
        res.status(200).json({
            name,
            email,
            mobileNo,
            role
        });
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Forgot Password - Generate reset token and send email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Create reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour expiry
        await user.save();

        // Send email with reset link (using nodemailer)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // Your email password or app password
            },
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            to: user.email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset Password - Update the password using the reset token
exports.resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
  
    try {
        // Find the user with the reset token and check if the token is expired
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpire: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Update the user's password with the new password (no hashing here)
        user.pswd = newPassword; // This stores the plain text password directly

        // Clear the reset token and expiration
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Save the updated user data
        await user.save();

        res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
        console.error('Error in resetting password:', error);
        res.status(500).json({ message: error.message });
    }
};


// Edit User Details (Admin only)
exports.editUserDetails = async (req, res) => {
    const { userId } = req.params;  // Get userId from route params
    const { name, email, mobileNo, username, role, accountStatus } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user details
        user.name = name || user.name;
        user.email = email || user.email;
        user.mobileNo = mobileNo || user.mobileNo;
        user.username = username || user.username;
        user.role = role || user.role;
        user.accountStatus = accountStatus || user.accountStatus;

        await user.save();
        res.status(200).json({ message: 'User details updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Delete User (Admin only)
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;  // Get userId from route params

    try {
        // Find and delete the user by ID
        const user = await User.findByIdAndDelete(userId);

        // If the user is not found, return 404 error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send success response
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        // Handle errors (e.g., database connection issue)
        console.error(error);  // Log the error for debugging purposes
        res.status(500).json({ message: 'Server error, please try again later' });
    }
};


// Update Account Status (Admin)
exports.updateAccountStatus = async (req, res) => {
    const { userId, accountStatus } = req.body; // `userId` is the ID of the user, and `accountStatus` is the new status

    try {
        if (!['active', 'blacklisted'].includes(accountStatus)) {
            return res.status(400).json({ message: 'Invalid account status' });
        }

        const user = await User.findByIdAndUpdate(userId, { accountStatus }, { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: `User account status updated to ${accountStatus}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                accountStatus: user.accountStatus,
            },
        });
    } catch (error) {
        console.error('Error updating account status:', error.message);
        res.status(500).json({ message: error.message });
    }
};
