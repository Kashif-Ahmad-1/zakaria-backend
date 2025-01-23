// controllers/newProjectController.js
const NewProject = require('../models/NewProject');
const User = require('../models/User');

// Create a new project
exports.createNewProject = async (req, res) => {
    try {
        const { projectName, clientName, clientMobileNo, unit, paymentType1, paymentType2, emiEnabled } = req.body;

        // Check if user is a sales executive
        if (req.user.role !== 'sales executive' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only sales executives can create projects.' });
        }

        // Create a new project
        const newProject = new NewProject({
            projectName,
            clientName,
            clientMobileNo,
            unit,
            paymentType1,
            paymentType2,
            emiEnabled: emiEnabled || 'no',  // Use provided value or default to 'no'
            createdBy: req.user._id,  // Use the logged-in user (sales executive)
            salesExecutiveName: req.user.name,  // Automatically set the sales executive's name
        });

        // Save the project to the database
        await newProject.save();
        res.status(201).json(newProject);  // The taskId will be automatically generated here

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Update project details
exports.updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { projectName, clientName, clientMobileNo, unit, paymentType1, paymentType2, emiEnabled } = req.body;

        // Find the project to update
        const project = await NewProject.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if the logged-in user is authorized to update
        if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this project.' });
        }

        // Update project fields
        project.projectName = projectName || project.projectName;
        project.clientName = clientName || project.clientName;
        project.clientMobileNo = clientMobileNo || project.clientMobileNo;
        project.unit = unit || project.unit;
        project.paymentType1 = paymentType1 || project.paymentType1;
        project.paymentType2 = paymentType2 || project.paymentType2;
        project.emiEnabled = emiEnabled || project.emiEnabled;

        // Save the updated project (pre-save hook will update taskId and totalPayment)
        await project.save();
        res.status(200).json(project);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all projects created by the logged-in sales executive or admin
exports.getAllProjects = async (req, res) => {
    try {
        // Admin can view all projects
        if (req.user.role === 'admin') {
            const projects = await NewProject.find();
            return res.status(200).json(projects);
        }

        // Sales Executive can view only their own projects
        if (req.user.role === 'sales executive') {
            const projects = await NewProject.find({ createdBy: req.user._id });
            return res.status(200).json(projects);
        }

        res.status(403).json({ message: 'Access denied' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Find and delete the project by its ID
        const project = await NewProject.findByIdAndDelete(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if the logged-in user is authorized to delete the project
        if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this project.' });
        }

        // If project is successfully deleted, return success message
        res.status(200).json({ message: 'Project deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Update project status
exports.updateStatus = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status, rejectionReason } = req.body;

        // Find the project to update
        const project = await NewProject.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if the logged-in user is authorized to update the project
        if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this project.' });
        }

        // If status is 'rejected', rejectionReason must be provided
        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required when status is rejected.' });
        }

        // Update project status
        project.status = status;

        // If rejected, add the rejection reason
        if (status === 'rejected') {
            project.rejectionReason = rejectionReason;
        } else {
            // If status is active, clear the rejection reason
            project.rejectionReason = undefined;
        }

        // Save the updated project
        await project.save();
        res.status(200).json(project);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};