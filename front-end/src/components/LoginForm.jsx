import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleSignIn from './GoogleSignIn';
import { FiLock, FiBookOpen, FiClipboard, FiTrendingUp } from 'react-icons/fi';

const LoginForm = () => {
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user) {
      if (user.role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/faculty-dashboard');
      }
    }
  }, [navigate]);

  const handleGoogleError = (message) => {
    setError(message);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Section */}
      <div className={`w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Welcome to{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">LMS</span>
              <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-purple-400 to-blue-400 transform -skew-x-12 opacity-50"></div>
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Your comprehensive Learning Management System for a better educational experience.
          </p>

          <div className="space-y-8">
            <div className="transform hover:scale-105 transition-transform duration-300 hover:bg-white hover:shadow-xl rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg">
                  <FiBookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">Interactive Learning</h3>
                  <p className="text-gray-600">Engage with dynamic content and real-time feedback</p>
                </div>
              </div>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-300 hover:bg-white hover:shadow-xl rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                  <FiClipboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">Assignment Management</h3>
                  <p className="text-gray-600">Streamlined submission and grading process</p>
                </div>
              </div>
            </div>

            <div className="transform hover:scale-105 transition-transform duration-300 hover:bg-white hover:shadow-xl rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">Progress Tracking</h3>
                  <p className="text-gray-600">Monitor your learning journey in real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className={`hidden lg:flex w-1/2 items-center justify-center relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
        <div className="w-full max-w-md p-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg mb-6 transform hover:rotate-6 transition-transform duration-300">
                <FiLock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">Get Started</h2>
              <p className="text-gray-600 text-lg">Sign in to access your learning journey</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <GoogleSignIn onError={handleGoogleError} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sign In Section */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl p-8 shadow-2xl rounded-t-3xl transition-all duration-500 transform ${mounted ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg mb-4 transform hover:rotate-6 transition-transform duration-300">
            <FiLock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">Get Started</h2>
          <p className="text-gray-600 text-lg">Sign in to access your learning journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <GoogleSignIn onError={handleGoogleError} />
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 