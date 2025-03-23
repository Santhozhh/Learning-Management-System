const jwt = require('jsonwebtoken');
const User = require('../../Schemas/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token and set user in request
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

module.exports = auth; 