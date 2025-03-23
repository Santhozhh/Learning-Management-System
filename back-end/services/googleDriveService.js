const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const User = require('../Schemas/User');

// Google Drive API setup
const setupDriveClient = (oauthClient) => {
  return google.drive({ version: 'v3', auth: oauthClient });
};

// Create a Drive client for a user
const createDriveClient = async (accessToken) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth: oauth2Client });
};

/**
 * Upload a file to Google Drive
 * @param {Object} oauthClient - Authenticated OAuth2 client
 * @param {Object} fileData - File data including name, mimeType and filepath
 * @param {String} userId - User ID who is uploading the file
 * @param {Boolean} isStaffUpload - Whether this is a staff upload (for permissions)
 * @returns {Object} - Google Drive file data
 */
const uploadFile = async (userId, file, folderName) => {
  try {
    // Find user and get their drive access token
    const user = await User.findById(userId);
    if (!user || !user.driveAccess) {
      throw new Error('User has not granted Drive access');
    }
    
    const drive = await createDriveClient(user.driveAccess);
    
    // Create a folder if it doesn't exist
    let folderId = await findOrCreateFolder(drive, folderName);
    
    // Upload the file to the folder
    const fileMetadata = {
      name: file.originalname,
      parents: [folderId]
    };
    
    const media = {
      mimeType: file.mimetype,
      body: file.buffer
    };
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,mimeType,size,webViewLink,webContentLink'
    });
    
    // Make the file accessible via link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    // Get the updated file with the viewable link
    const updatedFile = await drive.files.get({
      fileId: response.data.id,
      fields: 'id,name,mimeType,size,webViewLink,webContentLink'
    });
    
    return {
      id: updatedFile.data.id,
      name: updatedFile.data.name,
      mimeType: updatedFile.data.mimeType,
      size: updatedFile.data.size,
      viewLink: updatedFile.data.webViewLink,
      downloadLink: updatedFile.data.webContentLink
    };
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw new Error(`Failed to upload file to Google Drive: ${error.message}`);
  }
};

// Find or create a folder in Google Drive
const findOrCreateFolder = async (drive, folderName) => {
  try {
    // Check if folder already exists
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }
    
    // Create the folder if it doesn't exist
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });
    
    return folder.data.id;
  } catch (error) {
    console.error('Error finding/creating folder:', error);
    throw error;
  }
};

/**
 * Change permissions for a Google Drive file
 * @param {Object} oauthClient - Authenticated OAuth2 client
 * @param {String} fileId - Google Drive file ID
 * @param {String} role - Permission role ('reader', 'writer', 'owner')
 * @param {String} type - Permission type ('user', 'group', 'domain', 'anyone')
 * @param {String} emailAddress - Email address to give permission to (if type is 'user' or 'group')
 */
const setFilePermissions = async (oauthClient, fileId, role, type, emailAddress = null) => {
  try {
    const drive = setupDriveClient(oauthClient);
    
    const requestBody = {
      role: role,
      type: type
    };

    if (type === 'user' || type === 'group') {
      if (!emailAddress) {
        throw new Error('Email address is required for user or group permissions');
      }
      requestBody.emailAddress = emailAddress;
    }

    await drive.permissions.create({
      fileId: fileId,
      requestBody: requestBody
    });

    return true;
  } catch (error) {
    console.error('Error setting file permissions:', error);
    throw error;
  }
};

/**
 * Get the permission ID for a specific user on a file
 * @param {Object} oauthClient - Authenticated OAuth2 client
 * @param {String} fileId - Google Drive file ID
 * @param {String} userEmail - Email address to look up
 */
const getPermissionId = async (oauthClient, fileId, userEmail) => {
  try {
    const drive = setupDriveClient(oauthClient);
    
    const response = await drive.permissions.list({
      fileId: fileId
    });
    
    const permission = response.data.permissions.find(p => 
      p.emailAddress && p.emailAddress.toLowerCase() === userEmail.toLowerCase()
    );
    
    return permission ? permission.id : null;
  } catch (error) {
    console.error('Error getting permission ID:', error);
    throw error;
  }
};

/**
 * Update existing permissions for a Google Drive file
 * @param {Object} oauthClient - Authenticated OAuth2 client
 * @param {String} fileId - Google Drive file ID
 * @param {String} permissionId - Permission ID to update
 * @param {String} role - New permission role ('reader', 'writer', 'owner')
 */
const updateFilePermissions = async (oauthClient, fileId, permissionId, role) => {
  try {
    const drive = setupDriveClient(oauthClient);
    
    await drive.permissions.update({
      fileId: fileId,
      permissionId: permissionId,
      requestBody: {
        role: role
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating file permissions:', error);
    throw error;
  }
};

// Delete a file from Google Drive
const deleteFile = async (userId, fileId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.driveAccess) {
      throw new Error('User has not granted Drive access');
    }
    
    const drive = await createDriveClient(user.driveAccess);
    await drive.files.delete({ fileId });
    
    return { success: true };
  } catch (error) {
    console.error('Google Drive delete error:', error);
    throw new Error(`Failed to delete file from Google Drive: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  deleteFile
}; 