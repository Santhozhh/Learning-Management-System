const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const auth = require('./middlewares/auth');
const Material = require('../Schemas/Material');
const Class = require('../Schemas/Class');
const User = require('../Schemas/User');
const googleDriveService = require('../services/googleDriveService');
const { createNotification } = require('./notificationRoutes');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to authorize roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

// Upload material to a class via Cloudinary (faculty/hod only)
router.post('/:classId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, fileUrl, fileId, fileName, mimeType, size } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    if (!title || !fileUrl) {
      return res.status(400).json({ message: 'Title and file URL are required' });
    }
    
    // Check if class exists and user is the creator
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classDoc.creator.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this class' });
    }
    
    // Create new material document using Cloudinary URL
    const newMaterial = new Material({
      title,
      description: description || '',
      fileUrl: fileUrl,
      fileId: fileId || 'cloudinary-file',
      fileName: fileName || title,
      mimeType: mimeType || 'application/octet-stream',
      size: size || 0,
      uploadedBy: req.user._id,
      class: classId
    });
    
    await newMaterial.save();
    
    // Add material reference to class
    classDoc.materials.push(newMaterial._id);
    await classDoc.save();
    
    // Create notifications for all students in the class
    const notifyStudents = async () => {
      try {
        // Get all students in the class (specifically added or matching year/section)
        const specificStudents = classDoc.students || [];
        const yearSectionStudents = await User.find({
          role: 'student',
          year: classDoc.year,
          section: classDoc.section
        });
        
        // Combine both sets of students, removing duplicates
        const allStudents = [...specificStudents];
        
        // Add year/section students that aren't already included
        yearSectionStudents.forEach(student => {
          if (!allStudents.some(s => s.toString() === student._id.toString())) {
            allStudents.push(student._id);
          }
        });
        
        // Create notification for each student
        for (const studentId of allStudents) {
          await createNotification({
            recipient: studentId,
            sender: req.user._id,
            type: 'material_uploaded',
            title: 'New Material',
            message: `A new material "${title}" has been uploaded in ${classDoc.className}`,
            relatedClass: classId,
            relatedMaterial: newMaterial._id
          });
        }
      } catch (err) {
        console.error('Error creating notifications:', err);
      }
    };
    
    // Run notifications in background
    notifyStudents();
    
    res.status(201).json({
      message: 'Material uploaded successfully',
      material: {
        id: newMaterial._id,
        title: newMaterial.title,
        description: newMaterial.description,
        fileUrl: newMaterial.fileUrl,
        fileName: newMaterial.fileName,
        uploadedBy: req.user.name,
        createdAt: newMaterial.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Legacy upload endpoint for Google Drive integration
router.post('/:classId/drive', auth, authorize(['faculty', 'hod']), upload.single('file'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID' });
    }
    
    if (!title || !req.file) {
      return res.status(400).json({ message: 'Title and file are required' });
    }
    
    // Check if class exists and user is the creator
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classDoc.creator.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this class' });
    }
    
    // Upload file to Google Drive using the user's drive access
    const folderName = `LMS-Class-${classDoc.name}-${classDoc._id}`;
    const driveFile = await googleDriveService.uploadFile(
      req.user._id,
      req.file,
      folderName
    );
    
    // Create new material document
    const newMaterial = new Material({
      title,
      description: description || '',
      fileUrl: driveFile.viewLink,
      fileId: driveFile.id,
      fileName: driveFile.name,
      mimeType: driveFile.mimeType,
      size: driveFile.size,
      uploadedBy: req.user._id,
      class: classId
    });
    
    await newMaterial.save();
    
    // Add material reference to class
    classDoc.materials.push(newMaterial._id);
    await classDoc.save();
    
    res.status(201).json({
      message: 'Material uploaded successfully',
      material: {
        id: newMaterial._id,
        title: newMaterial.title,
        description: newMaterial.description,
        fileUrl: newMaterial.fileUrl,
        fileName: newMaterial.fileName,
        uploadedBy: req.user.name,
        createdAt: newMaterial.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all materials for a class
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
    
    // Get materials for this class
    const materials = await Material.find({ class: classId })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email picture');
    
    res.json({
      materials: materials.map(material => ({
        id: material._id,
        title: material.title,
        description: material.description,
        fileUrl: material.fileUrl,
        fileName: material.fileName,
        mimeType: material.mimeType,
        size: material.size,
        uploadedBy: material.uploadedBy,
        createdAt: material.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a material (creator or HoD only)
router.delete('/:materialId', auth, authorize(['faculty', 'hod']), async (req, res) => {
  try {
    const { materialId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({ message: 'Invalid material ID' });
    }
    
    // Find material
    const material = await Material.findById(materialId);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Find associated class
    const classDoc = await Class.findById(material.class);
    
    if (!classDoc) {
      return res.status(404).json({ message: 'Associated class not found' });
    }
    
    // Check if user is creator of class or hod
    if (classDoc.creator.toString() !== req.user._id.toString() && req.user.role !== 'hod') {
      return res.status(403).json({ message: 'Access denied: You are not the creator of this class' });
    }
    
    try {
      // Delete file from Google Drive using the user's drive access
      await googleDriveService.deleteFile(req.user._id, material.fileId);
    } catch (driveError) {
      console.error('Error deleting file from Google Drive:', driveError);
      // Continue with deletion of database entry even if Drive deletion fails
    }
    
    // Remove material reference from class
    classDoc.materials = classDoc.materials.filter(
      id => id.toString() !== materialId
    );
    await classDoc.save();
    
    // Delete material document
    await Material.findByIdAndDelete(materialId);
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 