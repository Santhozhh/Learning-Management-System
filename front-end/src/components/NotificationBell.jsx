import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';

// Helper function to format time
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
  
  return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
};

// Helper function to process Google profile URLs
const getProfileImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('googleusercontent.com')) {
    // Convert Google URLs to use our proxy
    return `/googleusercontent${url.split('googleusercontent.com')[1]}`;
  }
  return url;
};

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [removingIds, setRemovingIds] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for notifications (every 60 seconds)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // Toggle dropdown
  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen && notifications.length === 0) {
      fetchNotifications();
    }
  };

  // Handle clearing all notifications with animation
  const handleClearAll = async () => {
    if (notifications.length === 0 || clearingAll) return;
    
    try {
      setClearingAll(true);
      
      // Mark all as read first (if there are any unread)
      if (unreadCount > 0) {
        await notificationAPI.markAllAsRead();
      }
      
      // Create a copy of all notification IDs
      const allIds = notifications.map(n => n._id);
      setRemovingIds(allIds);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear notifications from API
      await notificationAPI.clearAllNotifications();
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      setRemovingIds([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setClearingAll(false);
    }
  };

  // Mark a specific notification as read and handle navigation
  const handleNotificationClick = async (notification) => {
    try {
      // Only mark as read if it's not already read
      if (!notification.read) {
        await notificationAPI.markAsRead(notification._id);
        
        // Update local state
        setNotifications(
          notifications.map(n => 
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      
      // All notifications navigate to the class details page with the appropriate tab
      if (notification.relatedClass) {
        let tabParam = 'overview';
        
        // Determine which tab to show based on notification type
        if (notification.type === 'assignment_created' || notification.type === 'assignment_submitted') {
          tabParam = 'assignments';
        } else if (notification.type === 'material_uploaded') {
          tabParam = 'materials';
        }
        
        navigate(`/class/${notification.relatedClass}?tab=${tabParam}`);
      }
      
      // Close dropdown
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-3 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white rounded-full hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Use ReactDOM.createPortal to render notifications at the root level */}
      {isOpen && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            pointerEvents: 'none'
          }}
        >
          <div 
            className="fixed w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              top: '80px', // Position below header
              right: '16px',
              zIndex: 999999,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-purple-600 p-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearingAll}
                  className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors duration-200 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-all duration-300
                      ${notification.read ? 'bg-white' : 'bg-blue-50/30'}
                      ${removingIds.includes(notification._id) ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {notification.sender.picture ? (
                        <img 
                          src={getProfileImageUrl(notification.sender.picture)} 
                          alt={notification.sender.name} 
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 border border-gray-200 font-bold">
                          {notification.sender.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{notification.title}</div>
                        <p className="text-sm text-gray-700 line-clamp-2">{notification.message}</p>
                        <div className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</div>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2.5 h-2.5 bg-purple-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell; 