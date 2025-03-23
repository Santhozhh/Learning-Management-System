import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../utils/api';
import ClassCard from '../components/ClassCard';
import { FiMail, FiCalendar, FiUsers, FiBook, FiLogOut } from 'react-icons/fi';

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
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
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

  const filteredClasses = classes.filter(classItem => 
    classItem.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Year ${classItem.year}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Section ${classItem.section}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.faculty?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
              Student Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* User Information Card */}
        <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Picture */}
              <div className="relative group">
                {user.picture && !showDefaultAvatar ? (
                  <img
                    src={getProfileImageUrl(user.picture)}
                    alt="Profile"
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300">
                    <span className="text-3xl font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
              </div>

              {/* User Details */}
              <div className="flex-grow">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-3 bg-purple-50 rounded-xl p-4">
                      <div className="flex-shrink-0 p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                        <FiMail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Email</p>
                        <p className="text-gray-900 font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-3 bg-blue-50 rounded-xl p-4">
                      <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                        <FiCalendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Year</p>
                        <p className="text-gray-900 font-medium">{user.year || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center space-x-3 bg-green-50 rounded-xl p-4">
                      <div className="flex-shrink-0 p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                        <FiUsers className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Section</p>
                        <p className="text-gray-900 font-medium">{user.section || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Class Section */}
        <div className={`bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 mb-8 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">Join Class</h2>
            <button
              onClick={handleAutoEnroll}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              <FiBook className="w-5 h-5" />
              <span>Auto-Enroll in Classes</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
            >
              Join Class
            </button>
          </form>
        </div>

        {/* Classes Section */}
        <div className={`bg-white/80 backdrop-blur-xl shadow-xl rounded-2xl p-8 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="px-4 py-6 sm:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Classes
              </h2>
              <div className="relative w-full sm:w-[300px]">
                <input
                  type="text"
                  placeholder="Search classes, subjects, faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map(classItem => (
                  <ClassCard 
                    key={classItem.id || classItem._id} 
                    classData={{
                      ...classItem,
                      id: classItem.id || classItem._id
                    }} 
                  />
                ))}
              </div>
            ) : classes.length > 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No classes found matching your search</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">You haven't joined any classes yet</p>
                <p className="text-gray-400 text-sm mt-1">Join a class to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 