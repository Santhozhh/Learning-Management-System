const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password is required only if not using Google auth
    },
  },
  googleId: {
    type: String,
    sparse: true, // Allows null values but maintains unique index
  },
  picture: {
    type: String,
  },
  isStudent: {
    type: Boolean,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: function() {
      return !this.googleId; // Date of birth is required only if not using Google auth
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema); 