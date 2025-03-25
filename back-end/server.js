const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { router: authRoutes } = require('./routes/auth');
const classRoutes = require('./routes/classRoutes');
const materialRoutes = require('./routes/materialRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { router: notificationRoutes } = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/class', classRoutes);
app.use('/api/material', materialRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Serve uploads directory for development
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});