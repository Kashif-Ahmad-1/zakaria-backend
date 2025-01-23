const EMIInstallment = require('../models/EMIInstallment');
const NewProject = require('../models/NewProject');
const User = require('../models/User');
// Create EMI Installments
exports.createEMIInstallments = async (req, res) => {
    try {
        const { projectId, totalInstallments, installments } = req.body; // Accept projectId for linking
        if (req.user.role !== 'finance' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only finance and admin can create emi.' });
        }
        
        const newProject = await NewProject.findById(projectId);  // Find the associated project

        if (!newProject) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Prepare the EMIInstallment document with client details, totalInstallments, and installments
        const newEMI = new EMIInstallment({
            newProject: newProject._id, // Link the new project to EMI
            projectName: newProject.projectName, // Optional if you want to store it directly in EMIInstallment
            clientName: newProject.clientName,
            clientMobileNo: newProject.clientMobileNo,
            salesExecutiveName: newProject.salesExecutiveName,
            unit: newProject.unit,
            paymentType1: newProject.paymentType1,
            paymentType2: newProject.paymentType2,
            totalPayment: newProject.totalPayment,
            taskId: newProject.taskId,
            totalInstallments,
            createdBy: req.user._id,
            installments: installments.map(installment => {
                // Initialize paymentHistory for each installment
                return {
                    ...installment,
                    paymentHistory: [] // Start with an empty payment history
                };
            })
        });

        // Save to database
        await newEMI.save();
        res.status(201).json({ message: 'EMI Installments created successfully!', data: newEMI });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Fetch EMI Installments by TaskId with populated project details
exports.getEMIInstallmentsByTaskId = async (req, res) => {
    try {
        const { taskId } = req.params;
        const emiInstallment = await EMIInstallment.findOne({ 'newProject.taskId': taskId });

        if (!emiInstallment) {
            return res.status(404).json({ message: 'EMI Installments not found' });
        }

        res.status(200).json(emiInstallment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all EMI Installments with populated project details
exports.getAllEMIInstallments = async (req, res) => {
    try {
        const emiInstallments = await EMIInstallment.find();

        if (emiInstallments.length === 0) {
            return res.status(404).json({ message: 'No EMI Installments found' });
        }

        res.status(200).json(emiInstallments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Update an EMI Installment
exports.updateEMIInstallment = async (req, res) => {
    try {
        const { emiInstallmentId } = req.params;  // Extract emiInstallmentId from the request params
        const { totalInstallments, installments } = req.body;  // Extract totalInstallments and an array of installments to update

        // Find the EMIInstallment by its ID
        const emiInstallment = await EMIInstallment.findById(emiInstallmentId);

        if (!emiInstallment) {
            return res.status(404).json({ message: 'EMI Installment not found' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'finance' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this project.' });
        }
        // Update totalInstallments if provided
        if (totalInstallments !== undefined) {
            emiInstallment.totalInstallments = totalInstallments;
        }

        // If installments are provided, iterate over each installment update
        if (installments && Array.isArray(installments)) {
            installments.forEach(update => {
                const { emiNumber, amountReceived, receivedDate, utr, bankDetails } = update;

                // Find the specific installment by emiNumber
                const installment = emiInstallment.installments.find(i => i.emiNumber === Number(emiNumber));

                if (!installment) {
                    // If installment with the given emiNumber does not exist, return an error or handle it based on your requirement
                    return res.status(404).json({ message: `EMI number ${emiNumber} not found` });
                }

                // Add the new payment to the payment history
                installment.paymentHistory.push({
                    amountReceived,
                    receivedDate,
                    utr,
                    bankDetails
                });

                // Recalculate the total amount received for this installment
                const totalReceived = installment.paymentHistory.reduce((sum, payment) => sum + payment.amountReceived, 0);

                // Update the amountReceived field for the installment (this is the sum of all payment amounts)
                installment.amountReceived = totalReceived;

                // Recalculate the balance based on all payments
                installment.balance = installment.emiAmount - totalReceived;
            });
        }

        // Save the updated EMI installment
        await emiInstallment.save();

        res.status(200).json({ message: 'EMI Installments updated successfully!', data: emiInstallment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while updating EMI Installments' });
    }
};


// update the an emi installment which is created by finance
exports.updateEMIInstallments = async (req, res) => {
    try {
        const { emiInstallmentId } = req.params;  // Get the EMI Installment ID from the URL params
        const { totalInstallments, installments } = req.body;  // Get the data to update

        // Validate input
        if (!emiInstallmentId) {
            return res.status(400).json({ message: 'EMI Installment ID is required' });
        }

        if (!totalInstallments && (!installments || !Array.isArray(installments))) {
            return res.status(400).json({ message: 'Invalid data provided. Must provide either totalInstallments or installments.' });
        }

        const emiInstallment = await EMIInstallment.findById(emiInstallmentId);

        if (!emiInstallment) {
            return res.status(404).json({ message: 'EMI Installment not found' });
        }

        // Check if the user has permission to update (admin or finance roles only)
        if (req.user.role !== 'finance' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only finance and admin can update EMI installments' });
        }

        // Update the totalInstallments if provided
        if (totalInstallments) {
            emiInstallment.totalInstallments = totalInstallments;
        }

        // Update the installments array if provided
        if (installments && Array.isArray(installments)) {
            installments.forEach((installment) => {
                const existingInstallment = emiInstallment.installments.find(
                    (item) => item.emiNumber === installment.emiNumber
                );

                if (existingInstallment) {
                    // Only update the fields emiAmount and dueDate
                    if (installment.emiAmount) {
                        existingInstallment.emiAmount = installment.emiAmount;
                    }
                    if (installment.dueDate) {
                        existingInstallment.dueDate = installment.dueDate;
                    }
                    // Recalculate balance after updating
                    existingInstallment.balance = existingInstallment.emiAmount - existingInstallment.paymentHistory.reduce(
                        (sum, payment) => sum + payment.amountReceived,
                        0
                    );
                } else {
                    return res.status(404).json({ message: `Installment with EMI number ${installment.emiNumber} not found` });
                }
            });
        }

        // Recalculate totalPaymentReceived and totalPaymentLeft
        let totalReceived = 0;
        emiInstallment.installments.forEach(installment => {
            // Recalculate totalReceived for all installments
            totalReceived += installment.paymentHistory.reduce((sum, payment) => sum + payment.amountReceived, 0);
            // Recalculate balance after payments
            installment.balance = installment.emiAmount - totalReceived;
        });

        // Update totalPaymentReceived and totalPaymentLeft
        emiInstallment.totalPaymentReceived = totalReceived;
        emiInstallment.totalPaymentLeft = emiInstallment.paymentType1 - totalReceived;

        // Save the updated EMIInstallment to the database
        await emiInstallment.save();

        res.status(200).json({ message: 'EMI Installments updated successfully', data: emiInstallment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
