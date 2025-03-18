const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  uploadedMaterials: [
    {
      title: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  assignments: [
    {
      title: String,
      instructions: String,
      deadline: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  homeworks: [
    {
      title: String,

      
      description: String,
      deadline: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('Faculty', FacultySchema);
