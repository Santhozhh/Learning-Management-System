const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { mongodb } = require('../config');
const Student = require('../Schemas/Student');

// Connect to MongoDB
mongoose.connect(mongodb)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Registration route
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);

    // Basic validation for required fields
    const requiredFields = ['name', 'email', 'rollNo', 'regNo', 'dateOfBirth', 'department', 'year', 'mobileNo'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Validate mobile number format
    if (!/^\d{10}$/.test(req.body.mobileNo)) {
      return res.status(400).json({
        message: 'Invalid mobile number format. Please enter a 10-digit number.'
      });
    }

    // Validate date format
    const dateOfBirth = new Date(req.body.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format for date of birth. Please use YYYY-MM-DD format.'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [
        { email: req.body.email },
        { rollNo: req.body.rollNo },
        { regNo: req.body.regNo }
      ]
    });

    if (existingStudent) {
      let field = '';
      if (existingStudent.email === req.body.email) field = 'email';
      else if (existingStudent.rollNo === req.body.rollNo) field = 'roll number';
      else field = 'registration number';
      
      return res.status(400).json({
        message: `A student already exists with this ${field}`
      });
    }

    // Create new student
    const studentData = {
      ...req.body,
      dateOfBirth, // Use the parsed date
      // Optional fields will use schema defaults if not provided
    };

    console.log('Creating student with data:', studentData);

    const student = new Student(studentData);
    await student.save();

    // Send success response
    res.status(201).json({ 
      message: 'Registration successful',
      student: {
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        department: student.department,
        year: student.year
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message || 'An unexpected error occurred while registering. Please try again.' 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { name, dateOfBirth } = req.body;
    
    console.log('Login attempt:', { name, dateOfBirth });

    // Find student by name only first
    const student = await Student.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') } // Case-insensitive name match
    });

    console.log('Found student:', student);

    if (!student) {
      return res.status(401).json({
        message: 'Student not found. Please check your name.'
      });
    }

    // Compare the date of birth
    const inputDate = new Date(dateOfBirth);
    const storedDate = new Date(student.dateOfBirth);
    
    // Set both dates to start of day for comparison
    inputDate.setHours(0, 0, 0, 0);
    storedDate.setHours(0, 0, 0, 0);

    console.log('Date comparison:', {
      input: inputDate.toISOString(),
      stored: storedDate.toISOString()
    });

    if (inputDate.getTime() !== storedDate.getTime()) {
      return res.status(401).json({
        message: 'Invalid date of birth. Please check your date of birth.'
      });
    }

    // If both name and date of birth match, send success response
    res.status(200).json({
      message: 'Login successful',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.rollNo,
        department: student.department,
        year: student.year,
        section: student.section
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: 'An unexpected error occurred while logging in. Please try again.'
    });
  }
});

// Get all students route (for testing)
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({}, 'name email rollNo department year');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get student by ID
router.get('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate({
        path: 'classes',
        select: 'className description students createdAt'
      });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student data' });
  }
});

// Update student details
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const {
      name,
      rollNo,
      section,
      batch,
      year,
      department,
      classIncharge,
      mentor,
      courses,
      mobileNo
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Validate mobile number if it's being updated
    if (mobileNo && !/^\d{10}$/.test(mobileNo)) {
      return res.status(400).json({ 
        message: 'Invalid mobile number. Please enter a 10-digit number.' 
      });
    }

    // Update student fields
    if (name) student.name = name;
    if (rollNo) student.rollNo = rollNo;
    if (section) student.section = section;
    if (batch) student.batch = batch;
    if (year) student.year = year;
    if (department) student.department = department;
    if (classIncharge) student.classIncharge = classIncharge;
    if (mentor) student.mentor = mentor;
    if (courses) student.courses = courses;
    if (mobileNo) student.mobileNo = mobileNo;

    try {
      const updatedStudent = await student.save();
      res.json({ 
        message: 'Profile updated successfully',
        student: updatedStudent 
      });
    } catch (validationError) {
      if (validationError.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: Object.values(validationError.errors).map(err => err.message)
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get student's classes
router.get('/classes/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find the student and populate their classes
    const student = await Student.findById(studentId).populate('classes');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student.classes);
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

module.exports = router; 