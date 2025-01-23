// routes/newProjectRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const newProjectController = require('../controllers/newProjectController');

// Route for creating a new project (only available to sales executives)
router.post('/new', protect, authorizeRoles('sales executive','admin'), newProjectController.createNewProject);

// Route for getting all projects (admin can view all, sales executive can view only their own projects)
router.get('/', protect, newProjectController.getAllProjects);

// Route for updating a project
router.put('/:projectId', protect, authorizeRoles('admin', 'sales executive'), newProjectController.updateProject);

// Route for deleting a project
router.delete('/:projectId', protect, authorizeRoles('admin', 'sales executive'), newProjectController.deleteProject);

router.put('/update-status/:projectId', protect,authorizeRoles('admin', 'sales executive'), newProjectController.updateStatus);

module.exports = router;
