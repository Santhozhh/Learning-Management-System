import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const StudentDashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [studentData, setStudentData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const storedData = localStorage.getItem('studentData');
      if (!storedData) {
        navigate('/');
        return;
      }

      const parsedData = JSON.parse(storedData);
      const studentId = parsedData._id || parsedData.id; // Handle both formats

      if (!studentId) {
        setError('No student ID found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/students/${studentId}`);
      const data = await response.json();

      if (response.ok) {
        setStudentData(data.student);
        setEditedData(data.student);
        // Update localStorage with consistent format
        localStorage.setItem('studentData', JSON.stringify({
          ...data.student,
          id: data.student._id
        }));
      } else {
        setError(data.message || 'Failed to fetch student data');
        console.error('Fetch error:', data);
      }
    } catch (err) {
      setError('Failed to fetch student data');
      console.error('Error fetching student data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        const response = await fetch(`http://localhost:5000/api/students/${studentData._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editedData),
        });

        const data = await response.json();

        if (response.ok) {
          setStudentData(editedData);
          localStorage.setItem('studentData', JSON.stringify({
            ...editedData,
            id: studentData._id
          }));
          setError(null);
          setIsEditing(false);
        } else {
          setError(data.message || 'Failed to update profile');
          console.error('Update error:', data);
        }
      } catch (err) {
        setError('Failed to update student data');
        console.error('Error updating student data:', err);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button 
            onClick={fetchStudentData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch(activeSection) {
      case 'profile':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm mb-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl text-white">
                    {studentData?.name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData?.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-2xl font-bold w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-1"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{studentData?.name || 'Loading...'}</h1>
                  )}
                  <p className="text-slate-500">Student</p>
                </div>
              </div>
              <button
                onClick={handleEditToggle}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isEditing 
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } transition-colors`}
              >
                {isEditing ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            {/* Student Information */}
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-600">#</span>
                Student Information
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm text-slate-600">Roll Number</label>
                      <input
                        type="text"
                        value={editedData?.rollNo || ''}
                        onChange={(e) => handleInputChange('rollNo', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Mobile Number</label>
                      <input
                        type="tel"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        value={editedData?.mobileNo || ''}
                        onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter 10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Section</label>
                      <input
                        type="text"
                        value={editedData?.section || ''}
                        onChange={(e) => handleInputChange('section', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Batch</label>
                      <input
                        type="text"
                        value={editedData?.batch || ''}
                        onChange={(e) => handleInputChange('batch', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Year</label>
                      <select
                        value={editedData?.year || ''}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Year</option>
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Fourth Year">Fourth Year</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-slate-600">Roll Number</div>
                      <div className="font-medium">{studentData?.rollNo || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Mobile Number</div>
                      <div className="font-medium">{studentData?.mobileNo || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Section</div>
                      <div className="font-medium">{studentData?.section || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Batch</div>
                      <div className="font-medium">{studentData?.batch || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Year</div>
                      <div className="font-medium">{studentData?.year || 'N/A'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Class Information */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-green-600">#</span>
                Class Information
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm text-slate-600">Department</label>
                      <input
                        type="text"
                        value={editedData?.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Year</label>
                      <select
                        value={editedData?.year || ''}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Year</option>
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Fourth Year">Fourth Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Class Incharge</label>
                      <input
                        type="text"
                        value={editedData?.classIncharge || ''}
                        onChange={(e) => handleInputChange('classIncharge', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Mentor</label>
                      <input
                        type="text"
                        value={editedData?.mentor || ''}
                        onChange={(e) => handleInputChange('mentor', e.target.value)}
                        className="w-full p-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-slate-600">Department</div>
                      <div className="font-medium">{studentData?.department || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Year</div>
                      <div className="font-medium">{studentData?.year || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Class Incharge</div>
                      <div className="font-medium">{studentData?.classIncharge || 'Mr.Kr.Senthil murugan'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Mentor</div>
                      <div className="font-medium">{studentData?.mentor || 'Mr.Kr.Senthil murugan'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Current Semester Courses */}
            <div className="mt-6 bg-slate-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-orange-600">#</span>
                Current Semester Courses
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {studentData?.courses?.map((course, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-slate-500">{course.code} • {course.professor}</div>
                  </div>
                )) || (
                  <>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="font-medium">Database Management Systems</div>
                      <div className="text-sm text-slate-500">CSE2004 • Prof. Sarah Johnson</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="font-medium">Web Development</div>
                      <div className="text-sm text-slate-500">CSE2005 • Prof. Michael Chen</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="font-medium">Data Structures and Algorithms</div>
                      <div className="text-sm text-slate-500">CSE2006 • Prof. David Miller</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 'classworks':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h1 className="text-2xl font-bold mb-8">My Classes</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentData?.classes?.length > 0 ? (
                  studentData.classes.map((classItem) => (
                    <div 
                      key={classItem._id}
                      className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{classItem.className}</h3>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-4">{classItem.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {classItem.students?.length || 0} Students
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created {new Date(classItem.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <p className="text-slate-600">No classes enrolled yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {studentData?.notifications?.length > 0 && (
                <button
                  onClick={() => handleClearNotifications()}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {studentData?.notifications?.length > 0 ? (
                studentData.notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="bg-blue-100 rounded-lg p-2 mt-1">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600">{notification.message}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(notification.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveNotification(index)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-slate-600">No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const handleRemoveNotification = async (index) => {
    try {
      const updatedNotifications = [...studentData.notifications];
      updatedNotifications.splice(index, 1);
      
      const response = await fetch(`http://localhost:5000/api/students/${studentData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications: updatedNotifications
        }),
      });

      if (response.ok) {
        setStudentData(prev => ({
          ...prev,
          notifications: updatedNotifications
        }));
      } else {
        setError('Failed to remove notification');
      }
    } catch (err) {
      console.error('Error removing notification:', err);
      setError('Failed to remove notification');
    }
  };

  const handleClearNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/students/${studentData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications: []
        }),
      });

      if (response.ok) {
        setStudentData(prev => ({
          ...prev,
          notifications: []
        }));
      } else {
        setError('Failed to clear notifications');
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError('Failed to clear notifications');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Fixed */}
      <div className="w-64 bg-white border-r border-slate-200 p-4 fixed h-screen">
        <div className="flex justify-center mb-8">
          <img 
            src="/src/untitled.jpg" 
            alt="VCET" 
            className="w-full h-20 object-contain"
          />
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex w-full items-center gap-3 px-4 py-2 ${
              activeSection === 'profile' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-50'
            } rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          
          <button 
            onClick={() => setActiveSection('classworks')}
            className={`flex w-full items-center gap-3 px-4 py-2 ${
              activeSection === 'classworks' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-50'
            } rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Classworks
          </button>

          <Link to="#" className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Submissions
          </Link>

          <Link to="#" className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2z" />
            </svg>
            My Marks
          </Link>

          <button
            onClick={() => setActiveSection('notifications')}
            className={`flex w-full items-center gap-3 px-4 py-2 ${
              activeSection === 'notifications' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-50'
            } rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
            {studentData?.notifications?.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {studentData.notifications.length}
              </span>
            )}
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex-1">
              <div className="font-medium">{studentData?.name || 'SANTHOSH KUMAR K.S.D'}</div>
              <div className="text-sm text-slate-500">{studentData?.email || 'santhoshkumar.ksd@gmail.com'}</div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('studentData');
                navigate('/');
              }} 
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 ml-64">
        <div className="max-w-5xl mx-auto p-8 min-h-screen overflow-y-auto">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;