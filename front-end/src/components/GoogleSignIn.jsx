import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const GoogleSignIn = ({ onError }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSuccess = async (response) => {
    try {
      setLoading(true);
      console.log('Google login success:', response);
      
      // Get user info from Google using access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${response.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        console.error('Failed to get user info from Google:', await userInfoResponse.text());
        throw new Error('Failed to get user info from Google');
      }

      const userInfo = await userInfoResponse.json();
      console.log('Google user info:', userInfo);

      // Send to backend
      const userData = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: response.access_token,
        requestDriveAccess: true
      };

      console.log('Sending to backend:', userData);

      try {
        // Login/signup using our API
        const authResponse = await authAPI.googleLogin(userData);
        console.log('Backend auth response:', authResponse);
        
        if (!authResponse || !authResponse.token || !authResponse.user) {
          throw new Error('Invalid response from server. Please try again.');
        }
        
        // Store token and user data
        localStorage.setItem('token', authResponse.token);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
        
        // Redirect based on role
        if (authResponse.user.role === 'student') {
          // Check if this is a first-time login for student (no year/section set)
          if (!authResponse.user.year || !authResponse.user.section) {
            navigate('/setup-profile');
          } else {
            navigate('/student-dashboard');
          }
        } else {
          // Faculty or HoD
          navigate('/faculty-dashboard');
        }
      } catch (backendError) {
        console.error('Backend authentication error:', backendError);
        if (backendError.response) {
          console.error('Backend error details:', backendError.response.data);
        }
        throw new Error(backendError.response?.data?.message || 'Backend authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (onError) {
        onError(error.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onFailure = (error) => {
    console.error('Google login failed:', error);
    if (onError) {
      onError('Google sign-in failed. Please try again.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess,
    onError: onFailure,
    scope: 'email profile https://www.googleapis.com/auth/drive.file',
    flow: 'implicit'
  });

  return (
    <button
      onClick={googleLogin}
      disabled={loading}
      className="flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </div>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </>
      )}
    </button>
  );
};

export default GoogleSignIn; 