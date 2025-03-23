const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Class = require('../Schemas/Class');
const User = require('../Schemas/User');

// Middleware for auth - importing from auth.js
const auth = require('./middlewares/auth');

// Middleware to authorize roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// Create a new class (faculty or hod only)
router.post('/', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { className, section, year, subject, description } = req.body;
    
    if (!className || !section || !year || !subject) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Generate a unique class code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let classCode = generateCode();
    let codeExists = await Class.findOne({ classCode });
    
    // Ensure code uniqueness
    while (codeExists) {
      classCode = generateCode();
      codeExists = await Class.findOne({ classCode });
    }
    
    const newClass = new Class({
      className,
      section,
      year,
      subject,
      description: description || '',
      creator: req.user._id,
      classCode
    });
    
    await newClass.save();
    
    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: newClass._id,
        className: newClass.className,
        section: newClass.section,
        year: newClass.year,
        subject: newClass.subject,
        classCode: newClass.classCode
      }
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all classes created by a faculty member
router.get('/faculty', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const classes = await Class.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .select('className section year subject classCode createdAt students');
    
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching faculty classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all classes for a student
router.get('/student', auth, authorize(['student']), async (req, res) => {
  try {
    // Find classes where the student's year and section match
    const studentYearSection = await Class.find({
      year: req.user.year,
      section: req.user.section
    }).sort({ createdAt: -1 });
    
    // Find classes where the student is specifically added
    const explicitlyEnrolled = await Class.find({
      students: req.user._id
    }).sort({ createdAt: -1 });
    
    // Combine both sets, removing duplicates
    const combinedClasses = [...studentYearSection];
    
    // Add explicit enrollments that aren't already included
    explicitlyEnrolled.forEach(cls => {
      if (!combinedClasses.some(c => c._id.toString() === cls._id.toString())) {
        combinedClasses.push(cls);
      }
    });
    
    res.json({ 
      classes: combinedClasses.map(cls => ({
        id: cls._id,
        className: cls.className,
        section: cls.section,
        year: cls.year,
        subject: cls.subject,
        classCode: cls.classCode,
        createdAt: cls.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching student classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a class with class code (for students)
router.post('/join', auth, authorize(['student']), async (req, res) => {
  try {
    const { classCode } = req.body;
    
    if (!classCode) {
      return res.status(400).json({ message: 'Class code is required' });
    }
    
    const classToJoin = await Class.findOne({ classCode });
    
    if (!classToJoin) {
      return res.status(404).json({ message: 'Class not found with this code' });
    }
    
    // Check if student is already in the class
    if (classToJoin.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are already enrolled in this class' });
    }
    
    // Add student to the class
    classToJoin.students.push(req.user._id);
    await classToJoin.save();
    
    res.json({
      message: 'Successfully joined the class',
      class: {
        id: classToJoin._id,
        className: classToJoin.className,
        section: classToJoin.section,
        year: classToJoin.year,
        subject: classToJoin.subject
      }
    });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get class details
router.get('/:classId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    const classDetails = await Class.findById(req.params.classId)
      .populate('creator', 'name email picture')
      .populate('students', 'name email picture year section');
    
    if (!classDetails) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is creator or a student in the class
    const isCreator = classDetails.creator._id.toString() === req.user._id.toString();
    const isStudent = classDetails.students.some(student => student._id.toString() === req.user._id.toString());
    const isYearSectionMatch = req.user.role === 'student' && 
                               req.user.year === classDetails.year && 
                               req.user.section === classDetails.section;
    
    if (!isCreator && !isStudent && !isYearSectionMatch && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not part of this class' });
    }
    
    res.json({
      class: {
        id: classDetails._id,
        className: classDetails.className,
        section: classDetails.section,
        year: classDetails.year,
        subject: classDetails.subject,
        description: classDetails.description,
        classCode: classDetails.classCode,
        creator: classDetails.creator,
        students: classDetails.students,
        createdAt: classDetails.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auto-enroll students to appropriate classes based on year and section
router.post('/auto-enroll', auth, authorize(['student']), async (req, res) => {
  try {
    if (!req.user.year || !req.user.section) {
      return res.status(400).json({ 
        message: 'You need to set your year and section before auto-enrolling'
      });
    }
    
    // Find all classes matching the student's year and section
    const matchingClasses = await Class.find({
      year: req.user.year,
      section: req.user.section,
      students: { $ne: req.user._id } // Only classes where student is not already enrolled
    });
    
    if (matchingClasses.length === 0) {
      return res.json({ message: 'No new classes found for your year and section' });
    }
    
    // Add student to all matching classes
    const enrollmentPromises = matchingClasses.map(cls => {
      cls.students.push(req.user._id);
      return cls.save();
    });
    
    await Promise.all(enrollmentPromises);
    
    res.json({ 
      message: `Successfully enrolled in ${matchingClasses.length} classes`,
      classes: matchingClasses.map(cls => ({
        id: cls._id,
        className: cls.className,
        section: cls.section,
        year: cls.year,
        subject: cls.subject
      }))
    });
  } catch (error) {
    console.error('Error in auto-enrollment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 