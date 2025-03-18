const express = require('express');
const router = express.Router();
const Faculty = require('../Schemas/Faculty');
const Class = require('../Schemas/Class');
const Student = require('../Schemas/Student');

// Faculty Registration Route
router.post('/register', async (req, res) => {
  try {
    const { name, dateOfBirth, department, designation, email, mobileNumber } = req.body;

    // Check if faculty already exists with the same name
    const existingFaculty = await Faculty.findOne({ username: name });
    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty with this name already exists' });
    }

    // Create new faculty
    const faculty = new Faculty({
      name,
      username: name, // Using name as username
      password: dateOfBirth, // Using DOB as password
      department
    });

    // Save faculty to database
    await faculty.save();

    // Remove password from response
    const facultyResponse = faculty.toObject();
    delete facultyResponse.password;

    res.status(201).json({
      message: 'Faculty registered successfully',
      faculty: facultyResponse
    });
  } catch (error) {
    console.error('Faculty registration error:', error);
    res.status(500).json({ message: 'Error registering faculty' });
  }
});

// Faculty Login Route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find faculty by username (name)
    const faculty = await Faculty.findOne({ username });
    if (!faculty) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password (DOB) matches
    if (faculty.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Remove password from response
    const facultyResponse = faculty.toObject();
    delete facultyResponse.password;

    res.json({
      message: 'Login successful',
      faculty: facultyResponse
    });
  } catch (error) {
    console.error('Faculty login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Create class route
router.post('/classes/create', async (req, res) => {
  try {
    console.log('Received class creation request:', req.body);
    const { className, description, students } = req.body;

    // Validate required fields
    if (!className || !description) {
      return res.status(400).json({ 
        message: 'Class name and description are required' 
      });
    }

    // Create new class
    const newClass = new Class({
      className,
      description,
      students: students || [], // Handle case where no students are selected
      createdAt: new Date()
    });

    console.log('Creating new class:', newClass);

    // Save the class
    const savedClass = await newClass.save();

    // If there are students, update their records
    if (students && students.length > 0) {
      try {
        await Student.updateMany(
          { _id: { $in: students } },
          { $push: { classes: savedClass._id } }
        );
        console.log('Updated student records with new class');
      } catch (error) {
        console.error('Error updating student records:', error);
        // Don't fail the whole request if student update fails
      }
    }

    // Populate the students field before sending response
    const populatedClass = await Class.findById(savedClass._id).populate('students', 'name rollNo section year');

    console.log('Class created successfully:', populatedClass);
    res.status(201).json(populatedClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ 
      message: 'Error creating class',
      error: error.message 
    });
  }
});

module.exports = router; 