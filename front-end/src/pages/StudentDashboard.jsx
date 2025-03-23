import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../utils/api';
import ClassCard from '../components/ClassCard';

// Helper function to process Google profile URLs
const getProfileImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('googleusercontent.com')) {
    // Convert Google URLs to use our proxy
    return `/googleusercontent${url.split('googleusercontent.com')[1]}`;
  }
  return url;
};

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [showDefaultAvatar, setShowDefaultAvatar] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classCode, setClassCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/');
      return;
    }
    setUser(userData);
    fetchClasses();
  }, [navigate]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getStudentClasses();
      console.log('Student classes:', response);
      setClasses(response.classes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEnroll = async () => {
    try {
      setLoading(true);
      const response = await classAPI.autoEnroll();
      console.log('Auto-enroll response:', response);
      // Refresh classes after auto-enrollment
      fetchClasses();
    } catch (err) {
      console.error('Error auto-enrolling:', err);
      setError('Failed to auto-enroll in classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }
    
    try {
      setLoading(true);
      const response = await classAPI.joinClass(classCode);
      console.log('Join class response:', response);
      setClassCode('');
      // Refresh classes after joining
      fetchClasses();
    } catch (err) {
      console.error('Error joining class:', err);
      setError('Failed to join class. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleImageError = () => {
    console.log('Profile image failed to load');
    setShowDefaultAvatar(true);
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {user.picture && !showDefaultAvatar ? (
                <img 
                  src={getProfileImageUrl(user.picture)} 
                  alt="Profile" 
                  className="h-10 w-10 rounded-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="text-gray-700">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* User Information Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium">{user.year || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Section</p>
                <p className="font-medium">{user.section || 'Not set'}</p>
              </div>
            </div>
          </div>
          
          {/* Join Class Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Join Class</h2>
              <button
                onClick={handleAutoEnroll}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
              >
                Auto-Enroll in Classes
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <form onSubmit={handleJoinClass} className="flex items-center gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Enter class code"
                  className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
              >
                Join Class
              </button>
            </form>
          </div>
          
          {/* Classes Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Classes</h2>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(classItem => (
                  <ClassCard 
                    key={classItem.id || classItem._id} 
                    classData={{
                      ...classItem,
                      id: classItem.id || classItem._id // Ensure id is available
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">You haven't joined any classes yet</p>
                <p className="text-gray-400 text-sm mt-1">Use the form above to join a class with a code or click Auto-Enroll</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 