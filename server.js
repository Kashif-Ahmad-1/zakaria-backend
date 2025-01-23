const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the CORS package
const nodemailer = require('nodemailer'); // Import nodemailer
const userRoutes = require('./routes/userRoutes');
const newProjectRoutes = require('./routes/newProjectRoutes');
const emiInstallmentRoutes = require('./routes/emiInstallmentRoutes');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize database connection
connectDB();

// Item Schema and Model
const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  units: { type: String, required: true },
  itemRate: { type: String, required: true },
});

const Item = mongoose.model('Item', itemSchema);

const app = express();

// Use CORS middleware to allow all domains to access your API
app.use(cors());

// Middleware to parse incoming requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/projects', newProjectRoutes);
app.use('/api/emi', emiInstallmentRoutes);

// Setup Nodemailer Transporter using environment variables for sensitive data
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,     // Use email from environment variables
    pass: process.env.EMAIL_PASS,     // Use email password from environment variables
  },
});

// Route to send email
// Route to send email to multiple users
app.post('/send-email', (req, res) => {
    const { toEmails, subject, message } = req.body; // Assume toEmails is an array of email addresses
  
    // Validate that toEmails is an array and not empty
    if (!Array.isArray(toEmails) || toEmails.length === 0) {
      return res.status(400).json({ message: 'Please provide a list of email addresses.' });
    }
  
    // Convert the array of email addresses into a comma-separated string
    const recipients = toEmails.join(', ');
  
    // Setup email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Your email (from)
      to: recipients,               // Multiple recipient emails (comma separated or array)
      subject: subject,             // Email subject
      text: `Dear Sir,\n\nRequest you to Kindly provide the price of the items list given below url.\n\n${message}`,                // Email content
    };
  
    // Send email using the transporter
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending email', error });
      } else {
        return res.status(200).json({ message: 'Email sent successfully', info });
      }
    });
  });
  

// Route to save items to the database
app.post('/api/items', async (req, res) => {
  const items = req.body;
  
  // Log the incoming data for debugging purposes
  console.log("Received items:", items);

  // Check if data is an array and contains valid items
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid data format, expected an array of items' });
  }

  try {
    // Insert the items into the database
    const savedItems = await Item.insertMany(items);
    console.log("Saved items:", savedItems);
    res.status(201).json({ message: 'Items saved successfully', data: savedItems });
  } catch (error) {
    console.error('Error saving items:', error);
    res.status(500).json({ message: 'Error saving items', error });
  }
});

// Route to get all items from the database
app.get('/api/items', async (req, res) => {
  try {
    // Retrieve all items from the database
    const items = await Item.find();
    res.status(200).json({ data: items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items', error });
  }
});

// Set the port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
