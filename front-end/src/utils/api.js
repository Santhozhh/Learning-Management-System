import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request:', config.url);
    } else {
      console.log('No auth token available for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Response:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      console.log('Unauthorized access detected, logging out');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Google login for all users (students, faculty, HoD)
  googleLogin: async (userData) => {
    const response = await api.post('/auth/google', userData);
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile (for students to set year and section)
  updateProfile: async (profileData) => {
    try {
      console.log('Sending profile update request with data:', profileData);
      const response = await api.post('/auth/update-profile', profileData);
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Profile update API error:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error response data:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update profile');
      }
      throw new Error('Network error while updating profile');
    }
  },

  // Get all users (for HoD to manage roles)
  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Change user role (only HoD can do this)
  changeUserRole: async (userData) => {
    const response = await api.post('/auth/change-role', userData);
    return response.data;
  }
};

export const classAPI = {
  // Create a new class (for faculty)
  createClass: async (classData) => {
    const response = await api.post('/class', classData);
    return response.data;
  },

  // Get classes for faculty
  getFacultyClasses: async () => {
    const response = await api.get('/class/faculty');
    return response.data;
  },

  // Get classes for student
  getStudentClasses: async () => {
    const response = await api.get('/class/student');
    return response.data;
  },

  // Join a class (for students)
  joinClass: async (classCode) => {
    const response = await api.post('/class/join', { classCode });
    return response.data;
  },

  // Auto-enroll in classes based on year and section
  autoEnroll: async () => {
    const response = await api.post('/class/auto-enroll');
    return response.data;
  },

  // Get a specific class details
  getClassDetails: async (classId) => {
    const response = await api.get(`/class/${classId}`);
    return response.data;
  }
};

export const materialAPI = {
  // Upload class material
  uploadMaterial: async (classId, materialData) => {
    // If materialData contains a file property, use the FormData approach
    if (materialData.file instanceof File) {
      const formData = new FormData();
      formData.append('title', materialData.title);
      formData.append('description', materialData.description);
      formData.append('file', materialData.file);
      
      const response = await api.post(`/material/${classId}/drive`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } 
    // Otherwise use JSON for Cloudinary-uploaded files
    else {
      const response = await api.post(`/material/${classId}`, materialData);
      return response.data;
    }
  },

  // Get materials for a class
  getClassMaterials: async (classId) => {
    const response = await api.get(`/material/${classId}`);
    return response.data;
  },

  // Download a material
  downloadMaterial: async (materialId) => {
    const response = await api.get(`/material/download/${materialId}`, {
      responseType: 'blob',
    });
    return response;
  },

  // Delete a material
  deleteMaterial: async (materialId) => {
    const response = await api.delete(`/material/${materialId}`);
    return response.data;
  }
};

export const assignmentAPI = {
  // Create a new assignment
  createAssignment: async (classId, assignmentData) => {
    const response = await api.post(`/assignment/${classId}`, assignmentData);
    return response.data;
  },

  // Get assignments for a class
  getClassAssignments: async (classId) => {
    const response = await api.get(`/assignment/${classId}`);
    return response.data;
  },

  // Submit an assignment (for students)
  submitAssignment: async (assignmentId, submissionData) => {
    // If the file data is from Cloudinary
    if (submissionData.file && submissionData.file.url) {
      // Send the Cloudinary data directly as JSON
      const response = await api.post(`/assignment/submit/${assignmentId}/cloudinary`, {
        notes: submissionData.notes || '',
        fileUrl: submissionData.file.url,
        fileName: submissionData.file.fileName,
        fileId: submissionData.file.publicId,
        mimeType: submissionData.file.fileType,
        size: submissionData.file.fileSize
      });
      return response.data;
    } 
    // For form data uploads (fallback)
    else if (submissionData.file instanceof File) {
      const formData = new FormData();
      formData.append('notes', submissionData.notes || '');
      formData.append('file', submissionData.file);

      const response = await api.post(`/assignment/submit/${assignmentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      throw new Error('Invalid file data for submission');
    }
  },

  // Get submissions for an assignment (for faculty)
  getAssignmentSubmissions: async (assignmentId) => {
    const response = await api.get(`/assignment/submissions/${assignmentId}`);
    return response.data;
  },

  // Grade a submission
  gradeSubmission: async (submissionId, gradeData) => {
    const response = await api.post(`/assignment/grade/${submissionId}`, gradeData);
    return response.data;
  }
};

export const chatAPI = {
  // Create a new chat thread
  createThread: async (threadData) => {
    const response = await api.post('/chat/thread', threadData);
    return response.data;
  },

  // Get chat threads for current user
  getThreads: async () => {
    const response = await api.get('/chat/threads');
    return response.data;
  },

  // Get messages for a specific thread
  getMessages: async (threadId) => {
    const response = await api.get(`/chat/messages/${threadId}`);
    return response.data;
  },

  // Send a message in a thread
  sendMessage: async (threadId, messageData) => {
    const response = await api.post(`/chat/message/${threadId}`, messageData);
    return response.data;
  }
};

export const notificationAPI = {
  // Get all notifications for current user
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read/all');
    return response.data;
  },
  
  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await api.delete('/notifications/clear/all');
    return response.data;
  }
};

export { api };
export default api;