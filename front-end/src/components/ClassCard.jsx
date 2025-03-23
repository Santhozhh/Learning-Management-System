import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiCode, FiBookOpen } from 'react-icons/fi';

// Subject color mapping with gradients
const subjectColors = {
  'Mathematics': {
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    lightBg: 'bg-blue-50'
  },
  'Science': {
    gradient: 'from-green-500 to-green-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    lightBg: 'bg-green-50'
  },
  'English': {
    gradient: 'from-red-500 to-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    lightBg: 'bg-red-50'
  },
  'Computer Science': {
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    lightBg: 'bg-purple-50'
  },
  'History': {
    gradient: 'from-yellow-500 to-yellow-600',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    lightBg: 'bg-yellow-50'
  },
  'Geography': {
    gradient: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    lightBg: 'bg-indigo-50'
  },
  'Physics': {
    gradient: 'from-cyan-500 to-cyan-600',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    lightBg: 'bg-cyan-50'
  },
  'Chemistry': {
    gradient: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    lightBg: 'bg-amber-50'
  },
  'Biology': {
    gradient: 'from-lime-500 to-lime-600',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
    lightBg: 'bg-lime-50'
  },
  'default': {
    gradient: 'from-gray-600 to-gray-700',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    lightBg: 'bg-gray-50'
  }
};

const ClassCard = ({ classData }) => {
  // Get color theme based on subject
  const getColorTheme = (subject) => {
    return subject && subjectColors[subject] ? subjectColors[subject] : subjectColors.default;
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get initials from class name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (!classData) return null;

  const colorTheme = getColorTheme(classData.subject);

  return (
    <Link 
      to={`/class/${classData.id}`} 
      className="group block transform hover:scale-[1.02] hover:-rotate-1 transition-all duration-300"
    >
      <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden h-full border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300">
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${colorTheme.gradient} h-28 relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full" />
          
          {/* Class initials */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/90 tracking-wider group-hover:scale-110 transition-transform duration-300">
              {getInitials(classData.className)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Class name and subject */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 group-hover:text-gray-900 transition-colors">
              {classData.className}
            </h3>
            <p className={`text-sm ${colorTheme.iconColor} font-medium mt-1`}>
              {classData.subject}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`${colorTheme.lightBg} rounded-xl p-3`}>
              <div className="flex items-center gap-2">
                <div className={`${colorTheme.iconBg} p-2 rounded-lg`}>
                  <FiUsers className={`w-4 h-4 ${colorTheme.iconColor}`} />
                </div>
                <span className="text-sm text-gray-600">
                  Year {classData.year}
                </span>
              </div>
            </div>
            <div className={`${colorTheme.lightBg} rounded-xl p-3`}>
              <div className="flex items-center gap-2">
                <div className={`${colorTheme.iconBg} p-2 rounded-lg`}>
                  <FiBookOpen className={`w-4 h-4 ${colorTheme.iconColor}`} />
                </div>
                <span className="text-sm text-gray-600">
                  Sec {classData.section}
                </span>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {classData.createdAt && formatDate(classData.createdAt)}
              </span>
            </div>
            {classData.classCode && (
              <div className="flex items-center gap-2">
                <FiCode className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md">
                  {classData.classCode}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ClassCard; 