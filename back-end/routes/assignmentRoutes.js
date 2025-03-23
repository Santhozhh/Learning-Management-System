const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const auth = require('./middlewares/auth');
const Assignment = require('../Schemas/Assignment');
const Submission = require('../Schemas/Submission');
const Class = require('../Schemas/Class');
const googleDriveService = require('../services/googleDriveService');
const authService = require('../services/authService');
const User = require('../Schemas/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Middleware to authorize roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// Create a new assignment (faculty/hod only)
router.post('/:classId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, dueDate, totalPoints } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    if (!title || !dueDate) {
      return res.status(400).json({ message: 'Title and due date are required' });
    }
    
    // Check if class exists and user is the creator
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classDoc.creator.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this class' });
    }
    
    // Create new assignment
    const newAssignment = new Assignment({
      title,
      description: description || '',
      dueDate,
      totalPoints: totalPoints || 100,
      createdBy: req.user._id,
      class: classId
    });
    
    await newAssignment.save();
    
    // Add assignment reference to class
    classDoc.assignments.push(newAssignment._id);
    await classDoc.save();
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        id: newAssignment._id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate,
        totalPoints: newAssignment.totalPoints,
        createdBy: req.user.name,
        createdAt: newAssignment.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all assignments for a class
router.get('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    // Check if class exists and user has access
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is creator, student in the class, or matches year/section
    const isCreator = classDoc.creator.toString() === req.user._id.toString();
    const isStudent = classDoc.students.some(student => student.toString() === req.user._id.toString());
    const isYearSectionMatch = req.user.role === 'student' && 
                              req.user.year === classDoc.year && 
                              req.user.section === classDoc.section;
    
    if (!isCreator && !isStudent && !isYearSectionMatch && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not part of this class' });
    }
    
    // Get assignments for this class
    const assignments = await Assignment.find({ class: classId })
      .sort({ dueDate: 1 })
      .populate('createdBy', 'name email picture');
    
    // For students, fetch their submissions as well
    if (req.user.role === 'student') {
      const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: req.user._id
        });
        
        return {
          id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          totalPoints: assignment.totalPoints,
          createdBy: assignment.createdBy,
          createdAt: assignment.createdAt,
          submission: submission ? {
            id: submission._id,
            submittedAt: submission.createdAt,
            grade: submission.grade,
            feedback: submission.feedback,
            fileUrl: submission.fileUrl,
            fileName: submission.fileName
          } : null
        };
      }));
      
      return res.json({ assignments: enrichedAssignments });
    }
    
    // For faculty, just return the assignments
    res.json({
      assignments: assignments.map(assignment => ({
        id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        totalPoints: assignment.totalPoints,
        createdBy: assignment.createdBy,
        createdAt: assignment.createdAt,
        submissionCount: assignment.submissions.length
      }))
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit an assignment (student only)
router.post('/submit/:assignmentId', auth, authorize(['student']), upload.single('file'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      // Delete temporary file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }
    
    // Find assignment
    const assignment = await Assignment.findById(assignmentId).populate('class');
    
    if (!assignment) {
      // Delete temporary file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check due date
    if (new Date(assignment.dueDate) < new Date()) {
      // Delete temporary file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Assignment is past due date' });
    }
    
    // Check if student is in the class
    const classDoc = await Class.findById(assignment.class._id);
    const isStudent = classDoc.students.some(student => student.toString() === req.user._id.toString());
    const isYearSectionMatch = req.user.year === classDoc.year && req.user.section === classDoc.section;
    
    if (!isStudent && !isYearSectionMatch) {
      // Delete temporary file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied: You are not part of this class' });
    }
    
    // Check if student already submitted this assignment
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user._id
    });
    
    if (existingSubmission) {
      // Delete temporary file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }
    
    // Get OAuth2 client for the user
    const oauthClient = await authService.getOAuth2Client(req.user._id);
    
    // Upload file to Google Drive
    const fileData = {
      name: `Assignment-${assignment.title}-${req.user.name}`,
      mimeType: req.file.mimetype,
      filepath: req.file.path
    };
    
    const driveFile = await googleDriveService.uploadFile(
      oauthClient, 
      fileData, 
      req.user._id,
      false // isStaffUpload = false (student upload)
    );
    
    // Find the teacher's email to give them edit access
    const teacher = await User.findById(assignment.createdBy);
    
    if (teacher && teacher.email) {
      await googleDriveService.setFilePermissions(
        oauthClient,
        driveFile.id,
        'writer',
        'user',
        teacher.email
      );
    }
    
    // Create submission
    const newSubmission = new Submission({
      assignment: assignmentId,
      student: req.user._id,
      fileUrl: driveFile.webViewLink,
      fileId: driveFile.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      notes: notes || ''
    });
    
    await newSubmission.save();
    
    // Add submission reference to assignment
    assignment.submissions.push(newSubmission._id);
    await assignment.save();
    
    // Delete temporary file after upload
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission: {
        id: newSubmission._id,
        fileUrl: newSubmission.fileUrl,
        fileName: newSubmission.fileName,
        submittedAt: newSubmission.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    
    // Delete temporary file if it exists
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all submissions for an assignment (faculty only)
router.get('/submissions/:assignmentId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: 'Invalid assignment ID' });
    }
    
    // Find assignment
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if user is the creator
    if (assignment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this assignment' });
    }
    
    // Get all submissions
    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'name email picture year section');
    
    res.json({
      submissions: submissions.map(submission => ({
        id: submission._id,
        student: submission.student,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        submittedAt: submission.createdAt,
        grade: submission.grade,
        feedback: submission.feedback,
        notes: submission.notes
      }))
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grade a submission (faculty only)
router.post('/grade/:submissionId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: 'Invalid submission ID' });
    }
    
    if (!grade || isNaN(grade)) {
      return res.status(400).json({ message: 'Valid grade is required' });
    }
    
    // Find submission
    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assignment',
        populate: { path: 'createdBy' }
      });
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Check if user is the creator of the assignment
    if (submission.assignment.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this assignment' });
    }
    
    // Update submission
    submission.grade = grade;
    submission.feedback = feedback || '';
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user._id;
    
    await submission.save();
    
    res.json({
      message: 'Submission graded successfully',
      submission: {
        id: submission._id,
        grade: submission.grade,
        feedback: submission.feedback,
        gradedAt: submission.gradedAt
      }
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 