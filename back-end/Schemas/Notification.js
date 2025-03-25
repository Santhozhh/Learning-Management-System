const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['assignment_created', 'material_uploaded', 'assignment_submitted'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  relatedAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  relatedMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  relatedSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 