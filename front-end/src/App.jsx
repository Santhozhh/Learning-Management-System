// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginForm from './components/LoginForm';
import SetupProfile from './pages/SetupProfile';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ClassDetails from './pages/ClassDetails';
import './App.css';

// Get the Google Client ID from environment variables or use fallback
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "745877836485-agg39ubvbkjn6mg6pq3and7cm46i9gkp.apps.googleusercontent.com";

// PrivateRoute component to protect routes
const PrivateRoute = ({ element, requiredRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // If not logged in, redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // If role is required and doesn't match, redirect to appropriate dashboard
  if (requiredRole && (Array.isArray(requiredRole) ? !requiredRole.includes(user.role) : user.role !== requiredRole)) {
    if (user.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else {
      return <Navigate to="/faculty-dashboard" replace />;
    }
  }
  
  // Otherwise, render the protected component
  return element;
};

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LoginForm />} />
          
          {/* Setup Profile Route (for first-time students) */}
          <Route 
            path="/setup-profile" 
            element={<PrivateRoute element={<SetupProfile />} requiredRole="student" />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/student-dashboard" 
            element={<PrivateRoute element={<StudentDashboard />} requiredRole="student" />} 
          />
          <Route 
            path="/faculty-dashboard" 
            element={<PrivateRoute element={<FacultyDashboard />} requiredRole={['faculty', 'hod']} />} 
          />
          
          {/* Class Details - accessible to both students and faculty */}
          <Route 
            path="/class/:classId" 
            element={<PrivateRoute element={<ClassDetails />} />} 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;