import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classAPI } from '../utils/api';

// Helper function to process Google profile URLs
const getProfileImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('googleusercontent.com')) {
    // Convert Google URLs to use our proxy
    return `/googleusercontent${url.split('googleusercontent.com')[1]}`;
  }
  return url;
};

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/');
      return;
    }
    setUser(userData);
    
    fetchClassDetails();
  }, [classId, navigate]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getClassDetails(classId);
      console.log('Class details:', response);
      setClassData(response.class);
      setError(null);
    } catch (err) {
      console.error('Error fetching class details:', err);
      setError('Failed to load class details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else {
      navigate('/faculty-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 max-w-md">
          {error || 'Class not found'}
        </div>
        <button
          onClick={handleBack}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.className}</h1>
                <p className="text-sm text-gray-500">{classData.subject} - Year {classData.year}, Section {classData.section}</p>
              </div>
            </div>
            
            {user?.role !== 'student' && (
              <div className="shrink-0">
                <span className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                  Class Code: {classData.classCode}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <nav className="flex space-x-2 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-purple-100/20 mb-4 sm:mb-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'materials' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                Materials
                </div>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'assignments' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                Assignments
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'students' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                Students
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Faculty Information - Now more prominent */}
                <div className="lg:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
                  <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Faculty Information
                  </h2>
                  {classData.creator ? (
                    <div className="flex items-center gap-8">
                      <div className="relative">
                        {classData.creator.picture ? (
                          <img 
                            src={getProfileImageUrl(classData.creator.picture)} 
                            alt={classData.creator.name} 
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.parentElement.innerHTML = `
                                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                                  <span class="text-4xl font-bold">
                                    ${classData.creator.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                            <span className="text-4xl font-bold">
                              {classData.creator.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900">{classData.creator.name}</h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Faculty
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-gray-600">{classData.creator.email}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="text-gray-600">Computer Science</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Faculty information not available
                    </div>
                  )}
                </div>

                {/* About Section */}
                <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-2xl p-8 border border-purple-100/20">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">About</h3>
                  <p className="text-gray-700 mb-6">
                    {classData.description || 'No description provided.'}
                  </p>
                  
                  <h4 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Details</h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Subject</dt>
                      <dd className="font-medium text-gray-900">{classData.subject}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Section</dt>
                      <dd className="font-medium text-gray-900">Section {classData.section}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Year</dt>
                      <dd className="font-medium text-gray-900">{classData.year}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Created</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(classData.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl p-8 border border-blue-100/20">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Class Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                <div>
                          <p className="text-sm text-purple-600 font-medium">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {classData.students?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      <div>
                          <p className="text-sm text-blue-600 font-medium">Active Today</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {classData.students?.filter(s => s.lastActive > Date.now() - 86400000).length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Class Materials
                </h2>
                {user?.role !== 'student' && (
                  <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Material
                  </button>
                )}
              </div>
              
              <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-2">No materials have been added yet</p>
                {user?.role !== 'student' && (
                  <p className="text-gray-500 text-sm">
                    Click the 'Upload Material' button to add study materials
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'assignments' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Assignments
                </h2>
                {user?.role !== 'student' && (
                  <button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assignment
                  </button>
                )}
              </div>
              
              <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium mb-2">No assignments have been created yet</p>
                {user?.role !== 'student' && (
                  <p className="text-gray-500 text-sm">
                    Click the 'Create Assignment' button to create a new assignment
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-8">
                Enrolled Students
              </h2>
              
              {classData.students && classData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-purple-100/20 md:rounded-2xl">
                      <table className="min-w-full divide-y divide-purple-100/20">
                        <thead className="bg-purple-50/50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Student
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Email
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Year
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Section
                        </th>
                      </tr>
                    </thead>
                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-purple-100/20">
                      {classData.students.map(student => (
                            <tr key={student._id || student.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {student.picture ? (
                                <img 
                                  src={getProfileImageUrl(student.picture)} 
                                  alt={student.name}
                                      className="h-10 w-10 rounded-xl object-cover ring-2 ring-purple-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                        e.target.parentElement.innerHTML = `<div class="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                      ${student.name.charAt(0).toUpperCase()}
                                    </div>`;
                                  }}
                                />
                              ) : (
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                                  <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                                    </div>
                              </div>
                            </div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.email}</div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.year || '-'}</div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.section || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">No students enrolled yet</p>
                  <p className="text-gray-500 text-sm">
                    Students can join using the class code: {classData.classCode}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClassDetails; 