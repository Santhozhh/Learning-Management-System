const { google } = require('googleapis');
const User = require('../Schemas/User');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Define scopes needed for our application
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.file' // For Google Drive file access
];

/**
 * Generate OAuth2 URL for Google authentication
 * @returns {String} Authorization URL
 */
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // To get refresh token
    scope: SCOPES,
    prompt: 'consent' // To ensure we always get a refresh token
  });
};

/**
 * Get tokens from authorization code
 * @param {String} code - Authorization code
 * @returns {Object} Tokens object
 */
const getTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Set credentials on the OAuth2 client
 * @param {Object} tokens - OAuth tokens
 */
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

/**
 * Get OAuth2 client with user's tokens
 * @param {String} userId - User ID
 * @returns {Object} Authenticated OAuth2 client
 */
const getOAuth2Client = async (userId) => {
  try {
    // Find user in database
    const user = await User.findById(userId);
    
    if (!user || !user.googleTokens) {
      throw new Error('User not found or no Google tokens available');
    }
    
    // Set credentials and return client
    oauth2Client.setCredentials(user.googleTokens);
    
    // Check if token is expired and refresh if needed
    if (user.googleTokens.expiry_date && user.googleTokens.expiry_date <= Date.now()) {
      // Refresh token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      user.googleTokens = credentials;
      await user.save();
      
      // Set new credentials
      oauth2Client.setCredentials(credentials);
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('Error getting OAuth2 client:', error);
    throw error;
  }
};

/**
 * Save Google tokens to user record
 * @param {String} userId - User ID
 * @param {Object} tokens - OAuth tokens
 */
const saveUserTokens = async (userId, tokens) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    user.googleTokens = tokens;
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error saving user tokens:', error);
    throw error;
  }
};

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  setCredentials,
  getOAuth2Client,
  saveUserTokens,
  oauth2Client
}; 