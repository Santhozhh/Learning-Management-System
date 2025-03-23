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
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm 
                  ${activeTab === 'overview' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm 
                  ${activeTab === 'materials' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Materials
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm 
                  ${activeTab === 'assignments' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm 
                  ${activeTab === 'students' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Students
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Class Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">About</h3>
                  <p className="text-gray-700">
                    {classData.description || 'No description provided.'}
                  </p>
                  
                  <h3 className="text-lg font-medium mt-6 mb-2">Details</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Subject</dt>
                      <dd className="font-medium">{classData.subject}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Section</dt>
                      <dd className="font-medium">Section {classData.section}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Year</dt>
                      <dd className="font-medium">{classData.year}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Created</dt>
                      <dd className="font-medium">
                        {new Date(classData.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Faculty</h3>
                  {classData.creator && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      {classData.creator.picture ? (
                        <img 
                          src={getProfileImageUrl(classData.creator.picture)} 
                          alt={classData.creator.name} 
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.parentElement.innerHTML = `<div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                              ${classData.creator.name.charAt(0).toUpperCase()}
                            </div>`;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                          {classData.creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{classData.creator.name}</p>
                        <p className="text-sm text-gray-500">{classData.creator.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Class Materials</h2>
                {user?.role !== 'student' && (
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
                    Upload Material
                  </button>
                )}
              </div>
              
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No materials have been added yet</p>
                {user?.role !== 'student' && (
                  <p className="text-gray-400 text-sm mt-1">
                    Click the 'Upload Material' button to add study materials
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'assignments' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Assignments</h2>
                {user?.role !== 'student' && (
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors">
                    Create Assignment
                  </button>
                )}
              </div>
              
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">No assignments have been created yet</p>
                {user?.role !== 'student' && (
                  <p className="text-gray-400 text-sm mt-1">
                    Click the 'Create Assignment' button to create a new assignment
                  </p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Enrolled Students</h2>
              
              {classData.students && classData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classData.students.map(student => (
                        <tr key={student._id || student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {student.picture ? (
                                <img 
                                  src={getProfileImageUrl(student.picture)} 
                                  alt={student.name}
                                  className="h-8 w-8 rounded-full object-cover mr-3"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    e.target.parentElement.innerHTML = `<div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-3">
                                      ${student.name.charAt(0).toUpperCase()}
                                    </div>`;
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-3">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.year || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.section || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500">No students enrolled yet</p>
                  <p className="text-gray-400 text-sm mt-1">
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