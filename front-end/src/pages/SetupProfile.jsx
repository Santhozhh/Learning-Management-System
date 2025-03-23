import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { FiBookOpen, FiUser } from 'react-icons/fi'; // Import icons

const SetupProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('student'); // Default to student
  const [formData, setFormData] = useState({
    year: '',
    section: '',
    experience: '',
    department: '',
    designation: ''
  });
  
  const navigate = useNavigate();

  // Department options
  const departments = [
    { value: 'cse', label: 'Computer Science and Engineering (CSE)' },
    { value: 'ece', label: 'Electronics and Communication Engineering (ECE)' },
    { value: 'eee', label: 'Electrical and Electronics Engineering (EEE)' },
    { value: 'civil', label: 'Civil Engineering' }
  ];

  // Designation options
  const designations = [
    { value: 'assistant_professor', label: 'Assistant Professor' },
    { value: 'associate_professor', label: 'Associate Professor' },
    { value: 'professor', label: 'Professor' },
  ];

  useEffect(() => {
    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!userData.id || !token) {
      console.error('Missing user data or token, redirecting to login');
      navigate('/');
      return;
    }
    
    // If profile is already set up, redirect to appropriate dashboard
    if (userData.role === 'faculty' && userData.experience) {
      navigate('/faculty-dashboard');
      return;
    } else if (userData.role === 'student' && userData.year && userData.section) {
      navigate('/student-dashboard');
      return;
    }
    
    setUser(userData);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    // Reset form data when switching user type
    setFormData({
      year: '',
      section: '',
      experience: '',
      department: '',
      designation: ''
    });
    setError(''); // Clear any existing errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validation based on user type
      if (userType === 'student' && (!formData.year || !formData.section)) {
        setError('Please select both year and section');
        return;
      }
      
      if (userType === 'faculty') {
        if (!formData.experience || !formData.department || !formData.designation) {
          setError('Please fill in all faculty details');
          return;
        }
        
        // Validate experience is a positive number
        const experienceNum = Number(formData.experience);
        if (isNaN(experienceNum) || experienceNum < 0) {
          setError('Experience must be a valid positive number');
          return;
        }
      }
      
      // Update profile based on user type
      const profileData = userType === 'student' 
        ? { 
            year: formData.year,
            section: formData.section,
            role: 'student'
          }
        : {
            experience: Number(formData.experience), // Convert to number
            department: formData.department,
            designation: formData.designation,
            role: 'faculty'
          };

      console.log('Sending profile update:', profileData); // Debug log
      const response = await authAPI.updateProfile(profileData);
      console.log('Profile update response:', response); // Debug log
      
      if (response && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      } else {
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      navigate(userType === 'student' ? '/student-dashboard' : '/faculty-dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      // More detailed error message
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Sign in to access your learning journey
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex gap-4">
          {/* Student Card */}
          <button
            onClick={() => handleUserTypeChange('student')}
            className={`flex-1 relative overflow-hidden group ${
              userType === 'student'
                ? 'bg-white shadow-lg ring-2 ring-indigo-500'
                : 'bg-white shadow hover:shadow-md'
            } rounded-lg p-6 transition-all duration-200 ease-in-out`}
          >
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-full ${
                userType === 'student'
                  ? 'bg-indigo-100'
                  : 'bg-gray-100'
              } mb-3`}>
                <FiUser className={`w-6 h-6 ${
                  userType === 'student'
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-lg font-medium ${
                userType === 'student'
                  ? 'text-indigo-600'
                  : 'text-gray-900'
              }`}>
                Student
              </span>
            </div>
          </button>

          {/* Faculty Card */}
          <button
            onClick={() => handleUserTypeChange('faculty')}
            className={`flex-1 relative overflow-hidden group ${
              userType === 'faculty'
                ? 'bg-white shadow-lg ring-2 ring-indigo-500'
                : 'bg-white shadow hover:shadow-md'
            } rounded-lg p-6 transition-all duration-200 ease-in-out`}
          >
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-full ${
                userType === 'faculty'
                  ? 'bg-indigo-100'
                  : 'bg-gray-100'
              } mb-3`}>
                <FiBookOpen className={`w-6 h-6 ${
                  userType === 'faculty'
                    ? 'text-indigo-600'
                    : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-lg font-medium ${
                userType === 'faculty'
                  ? 'text-indigo-600'
                  : 'text-gray-900'
              }`}>
                Faculty
              </span>
            </div>
          </button>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-6 bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {userType === 'student' ? (
              // Student Form Fields
              <>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
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
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="" disabled>Select your section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </>
            ) : (
              // Faculty Form Fields
              <>
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    placeholder="Enter years of experience"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="" disabled>Select your department</option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="" disabled>Select your designation</option>
                    {designations.map(desig => (
                      <option key={desig.value} value={desig.value}>
                        {desig.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
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