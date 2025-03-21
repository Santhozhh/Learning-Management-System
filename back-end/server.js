const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { mongodb } = require('./config');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
    console.log('Successfully connected to MongoDB.');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});