import React from 'react';
import { Link } from 'react-router-dom';

// Subject color mapping
const subjectColors = {
  'Mathematics': 'bg-blue-600',
  'Science': 'bg-green-600',
  'English': 'bg-red-600',
  'Computer Science': 'bg-purple-600',
  'History': 'bg-yellow-600',
  'Geography': 'bg-indigo-600',
  'Physics': 'bg-cyan-600',
  'Chemistry': 'bg-amber-600',
  'Biology': 'bg-lime-600',
  // Default color for other subjects
  'default': 'bg-gray-700'
};

const ClassCard = ({ classData }) => {
  // Get background color based on subject
  const getBgColor = (subject) => {
    // If subject exists in mapping, use that color, otherwise use default
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

  return (
    <Link 
      to={`/class/${classData.id}`} 
      className="block transition-transform hover:scale-[1.02] duration-300"
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full border border-gray-200 hover:shadow-md transition-shadow">
        <div className={`${getBgColor(classData.subject)} h-24 flex items-center justify-center`}>
          <span className="text-3xl font-bold text-white">
            {getInitials(classData.className)}
          </span>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{classData.className}</h3>
          <p className="text-sm text-gray-600">{classData.subject}</p>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              <span className="block">Year {classData.year}</span>
              <span className="block">Section {classData.section}</span>
            </div>
            <span className="text-xs text-gray-500">
              {classData.createdAt && formatDate(classData.createdAt)}
            </span>
          </div>
          {classData.classCode && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                Code: {classData.classCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ClassCard; 