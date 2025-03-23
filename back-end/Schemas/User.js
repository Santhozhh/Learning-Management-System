const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'hod'],
    default: 'student'
  },
  department: {
    type: String,
    sparse: true
  },
  picture: {
    type: String
  },
  year: {
    type: String,
    sparse: true
  },
  section: {
    type: String,
    sparse: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  googleTokens: {
    type: Object,
    sparse: true
  },
  driveAccess: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User; 