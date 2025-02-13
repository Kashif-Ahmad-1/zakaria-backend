const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNo: { type: String,  },
    username: { type: String, required: true, unique: true },
    pswd: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'sales executive', 'finance', 'reco', 'approver'], 
        required: true 
    },
    accountStatus: { 
        type: String, 
        enum: ['active', 'blacklisted'], 
        default: 'active' 
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('pswd')) return next();
    const salt = await bcrypt.genSalt(10);
    this.pswd = await bcrypt.hash(this.pswd, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);
