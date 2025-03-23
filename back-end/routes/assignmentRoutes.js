const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Class = require('../Schemas/Class');
const User = require('../Schemas/User');
const { auth, authorize } = require('./auth');
const driveIntegration = require('../drive-integration');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create a new assignment (faculty only)
router.post('/:classId', auth, authorize(['faculty', 'hod']), upload.single('template'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, dueDate } = req.body;
    
    // Verify ownership of the class
    const classroom = await Class.findOne({
      _id: classId,
      faculty: req.user._id
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or you do not have permission' });
    }
    
    // Initialize new assignment
    const newAssignment = {
      title,
      description,
      dueDate: new Date(dueDate)
    };
    
    // Upload template file to Google Drive if provided
    if (req.file) {
      // For demo purposes, this would integrate with Google Drive
      // In a real implementation, you would retrieve credentials and tokens
      // from a secure storage or user session
      
      /* 
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      
      const drive = await driveIntegration.setupDriveClient(credentials, token);
      
      const uploadedTemplate = await driveIntegration.uploadFile(
        drive,
        req.file.path,
        `${title} - Template`,
        req.file.mimetype
      );
      
      newAssignment.driveTemplateId = uploadedTemplate.id;
      */
      
      // For MVP, just save the path of the uploaded file
      newAssignment.driveTemplateId = req.file.path;
    }
    
    // Add assignment to the class
    classroom.assignments.push(newAssignment);
    await classroom.save();
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: classroom.assignments[classroom.assignments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
});

// Get all assignments for a class
router.get('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classroom = await Class.findById(classId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if user has access to this classroom
    if (req.user.role === 'student') {
      // Student can only access classes they're enrolled in or match their year/section
      const isEnrolled = classroom.students.some(
        student => student.toString() === req.user._id.toString()
      );
      
      const matchesBatch = classroom.batches.some(
        batch => batch.year === req.user.year && batch.section === req.user.section
      );
      
      if (!isEnrolled && !matchesBatch) {
        return res.status(403).json({ message: 'You do not have access to this classroom' });
      }
    } else if (req.user.role === 'faculty' && classroom.faculty.toString() !== req.user._id.toString()) {
      // Faculty can only access their own classrooms
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }
    
    res.json({ assignments: classroom.assignments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch assignments', error: error.message });
  }
});

// Submit assignment (student only)
router.post('/:classId/:assignmentId/submit', auth, authorize(['student']), upload.single('submission'), async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;
    
    const classroom = await Class.findById(classId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Find the assignment
    const assignment = classroom.assignments.id(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Check if assignment is already submitted by this student
    const existingSubmission = assignment.submissions?.find(
      submission => submission.student.toString() === req.user._id.toString()
    );
    
    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }
    
    // Ensure the submissions array exists
    if (!assignment.submissions) {
      assignment.submissions = [];
    }
    
    // Add submission with file information
    const submission = {
      student: req.user._id,
      submittedAt: new Date()
    };
    
    if (req.file) {
      // For MVP, just save the path of the uploaded file
      submission.driveFileId = req.file.path;
      
      /* 
      // In a real implementation with Google Drive:
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      
      const drive = await driveIntegration.setupDriveClient(credentials, token);
      
      // Get faculty email
      const faculty = await User.findById(classroom.faculty);
      
      // Upload submission to Drive
      const uploadedFile = await driveIntegration.uploadFile(
        drive,
        req.file.path,
        `${assignment.title} - ${req.user.name} Submission`,
        req.file.mimetype
      );
      
      // Share with faculty
      await driveIntegration.shareFileWithUser(
        drive,
        uploadedFile.id,
        faculty.email,
        'writer'
      );
      
      submission.driveFileId = uploadedFile.id;
      */
    }
    
    assignment.submissions.push(submission);
    await classroom.save();
    
    res.json({
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
});

// Grade assignment submission (faculty only)
router.post('/:classId/:assignmentId/grade/:submissionId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { classId, assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    
    // Verify ownership of the class
    const classroom = await Class.findOne({
      _id: classId,
      faculty: req.user._id
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or you do not have permission' });
    }
    
    // Find the assignment
    const assignment = classroom.assignments.id(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    // Find the submission
    const submission = assignment.submissions.id(submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Update grade and feedback
    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    
    await classroom.save();
    
    res.json({
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to grade submission', error: error.message });
  }
});

module.exports = router; 