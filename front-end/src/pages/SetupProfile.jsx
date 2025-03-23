import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const SetupProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    year: '',
    section: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    console.log('Setup Profile - User Data:', userData);
    console.log('Setup Profile - Token Available:', !!token);
    
    if (!userData.id || !token) {
      console.error('Missing user data or token, redirecting to login');
      // Not logged in, redirect to login
      navigate('/');
      return;
    }
    
    if (userData.role !== 'student') {
      console.log('Non-student user detected, redirecting to faculty dashboard');
      // Not a student, redirect to appropriate dashboard
      navigate('/faculty-dashboard');
      return;
    }
    
    if (userData.year && userData.section) {
      console.log('Student already has year and section, redirecting to dashboard');
      // Already has year and section, redirect to dashboard
      navigate('/student-dashboard');
      return;
    }
    
    setUser(userData);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!formData.year || !formData.section) {
      setError('Please select both year and section');
      setLoading(false);
      return;
    }
    
    console.log('Submitting profile update:', formData);
    console.log('User token available:', !!localStorage.getItem('token'));
    
    try {
      // Update the user profile with year and section
      const response = await authAPI.updateProfile({
        year: formData.year,
        section: formData.section
      });
      
      console.log('Profile update response:', response);
      
      // Update user in localStorage
      if (response && response.user) {
        console.log('Using server response user data for update');
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        // Fallback if API doesn't return user object
        console.log('Using local user data for update (no user in response)');
        const updatedUser = { 
          ...user, 
          year: formData.year, 
          section: formData.section 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      console.log('Profile update complete, redirecting to dashboard');
      // Redirect to dashboard
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please select your year and section
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>Select your year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>Select your section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Save and Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupProfile; 