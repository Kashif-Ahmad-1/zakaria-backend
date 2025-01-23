const express = require('express');
const router = express.Router();
const emiInstallmentController = require('../controllers/emiInstallmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Create new EMI Installments
router.post('/emi-installments',protect, authorizeRoles('finance','admin'), emiInstallmentController.createEMIInstallments);

// Get EMI Installments by TaskId with populated project details
router.get('/emi-installments/:taskId', emiInstallmentController.getEMIInstallmentsByTaskId);

// Update EMI Installment by TaskId and EMI Number
router.put('/emi-installments/:emiInstallmentId',protect, authorizeRoles('finance','admin'), emiInstallmentController.updateEMIInstallment);
router.get('/emi-installments', emiInstallmentController.getAllEMIInstallments);
router.put('/update-emi-installments/:emiInstallmentId', protect, authorizeRoles('finance', 'admin'), emiInstallmentController.updateEMIInstallments);

module.exports = router;
