const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('./middlewares/auth');
const Notification = require('../Schemas/Notification');
const User = require('../Schemas/User');
const Class = require('../Schemas/Class');

// Helper function to create notifications
const createNotification = async (data) => {
  try {
    const newNotification = new Notification(data);
    await newNotification.save();
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'name picture role')
      .populate('relatedClass', 'className')
      .populate('relatedAssignment', 'title')
      .populate('relatedMaterial', 'title');
    
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread notification count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if user is the recipient
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: Not your notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/read/all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification for testing (remove in production)
router.post('/test', auth, async (req, res) => {
  try {
    const { recipientId, type, title, message } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }
    
    const notification = await createNotification({
      recipient: recipientId,
      sender: req.user._id,
      type,
      title,
      message
    });
    
    res.status(201).json({ message: 'Test notification created', notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = {
  router,
  createNotification
}; 