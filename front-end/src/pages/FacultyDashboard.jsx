import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classAPI, authAPI } from '../utils/api';
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

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [showDefaultAvatar, setShowDefaultAvatar] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/');
      return;
    }
    setUser(userData);
    
    // Fetch faculty's classes
    fetchClasses();
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

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isHoD ? 'Head of Department Dashboard' : 'Faculty Dashboard'}
          </h1>
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
          {/* User Information Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{user.department || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{user.role === 'hod' ? 'Head of Department' : 'Faculty'}</p>
              </div>
            </div>
          </div>

          {isHoD && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Management Controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-colors"
                  onClick={() => {
                    fetchAllUsers();
                    setShowRoleManagementModal(true);
                  }}
                >
                  Manage Faculty Roles
                </button>
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-colors"
                  onClick={() => {
                    calculateDepartmentStats();
                    setShowDepartmentModal(true);
                  }}
                >
                  Department Overview
                </button>
              </div>
            </div>
          )}
          
          {/* Classes Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Classes</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Create New Class
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}
            
            {/* Create Class Form (Modal) */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Create New Class</h3>
                    <button 
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateClass}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class Name *
                        </label>
                        <input
                          type="text"
                          name="className"
                          value={createFormData.className}
                          onChange={handleCreateFormChange}
                          className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                          className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                            className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                          className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
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
                <p className="text-gray-500">You haven't created any classes yet</p>
                <p className="text-gray-400 text-sm mt-1">Click the 'Create New Class' button to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Management Modal */}
      {showRoleManagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manage Faculty Roles</h3>
              <button 
                onClick={() => setShowRoleManagementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="flex justify-center py-6">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
                        className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                        className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      {loading ? 'Updating...' : 'Update Role'}
                    </button>
                  </div>
                </form>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map(user => (
                        <tr key={user.id || user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.picture ? (
                                <img 
                                  src={getProfileImageUrl(user.picture)} 
                                  alt={user.name}
                                  className="h-8 w-8 rounded-full object-cover mr-3"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    e.target.parentElement.innerHTML = `<div class="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-3">
                                      ${user.name.charAt(0).toUpperCase()}
                                    </div>`;
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-3">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'hod' 
                                ? 'bg-purple-100 text-purple-800' 
                                : user.role === 'faculty'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Department Overview</h3>
              <button 
                onClick={() => setShowDepartmentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-indigo-700">Total Classes</p>
                <p className="text-3xl font-bold text-indigo-900">{departmentStats.totalClasses}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-700">Total Students</p>
                <p className="text-3xl font-bold text-green-900">{departmentStats.totalStudents}</p>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-3">Classes by Year</h4>
            <div className="space-y-3 mb-6">
              {Object.entries(departmentStats.classesByYear).map(([year, count]) => (
                <div key={year} className="flex items-center">
                  <div className="w-1/3">
                    <span className="text-sm font-medium">Year {year}</span>
                  </div>
                  <div className="w-2/3 flex items-center gap-3">
                    <div className="h-2 bg-indigo-200 rounded-full flex-grow">
                      <div 
                        className="h-2 bg-indigo-600 rounded-full" 
                        style={{ width: `${(count / departmentStats.totalClasses) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Average Students per Class</p>
              <p className="text-2xl font-semibold text-gray-900">
                {departmentStats.studentsPerClass.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard; 