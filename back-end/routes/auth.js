const express = require('express');
const router = express.Router();
const User = require('../Schemas/User');
const jwt = require('jsonwebtoken');

// Google OAuth route
router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, isStudent } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        name,
        picture,
        isStudent,
        googleId: email, // Using email as googleId since it's unique
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, isStudent: user.isStudent },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        isStudent: user.isStudent,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

module.exports = router; 