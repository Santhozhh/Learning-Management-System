const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Class = require('../Schemas/Class');
const { auth, authorize } = require('./auth');
const driveIntegration = require('../drive-integration');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/materials');
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
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Upload a new material to a classroom (faculty only)
router.post('/:classId', auth, authorize(['faculty', 'hod']), upload.single('file'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description } = req.body;
    
    // Verify ownership of the class
    const classroom = await Class.findOne({
      _id: classId,
      faculty: req.user._id
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or you do not have permission' });
    }
    
    // Initialize new material
    const newMaterial = {
      title,
      description
    };
    
    // Upload file to Google Drive if provided
    if (req.file) {
      // For MVP, just save the path of the uploaded file
      newMaterial.fileUrl = req.file.path;
      
      /* 
      // In a real implementation with Google Drive:
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      
      const drive = await driveIntegration.setupDriveClient(credentials, token);
      
      // Upload file to Drive
      const uploadedFile = await driveIntegration.uploadFile(
        drive,
        req.file.path,
        title || req.file.originalname,
        req.file.mimetype
      );
      
      newMaterial.fileUrl = uploadedFile.webViewLink;
      newMaterial.driveId = uploadedFile.id;
      */
    }
    
    // Add material to the class
    classroom.materials.push(newMaterial);
    await classroom.save();
    
    res.status(201).json({
      message: 'Material uploaded successfully',
      material: classroom.materials[classroom.materials.length - 1]
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload material', error: error.message });
  }
});

// Get all materials for a class
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
    
    res.json({ materials: classroom.materials });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch materials', error: error.message });
  }
});

// Download a material
router.get('/:classId/:materialId/download', auth, async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    
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
    
    // Find the material
    const material = classroom.materials.id(materialId);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // For real Google Drive implementation, redirect to the webViewLink
    if (material.driveId) {
      return res.redirect(material.fileUrl);
    }
    
    // For MVP, serve the file from local storage
    if (material.fileUrl) {
      return res.download(material.fileUrl);
    }
    
    res.status(404).json({ message: 'File not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to download material', error: error.message });
  }
});

// Delete a material (faculty only)
router.delete('/:classId/:materialId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    
    // Verify ownership of the class
    const classroom = await Class.findOne({
      _id: classId,
      faculty: req.user._id
    });
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found or you do not have permission' });
    }
    
    // Find the material
    const material = classroom.materials.id(materialId);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // If there's a local file, delete it
    if (material.fileUrl && !material.driveId && fs.existsSync(material.fileUrl)) {
      fs.unlinkSync(material.fileUrl);
    }
    
    /* 
    // For real Google Drive implementation, delete the file from Drive
    if (material.driveId) {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      
      const drive = await driveIntegration.setupDriveClient(credentials, token);
      await drive.files.delete({ fileId: material.driveId });
    }
    */
    
    // Remove material from classroom
    classroom.materials.pull(materialId);
    await classroom.save();
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete material', error: error.message });
  }
});

module.exports = router; 