require('dotenv').config();

module.exports = {
  mongodb: process.env.MONGODB_URI || 'mongodb+srv://lms-user:lms-password@cluster0.mongodb.net/LMS?retryWrites=true&w=majority'
};
  