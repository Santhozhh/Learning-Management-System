const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../Schemas/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Role-based access middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Change user role (only HoD can do this)
router.post('/change-role', auth, authorize(['hod']), async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role || !['faculty', 'student', 'hod'].includes(role)) {
      return res.status(400).json({ message: 'Invalid user ID or role' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the user's role
    user.role = role;
    if (role !== 'student' && req.body.department) {
      user.department = req.body.department;
    }
    
    await user.save();
    
    res.json({ 
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

// Google OAuth login/signup for all users (students, faculty, HoD)
router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, accessToken, requestDriveAccess } = req.body;
    
    // We don't need to verify the token here as we're receiving an access token, 
    // not an ID token. The client already verified with Google to get user info.
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // New user - create as student by default
      // Role can be changed later by an HoD
      user = new User({
        name,
        email,
        googleId: email,
        picture,
        role: 'student', // Default role for new users
        driveAccess: requestDriveAccess ? accessToken : null
      });
      
      await user.save();
      console.log('Created new user:', user);
    } else {
      // Update user picture if it's changed
      if (picture && user.picture !== picture) {
        user.picture = picture;
      }
      
      // Update drive access token if requested
      if (requestDriveAccess && accessToken) {
        user.driveAccess = accessToken;
      }
      
      await user.save();
    }
    
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    
    // Return user data and token
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture,
        department: user.department,
        year: user.year,
        section: user.section,
        hasDriveAccess: !!user.driveAccess
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// Update user profile (for students to set year and section, and faculty to set experience and designation)
router.post('/update-profile', auth, async (req, res) => {
  try {
    const { year, section, experience, department, designation, role } = req.body;
    console.log('Received profile update request:', req.body);
    
    // Validate inputs based on role
    if (role === 'student') {
      if (!year || !section) {
        return res.status(400).json({ message: 'Year and section are required for students' });
      }
      
      // Validate year format
      if (!['1', '2', '3', '4'].includes(year)) {
        return res.status(400).json({ message: 'Invalid year value' });
      }
      
      // Validate section format
      if (!['A', 'B', 'C'].includes(section)) {
        return res.status(400).json({ message: 'Invalid section value' });
      }
      
      // Update student profile
      req.user.year = year;
      req.user.section = section;
      req.user.role = 'student';
    } else if (role === 'faculty') {
      if (!experience || !department || !designation) {
        return res.status(400).json({ message: 'Experience, department, and designation are required for faculty' });
      }
      
      // Validate experience is a positive number
      const experienceNum = Number(experience);
      if (isNaN(experienceNum) || experienceNum < 0) {
        return res.status(400).json({ message: 'Experience must be a valid positive number' });
      }
      
      // Update faculty profile
      req.user.experience = experienceNum;
      req.user.department = department;
      req.user.designation = designation;
      req.user.role = 'faculty';
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    console.log('Saving user with updated data:', req.user);
    await req.user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        picture: req.user.picture,
        year: req.user.year,
        section: req.user.section,
        experience: req.user.experience,
        department: req.user.department,
        designation: req.user.designation
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
});

// Get all users (for HoD to manage roles)
router.get('/users', auth, authorize(['hod']), async (req, res) => {
  try {
    const users = await User.find({}, 'name email role department picture');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        picture: req.user.picture,
        department: req.user.department,
        year: req.user.year,
        section: req.user.section,
        hasDriveAccess: !!req.user.driveAccess
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

module.exports = { router, auth, authorize }; 