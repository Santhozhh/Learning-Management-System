// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './App.css';  // Assuming your styles are in App.css
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import RegisterForm from './RegisterForm';
import FacultyRegistrationForm from './FacultyRegistrationForm';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* HomePage Route */}
        <Route path="/" element={<HomePage />} />
        {/* Student Dashboard Route */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/faculty-register" element={<FacultyRegistrationForm />} />
      </Routes>
    </Router>
  );
};

// HomePage component
const HomePage = () => {
  const [isStudent, setIsStudent] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loginData, setLoginData] = useState({
    name: '',
    dateOfBirth: '',
    username: '', // for faculty login
    password: '' // for faculty login
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const togglePortal = () => {
    setIsStudent(!isStudent);
    setError('');
    setLoginData({
      name: '',
      dateOfBirth: '',
      username: '',
      password: ''
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!isStudent) {
      // Faculty login
      try {
        if (!loginData.username.trim()) {
          setError('Please enter your full name');
          return;
        }

        if (!loginData.password) {
          setError('Please enter your date of birth');
          return;
        }

        console.log('Attempting faculty login with:', {
          username: loginData.username.trim(),
          password: loginData.password
        });

        const response = await fetch('http://localhost:5000/api/faculty/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: loginData.username.trim(),
            password: loginData.password
          }),
        });

        const data = await response.json();
        console.log('Faculty login response:', data);

        if (response.ok) {
          // Store faculty data in localStorage
          localStorage.setItem('facultyData', JSON.stringify(data.faculty));
          navigate('/faculty-dashboard');
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Faculty login error:', error);
        setError('Network error. Please check your connection and try again.');
      }
    } else {
      // Student login
      try {
        if (!loginData.name.trim()) {
          setError('Please enter your full name');
          return;
        }

        if (!loginData.dateOfBirth) {
          setError('Please enter your date of birth');
          return;
        }

        const response = await fetch('http://localhost:5000/api/students/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: loginData.name.trim(),
            dateOfBirth: loginData.dateOfBirth
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('studentData', JSON.stringify(data.student));
          navigate('/student-dashboard');
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('Network error. Please check your connection and try again.');
      }
    }
  };

  const themeColor = isStudent ? 'blue' : 'green';
  const portalType = isStudent ? 'Student' : 'Faculty';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Navigation */}
      <nav className={`${
        isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
      } backdrop-blur-sm border-b border-slate-200 fixed w-full z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
      <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
            >
              LMS
      </motion.div>
            <div className="flex items-center space-x-4">
              <Link to="/" className={`${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} px-3 py-2 rounded-md`}>Home</Link>
              <Link to="/student-dashboard" className={`${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'} px-3 py-2 rounded-md`}>Dashboard</Link>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200/20 transition-colors duration-300"
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                    />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}>
              Welcome to <span className={`text-${themeColor}-${isDarkMode ? '400' : '600'}`}>Learning Management System</span>
            </h1>
            <p className={`text-xl mb-8 max-w-3xl mx-auto ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Your gateway to seamless learning and education management. Access your courses, track progress, and connect with instructors all in one place.
            </p>

            {/* Portal Toggle Button */}
            <div className="flex items-center justify-center mb-12">
              <div className={`relative w-72 h-14 ${isStudent ? 'bg-blue-600' : 'bg-green-600'} rounded-full cursor-pointer shadow-lg`} onClick={togglePortal}>
                <div
                  className={`absolute top-1 h-12 w-36 bg-white rounded-full transition-all duration-300 ease-in-out shadow-md ${
                    isStudent ? 'left-1' : 'left-[calc(100%-9.25rem)]'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  <span className={`w-36 text-center font-medium transition-colors duration-300 z-10 ${
                    isStudent ? 'text-blue-600' : 'text-white'
                  }`}>
                    Student
                  </span>
                  <span className={`w-36 text-center font-medium transition-colors duration-300 z-10 ${
                    !isStudent ? 'text-green-600' : 'text-white'
                  }`}>
                    Faculty
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Login Form */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${
              isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'
            } backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <h2 className={`text-3xl font-semibold mb-8 text-center text-${themeColor}-${isDarkMode ? '400' : '600'}`}>
              {portalType} Portal
            </h2>
            <form className="space-y-6" onSubmit={handleLogin}>
              {isStudent ? (
                // Student login fields
                <>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>Full Name</label>
                    <input
                      type="text"
                      value={loginData.name}
                      onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500'
                          : 'bg-slate-50/50 border-slate-200 focus:ring-blue-400'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>Date of Birth</label>
                    <input
                      type="date"
                      value={loginData.dateOfBirth}
                      onChange={(e) => setLoginData({ ...loginData, dateOfBirth: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500'
                          : 'bg-slate-50/50 border-slate-200 focus:ring-blue-400'
                      }`}
                      required
                    />
                  </div>
                </>
              ) : (
                // Faculty login fields
                <>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>Full Name</label>
                    <input
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500'
                          : 'bg-slate-50/50 border-slate-200 focus:ring-blue-400'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>Date of Birth</label>
                    <input
                      type="date"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500'
                          : 'bg-slate-50/50 border-slate-200 focus:ring-blue-400'
                      }`}
                      required
                    />
                  </div>
                </>
              )}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button 
                type="submit"
                className={`w-full bg-${themeColor}-${isDarkMode ? '500' : '600'} text-white py-3 rounded-xl hover:bg-${themeColor}-${isDarkMode ? '600' : '700'} transform hover:scale-[1.02] transition-all duration-200 shadow-lg font-medium`}
              >
                Login as {portalType}
              </button>
              <div className="text-center mt-4">
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Don't have an account?{' '}
                  <Link 
                    to={!isStudent ? "/faculty-register" : "/register"} 
                    className={`text-${themeColor}-${isDarkMode ? '400' : '600'} hover:text-${themeColor}-${isDarkMode ? '300' : '500'} font-medium`}
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-8"
          >
            <div className={`${
              isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'
            } backdrop-blur-sm p-6 rounded-xl shadow-lg`}>
              <h3 className={`text-xl font-semibold mb-4 text-${themeColor}-${isDarkMode ? '400' : '600'}`}>
                Key Features
              </h3>
              <ul className="space-y-4">
                {isStudent ? (
                  <>
                    <li className="flex items-center space-x-3">
                      <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Access Course Materials
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Track Your Progress
                      </span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center space-x-3">
                      <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Manage Course Content
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Grade Assignments
                      </span>
                    </li>
                  </>
                )}
                <li className="flex items-center space-x-3">
                  <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Direct Communication
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className={`w-6 h-6 text-${themeColor}-${isDarkMode ? '400' : '600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    24/7 Access
                  </span>
                </li>
              </ul>
            </div>

            <div className={`${
              isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'
            } backdrop-blur-sm p-6 rounded-xl shadow-lg`}>
              <h3 className={`text-xl font-semibold mb-4 text-${themeColor}-${isDarkMode ? '400' : '600'}`}>
                Why Choose Us?
              </h3>
              <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Our Learning Management System provides a seamless and intuitive platform for {isStudent ? 'students' : 'faculty'} to {isStudent ? 'access educational resources and track progress' : 'manage courses and monitor student performance'}. With our user-friendly interface and comprehensive features, {isStudent ? 'learning' : 'teaching'} has never been easier.
              </p>
            </div>
        </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`${
        isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
      } backdrop-blur-sm border-t border-slate-700/20 mt-12 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              © 2024 Learning Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;