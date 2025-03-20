const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
 
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Class', ClassSchema); 