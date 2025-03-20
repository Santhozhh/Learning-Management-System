import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CreateClassForm from './CreateClassForm';

const FacultyDashboard = () => {
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [classes, setClasses] = useState([]);
  const [activeSection, setActiveSection] = useState('classes');
  const [facultyId, setFacultyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const faculty = JSON.parse(localStorage.getItem('faculty'));
    if (faculty?._id) {
      setFacultyId(faculty._id);
      if (activeSection === 'my-classes') {
        fetchClasses(faculty._id);
      }
    }
  }, [activeSection]);

  const fetchClasses = async (id) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/faculty/classes/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched classes:', data);
        setClasses(data.classes || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch classes:', errorData);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassCreated = (newClass) => {
    setClasses(prevClasses => [...prevClasses, newClass]);
    setShowCreateClass(false);
    const faculty = JSON.parse(localStorage.getItem('faculty'));
    if (faculty?._id) {
      fetchClasses(faculty._id);
    }
  };

  const handleClassClick = (classId) => {
    // Navigate to class details page or show class details modal
    console.log('Class clicked:', classId);
    // You can add navigation here using React Router
    // navigate(`/class/${classId}`);
  };

  const handleLogout = () => {
    try {
      localStorage.clear(); // Clear all localStorage items
      // or if you want to be specific:
      // localStorage.removeItem('faculty');
      // localStorage.removeItem('token');
      navigate('/', { replace: true }); // Use replace to prevent going back
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

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
                  <span className="text-3xl text-white">KS</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Mr.Kr.Senthil murugan</h1>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Faculty Information */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-purple-600">#</span>
                Faculty Information
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-slate-600">Employee ID</div>
                  <div className="font-medium">FAC2024001</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Department</div>
                  <div className="font-medium">Computer Science</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Designation</div>
                  <div className="font-medium">Associate Professor</div>
                </div>
              </div>
            </div>

            {/* Class Information */}
            <div className="mt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="text-sm text-slate-600">Class Advisor</div>
                  <div className="font-medium">CSE - Section C</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-600">Mentees</div>
                  <div className="font-medium">20 Students</div>
                </div>
              </div>
            </div>

            {/* Professional Links */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Professional Links</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Missing Links
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <button className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </div>
                </button>
                <button className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Research Gate
                  </div>
                </button>
                <button className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 16.057v-3.057h2.994c-.059 1.143-.212 2.24-.456 3.279-.823-.12-1.674-.188-2.538-.222zm1.957 2.162c-.499 1.33-1.159 2.497-1.957 3.456v-3.62c.666.028 1.319.081 1.957.164zm-1.957-7.219v-3.015c.868-.034 1.721-.103 2.548-.224.238 1.027.389 2.111.446 3.239h-2.994zm0-5.014v-3.661c.806.969 1.471 2.15 1.971 3.496-.642.084-1.3.137-1.971.165zm2.703-3.267c1.237.496 2.354 1.228 3.29 2.146-.642.234-1.311.442-2.019.607-.344-.992-.775-1.91-1.271-2.753zm-7.241 13.56c-.244-1.039-.398-2.136-.456-3.279h2.994v3.057c-.865.034-1.714.102-2.538.222zm2.538 1.776v3.62c-.798-.959-1.458-2.126-1.957-3.456.638-.083 1.291-.136 1.957-.164zm-2.994-7.055c.057-1.128.207-2.212.446-3.239.827.121 1.68.19 2.548.224v3.015h-2.994zm1.024-5.179c.5-1.346 1.165-2.527 1.97-3.496v3.661c-.671-.028-1.329-.081-1.97-.165zm-2.005-.35c-.708-.165-1.377-.373-2.018-.607.937-.918 2.053-1.65 3.29-2.146-.496.844-.927 1.762-1.272 2.753zm-.549 1.918c-.264 1.151-.434 2.36-.492 3.611h-3.933c.165-1.658.739-3.197 1.617-4.518.88.361 1.816.67 2.808.907zm.009 9.262c-.988.236-1.92.542-2.797.9-.89-1.328-1.471-2.879-1.637-4.551h3.934c.058 1.265.231 2.488.5 3.651zm.553 1.917c.342.976.768 1.881 1.257 2.712-1.223-.49-2.326-1.211-3.256-2.115.636-.229 1.299-.435 1.999-.597zm9.924 0c.7.163 1.362.367 1.999.597-.931.903-2.034 1.625-3.257 2.116.489-.832.915-1.737 1.258-2.713zm.553-1.917c.27-1.163.442-2.386.501-3.651h3.934c-.167 1.672-.748 3.223-1.638 4.551-.877-.358-1.81-.664-2.797-.9zm.501-5.651c-.058-1.251-.229-2.46-.492-3.611.992-.237 1.929-.546 2.809-.907.877 1.321 1.451 2.86 1.616 4.518h-3.933z"/>
                    </svg>
                    Portfolio
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'classes':
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Create New Class</h1>
              <button 
                onClick={() => setShowCreateClass(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Class
              </button>
            </div>
          </div>
        );
      case 'my-classes':
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">My Classes</h1>
              <button 
                onClick={() => setShowCreateClass(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Class
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No classes created yet</h2>
                <p className="text-gray-500 mb-8">Create your first class to get started</p>
                <button 
                  onClick={() => {
                    setActiveSection('classes');
                    setShowCreateClass(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
                  <div 
                    key={classItem._id}
                    className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md cursor-pointer"
                    onClick={() => handleClassClick(classItem._id)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{classItem.className}</h3>
                        <p className="text-sm text-slate-500">{classItem.subject}</p>
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
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-8">
          <img src="/src/Untitled.jpg" alt="VCET Logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold">LMS FACULTY</h1>
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
          
          {/* Classes Section Header */}
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes</h3>
          </div>
          
          <button
            onClick={() => setActiveSection('classes')}
            className={`flex w-full items-center gap-3 px-4 py-2 ${
              activeSection === 'classes' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-50'
            } rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Class
          </button>

          <button
            onClick={() => setActiveSection('my-classes')}
            className={`flex w-full items-center gap-3 px-4 py-2 ${
              activeSection === 'my-classes' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-slate-700 hover:bg-slate-50'
            } rounded-lg`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            My Classes
          </button>
        </nav>

        <div className="fixed bottom-4 left-4 w-56">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-lg text-white">KS</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Mr.Kr.Senthil murugan</div>
                <div className="text-xs text-slate-500">senthil.murugan@vcet.edu</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="max-w-5xl mx-auto p-8 min-h-screen overflow-y-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateClass && (
          <CreateClassForm
            onClose={() => setShowCreateClass(false)}
            onClassCreated={handleClassCreated}
            facultyId={facultyId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;
