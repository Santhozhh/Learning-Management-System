import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI, authAPI } from '../utils/api';
import ClassCard from '../components/ClassCard';
import { FiX, FiMail, FiPhone, FiBookOpen, FiCalendar } from 'react-icons/fi';
import NotificationBell from '../components/NotificationBell';

// Helper function to process Google profile URLs
const getProfileImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('googleusercontent.com')) {
    // Convert Google URLs to use our proxy
    return `/googleusercontent${url.split('googleusercontent.com')[1]}`;
  }
  return url;
};

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [showDefaultAvatar, setShowDefaultAvatar] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    className: '',
    subject: '',
    year: '',
    section: '',
    description: ''
  });
  const [showRoleManagementModal, setShowRoleManagementModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleData, setUserRoleData] = useState({ userId: '', role: '' });
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [departmentStats, setDepartmentStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const navigate = useNavigate();

  // Update the fetchDepartments function
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      // For now, we'll use hardcoded departments since we know the structure
      setDepartments([
        { id: 'CSE', name: 'Computer Science and Engineering' },
        { id: 'ECE', name: 'Electronics and Communication Engineering' },
        { id: 'EEE', name: 'Electrical and Electronics Engineering' },
        { id: 'CIVIL', name: 'Civil Engineering' }
      ]);
      setError(null);
    } catch (err) {
      console.error('Error setting departments:', err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/');
      return;
    }
    setUser(userData);
    
    // Fetch faculty's classes and departments
    fetchClasses();
    fetchDepartments();
  }, [navigate]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getFacultyClasses();
      console.log('Faculty classes:', response);
      setClasses(response.classes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    console.log('Profile image failed to load');
    setShowDefaultAvatar(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    
    const { className, subject, year, section, description } = createFormData;
    
    if (!className || !subject || !year || !section) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const response = await classAPI.createClass(createFormData);
      console.log('Class creation response:', response);
      
      // Reset form and close modal
      setCreateFormData({
        className: '',
        subject: '',
        year: '',
        section: '',
        description: ''
      });
      setShowCreateForm(false);
      
      // Refresh classes after creation
      fetchClasses();
    } catch (err) {
      console.error('Error creating class:', err);
      setError('Failed to create class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isHoD = user?.role === 'hod';

  // Fetch all users for HoD role management
  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await authAPI.getAllUsers();
      console.log('All users:', response);
      setAllUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (e) => {
    e.preventDefault();
    
    const { userId, role } = userRoleData;
    
    if (!userId || !role) {
      setError('Please select a user and a role');
      return;
    }
    
    try {
      setLoading(true);
      const response = await authAPI.changeUserRole({ userId, role });
      console.log('Role change response:', response);
      
      // Update user in the list
      setAllUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, role } : user
        )
      );
      
      // Reset form data
      setUserRoleData({ userId: '', role: '' });
      setError(null);
    } catch (err) {
      console.error('Error changing role:', err);
      setError('Failed to change role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate department statistics
  const calculateDepartmentStats = () => {
    if (!classes.length) {
      setDepartmentStats({
        totalClasses: 0,
        totalStudents: 0,
        classesByYear: {},
        studentsPerClass: 0
      });
      return;
    }
    
    const totalClasses = classes.length;
    let totalStudents = 0;
    const classesByYear = {};
    
    classes.forEach(cls => {
      // Count students
      const studentCount = cls.students?.length || 0;
      totalStudents += studentCount;
      
      // Group by year
      if (!classesByYear[cls.year]) {
        classesByYear[cls.year] = 0;
      }
      classesByYear[cls.year]++;
    });
    
    setDepartmentStats({
      totalClasses,
      totalStudents,
      classesByYear,
      studentsPerClass: totalStudents / totalClasses
    });
  };

  const handleUserRoleFormChange = (e) => {
    const { name, value } = e.target;
    setUserRoleData(prev => ({ ...prev, [name]: value }));
  };

  const filteredClasses = classes.filter(classItem => 
    classItem.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Year ${classItem.year}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Section ${classItem.section}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add this function to fetch faculty list
  const fetchFacultyList = async () => {
    try {
      setLoadingFaculty(true);
      // Replace this with your actual API call
      const response = await fetch('/api/faculty/list');
      const data = await response.json();
      setFacultyList(data.faculty || []);
    } catch (error) {
      console.error('Error fetching faculty list:', error);
    } finally {
      setLoadingFaculty(false);
    }
  };

  // Add this useEffect to fetch faculty when modal opens
  useEffect(() => {
    if (showFacultyModal) {
      fetchFacultyList();
    }
  }, [showFacultyModal]);

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isHoD ? 'Head of Department Dashboard' : 'Faculty Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <NotificationBell />
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
              <div>
                <span className="text-gray-700 block">{user.name}</span>
                <span className="text-gray-500 text-sm">{user.role === 'hod' ? 'Head of Department' : 'Faculty'}</span>
              </div>
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
          {/* Faculty Information Card */}
          {!isHoD && (
            <div className="bg-gradient-to-br from-white to-purple-50 shadow-lg rounded-2xl p-8 mb-6 border border-purple-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Faculty Information
                </h2>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-purple-100">
                  <div className={`w-3 h-3 rounded-full bg-green-500 animate-pulse`} />
                  <span className="text-sm font-medium text-purple-700">Active Status</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile and Name */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100 flex items-center gap-4">
                  {user.picture && !showDefaultAvatar ? (
                    <img 
                      src={getProfileImageUrl(user.picture)} 
                      alt="Profile" 
                      className="h-16 w-16 rounded-xl object-cover ring-2 ring-purple-200"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center ring-2 ring-purple-200">
                      <span className="text-2xl font-bold text-white">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-purple-600 font-medium">Faculty Member</p>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Email Address</span>
                  </div>
                  <p className="text-gray-900 font-medium pl-11">{user.email}</p>
                </div>

                {/* Department */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Department</span>
                  </div>
                  {loadingDepartments ? (
                    <div className="pl-11 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                  ) : error ? (
                    <p className="text-red-500 text-sm pl-11">{error}</p>
                  ) : (
                    <p className="text-gray-900 font-medium pl-11">
                      {user?.department || 'Not assigned'}
                    </p>
                  )}
                </div>

                {/* Experience */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Experience</span>
                  </div>
                  <p className="text-gray-900 font-medium pl-11">{user?.experience ? `${user.experience} years` : 'Not specified'}</p>
                </div>

                {/* Designation */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Designation</span>
                  </div>
                  <p className="text-gray-900 font-medium pl-11">{user?.designation || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          )}

          {isHoD && (
            <div className="space-y-6 mb-6">
              {/* HOD Welcome Banner */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome, Head of Department</h2>
                    <p className="text-indigo-100">Manage your department and faculty members</p>
                  </div>
                  <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Management Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Faculty Management Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Faculty Management</h3>
                        <p className="text-sm text-gray-500">Manage roles and permissions</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                      Manage
                    </span>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        fetchAllUsers();
                        setShowRoleManagementModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                  Manage Faculty Roles
                </button>
                  </div>
                </div>

                {/* Department Overview Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Department Analytics</h3>
                        <p className="text-sm text-gray-500">View department statistics</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      View
                    </span>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        calculateDepartmentStats();
                        setShowDepartmentModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      View Department Overview
                </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Classes Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold">Your Classes</h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none sm:min-w-[300px]">
                  <input
                    type="text"
                    placeholder="Search classes..."
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              <button
                onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 flex items-center gap-2 whitespace-nowrap"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                Create New Class
              </button>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            
            {/* Create Class Form (Modal) */}
            {showCreateForm && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-md border border-white/20">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Create New Class</h3>
                    <button 
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateClass}>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class Name *
                        </label>
                        <input
                          type="text"
                          name="className"
                          value={createFormData.className}
                          onChange={handleCreateFormChange}
                          className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/20"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject *
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={createFormData.subject}
                          onChange={handleCreateFormChange}
                          className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/20"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year *
                          </label>
                          <select
                            name="year"
                            value={createFormData.year}
                            onChange={handleCreateFormChange}
                            className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/20"
                            required
                          >
                            <option value="">Select Year</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section *
                          </label>
                          <select
                            name="section"
                            value={createFormData.section}
                            onChange={handleCreateFormChange}
                            className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/20"
                            required
                          >
                            <option value="">Select Section</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={createFormData.description}
                          onChange={handleCreateFormChange}
                          className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/20"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-2.5 rounded-xl font-medium border border-gray-200 text-gray-700 hover:bg-gray-50/50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-300 hover:shadow-green-500/25 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        {loading ? 'Creating...' : 'Create Class'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {loading && !showCreateForm ? (
              <div className="flex justify-center py-10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No classes found matching your search</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">You haven't created any classes yet</p>
                <p className="text-gray-400 text-sm mt-1">Click the 'Create New Class' button to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Management Modal */}
      {showRoleManagementModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Manage Faculty Roles</h3>
              <button 
                onClick={() => setShowRoleManagementModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="flex justify-center py-6">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <form onSubmit={handleRoleChange} className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select User
                      </label>
                      <select
                        name="userId"
                        value={userRoleData.userId}
                        onChange={handleUserRoleFormChange}
                        className="w-full bg-white/50 backdrop-blur-sm border border-purple-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20"
                        required
                      >
                        <option value="">Select a user</option>
                        {allUsers.map(user => (
                          <option key={user.id || user._id} value={user.id || user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        name="role"
                        value={userRoleData.role}
                        onChange={handleUserRoleFormChange}
                        className="w-full bg-white/50 backdrop-blur-sm border border-purple-100 rounded-xl shadow-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/20"
                        required
                      >
                        <option value="">Select role</option>
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="hod">Head of Department</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-300 hover:shadow-purple-500/25"
                    >
                      {loading ? 'Updating...' : 'Update Role'}
                    </button>
                  </div>
                </form>
                
                <div className="overflow-x-auto rounded-xl bg-white/50 backdrop-blur-sm border border-purple-100">
                  <table className="min-w-full divide-y divide-purple-100">
                    <thead className="bg-purple-50/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Current Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {allUsers.map(user => (
                        <tr key={user.id || user._id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.picture ? (
                                <img 
                                  src={getProfileImageUrl(user.picture)} 
                                  alt={user.name}
                                  className="h-8 w-8 rounded-full object-cover mr-3 ring-2 ring-purple-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    e.target.parentElement.innerHTML = `<div class="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mr-3">
                                      ${user.name.charAt(0).toUpperCase()}
                                    </div>`;
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white mr-3">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'hod' 
                                ? 'bg-purple-100/70 text-purple-800' 
                                : user.role === 'faculty'
                                  ? 'bg-green-100/70 text-green-800'
                                  : 'bg-blue-100/70 text-blue-800'
                            }`}>
                              {user.role === 'hod' 
                                ? 'Head of Department' 
                                : user.role === 'faculty' 
                                  ? 'Faculty' 
                                  : 'Student'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Department Overview Modal */}
      {showDepartmentModal && departmentStats && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Department Overview</h3>
              <button 
                onClick={() => setShowDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-6 border border-indigo-100/20">
                <p className="text-sm text-indigo-700 font-medium mb-1">Total Classes</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{departmentStats.totalClasses}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
                <p className="text-sm text-blue-700 font-medium mb-1">Total Students</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{departmentStats.totalStudents}</p>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-4">Classes by Year</h4>
            <div className="space-y-4 mb-8 bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
              {Object.entries(departmentStats.classesByYear).map(([year, count]) => (
                <div key={year} className="flex items-center">
                  <div className="w-1/3">
                    <span className="text-sm font-medium text-gray-700">Year {year}</span>
                  </div>
                  <div className="w-2/3 flex items-center gap-3">
                    <div className="h-2.5 bg-blue-100/50 rounded-full flex-grow">
                      <div 
                        className="h-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full transition-all duration-500" 
                        style={{ width: `${(count / departmentStats.totalClasses) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-100/20">
              <p className="text-sm text-emerald-700 font-medium mb-1">Average Students per Class</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {departmentStats.studentsPerClass.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add the Faculty List Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-xl w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Faculty Members
              </h2>
              <button
                onClick={() => setShowFacultyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingFaculty ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : facultyList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {facultyList.map((faculty) => (
                    <div
                      key={faculty._id}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          {faculty.picture ? (
                            <img
                              src={faculty.picture}
                              alt={faculty.name}
                              className="w-16 h-16 rounded-xl object-cover ring-4 ring-purple-100"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center ring-4 ring-purple-100">
                              <span className="text-2xl font-bold text-white">
                                {faculty.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {faculty.name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <FiMail className="w-4 h-4 mr-2 text-purple-500" />
                              {faculty.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiBookOpen className="w-4 h-4 mr-2 text-blue-500" />
                              {faculty.department || 'Department not set'}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiCalendar className="w-4 h-4 mr-2 text-green-500" />
                              {`Joined ${new Date(faculty.joinedDate).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-purple-50 rounded-lg p-2">
                            <p className="text-sm text-purple-600 font-medium">Classes</p>
                            <p className="text-lg font-semibold text-gray-900">{faculty.totalClasses || 0}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-sm text-blue-600 font-medium">Students</p>
                            <p className="text-lg font-semibold text-gray-900">{faculty.totalStudents || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUsers className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-500 font-medium">No faculty members found</h3>
                  <p className="text-gray-400 text-sm mt-1">Try refreshing the page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard; 