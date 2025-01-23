// models/NewProject.js
const mongoose = require('mongoose');

// NewProject Schema
const newProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientMobileNo: { type: String, required: true },
    salesExecutiveName: { type: String, required: true },
    unit: { type: String, required: true },
    paymentType1: { type: Number, required: true },
    paymentType2: { type: Number, required: true },
    totalPayment: { type: Number },
    emiEnabled: { 
        type: String, 
        enum: ['yes', 'no'], 
        default: 'no', // Default value set to 'no'
        required: true 
    },
    taskId: { type: String, unique: true }, // taskId will be unique
    status: { 
        type: String, 
        enum: ['active', 'rejected'], 
        default: 'active', // Default status is 'active'
        required: true 
    },
    rejectionReason: { type: String }, // Optional field for rejection reason
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Calculate total payment before saving
newProjectSchema.pre('save', function(next) {
    // Generate the taskId based on projectName, unit, and clientName
    this.taskId = `${this.projectName}/${this.unit}/${this.clientName}`;
    
    // Calculate total payment before saving
    this.totalPayment = this.paymentType1 + this.paymentType2;
    next();
});

module.exports = mongoose.model('NewProject', newProjectSchema);
