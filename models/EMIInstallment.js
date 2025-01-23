const mongoose = require('mongoose');

// EMIInstallments Schema
const emiInstallmentSchema = new mongoose.Schema({
    newProject: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'NewProject', 
        required: true 
    }, // Linking to NewProject model

    // Store project details directly in the EMIInstallment
    projectName: { type: String, required: true },
    clientName: { type: String, required: true },
    clientMobileNo: { type: String, required: true },
    salesExecutiveName: { type: String, required: true },
    unit: { type: String, required: true },
    paymentType1: { type: Number, required: true },
    paymentType2: { type: Number, required: true },
    totalPayment: { type: Number, required: true },
    taskId: { type: String, required: true },
    totalInstallments: { type: Number, required: true },
    totalPaymentReceived: { type: Number, default: 0 },  // To track the sum of all payments received
    totalPaymentLeft: { type: Number, default: 0 },  // To track the remaining balance
createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    installments: [{
        emiNumber: { type: Number, required: true },
        emiAmount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        amountReceived: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },  // To be calculated automatically
        receivedDate: { type: Date },
        utr: { type: String },
        bankDetails: { type: String },
        paymentHistory: [{
            amountReceived: { type: Number, required: true },
            receivedDate: { type: Date, required: true },
            utr: { type: String },
            bankDetails: { type: String }
        }]
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Pre-save hook to calculate balances and update total payment received and left
emiInstallmentSchema.pre('save', function(next) {
    let totalReceived = 0;

    this.installments.forEach(installment => {
        // Recalculate balance based on the total received amount
        const installmentTotalReceived = installment.paymentHistory.reduce((sum, payment) => sum + payment.amountReceived, 0);
        installment.balance = installment.emiAmount - installmentTotalReceived;

        // Sum up the total received for all installments
        totalReceived += installmentTotalReceived;
    });

    // Update totalPaymentReceived and totalPaymentLeft
    this.totalPaymentReceived = totalReceived;
    this.totalPaymentLeft = this.paymentType1 - totalReceived;

    next();
});

module.exports = mongoose.model('EMIInstallment', emiInstallmentSchema);
