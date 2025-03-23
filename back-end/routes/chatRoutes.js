const express = require('express');
const router = express.Router();
const Chat = require('../Schemas/Chat');
const Class = require('../Schemas/Class');
const { auth, authorize } = require('./auth');

// Create a new chat thread in a classroom
router.post('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, message } = req.body;
    
    // Verify class exists and user has access
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
    
    // Create new chat thread
    const newChat = new Chat({
      class: classId,
      title,
      description,
      messages: message ? [{
        sender: req.user._id,
        content: message
      }] : []
    });
    
    await newChat.save();
    
    res.status(201).json({
      message: 'Chat thread created successfully',
      chat: newChat
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat thread', error: error.message });
  }
});

// Get all chat threads for a classroom
router.get('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify class exists and user has access
    const classroom = await Class.findById(classId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if user has access to this classroom
    if (req.user.role === 'student') {
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
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }
    
    // Get chat threads
    const chats = await Chat.find({ class: classId })
      .sort({ createdAt: -1 });
    
    res.json({ chats });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat threads', error: error.message });
  }
});

// Get a specific chat thread with messages
router.get('/:classId/:chatId', auth, async (req, res) => {
  try {
    const { classId, chatId } = req.params;
    
    // Verify class exists and user has access
    const classroom = await Class.findById(classId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if user has access to this classroom
    if (req.user.role === 'student') {
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
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }
    
    // Get the chat thread
    const chat = await Chat.findOne({
      _id: chatId,
      class: classId
    }).populate('messages.sender', 'name email picture');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat thread not found' });
    }
    
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch chat thread', error: error.message });
  }
});

// Add a message to a chat thread
router.post('/:classId/:chatId/message', auth, async (req, res) => {
  try {
    const { classId, chatId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Verify class exists and user has access
    const classroom = await Class.findById(classId);
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    // Check if user has access to this classroom
    if (req.user.role === 'student') {
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
      return res.status(403).json({ message: 'You do not have access to this classroom' });
    }
    
    // Add message to chat thread
    const chat = await Chat.findOne({
      _id: chatId,
      class: classId
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat thread not found' });
    }
    
    // Add new message
    chat.messages.push({
      sender: req.user._id,
      content
    });
    
    await chat.save();
    
    // Return the new message
    const newMessage = chat.messages[chat.messages.length - 1];
    
    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: newMessage
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

module.exports = router; 