const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive API setup
const setupDriveClient = async (credentials, token) => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );
  
  oAuth2Client.setCredentials(token);
  return google.drive({ version: 'v3', auth: oAuth2Client });
};

// Create a copy of assignment template for student
const createAssignmentCopy = async (driveClient, templateId, studentName, assignmentTitle) => {
  try {
    // Get the template file
    const getResponse = await driveClient.files.get({
      fileId: templateId,
      fields: 'name,mimeType'
    });
    
    // Create a copy for the student
    const copyResponse = await driveClient.files.copy({
      fileId: templateId,
      requestBody: {
        name: `${assignmentTitle} - ${studentName}`
      }
    });
    
    return copyResponse.data;
  } catch (error) {
    console.error('Error creating assignment copy:', error);
    throw error;
  }
};

// Share file with faculty
const shareFileWithUser = async (driveClient, fileId, userEmail, role = 'writer') => {
  try {
    const response = await driveClient.permissions.create({
      fileId: fileId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: userEmail
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};

// Upload material to Drive
const uploadFile = async (driveClient, filePath, fileName, mimeType, folderId = null) => {
  try {
    const fileMetadata = {
      name: fileName,
    };
    
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };
    
    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id,name,webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Create a folder in Drive
const createFolder = async (driveClient, folderName, parentFolderId = null) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id,name,webViewLink'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

module.exports = {
  setupDriveClient,
  createAssignmentCopy,
  shareFileWithUser,
  uploadFile,
  createFolder
}; 