# Leave Management System

A comprehensive platform for managing academic activities including class materials, assignments, and communication between students and faculty.

## Google Drive Integration

This application offers Google Drive integration for file uploads. This feature allows users to:

- Upload class materials directly to Google Drive
- Share files with students via secure links
- Manage file permissions and access
- Delete files when they are no longer needed

### How to Use Google Drive Integration

1. **Sign in with Google**: During login, you'll be prompted to grant Drive access
2. **Upload Files**: When uploading materials in classes, files will be stored in your Google Drive
3. **Automatic Organization**: Files are organized in folders by class
4. **Secure Sharing**: Links are generated for students to access materials

### Technical Details

- The system uses Google Drive API v3
- Files are stored in the user's own Google Drive account
- Each class has its own folder for organization
- Users can revoke Drive access at any time through their Google account settings

## Getting Started

### Backend

```bash
cd back-end
npm install
npm start
```

### Frontend

```bash
cd front-end
npm install
npm run dev
```

## Features

- User authentication with Google Sign-In
- Role-based access control (Students, Faculty, Head of Department)
- Class management and enrollment
- Material sharing with Google Drive integration
- Assignment submission and grading
- Real-time notifications 