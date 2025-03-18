import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateClassForm = ({ onClose, onClassCreated, facultyId }) => {
  const [formData, setFormData] = useState({
    className: '',
    description: '',
    students: []
  });
  const [showStudentList, setShowStudentList] = useState(false);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    section: '',
    year: ''
  });
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    // Fetch students when component mounts
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const classData = {
        className: formData.className,
        description: formData.description,
        students: selectedStudents.map(student => student._id),
        facultyId
      };

      console.log('Sending class data:', classData);

      const response = await fetch('http://localhost:5000/api/faculty/classes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        alert('Class created successfully!');
        onClassCreated(data);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.message || 'Failed to create class. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.find(s => s._id === student._id);
      if (isSelected) {
        return prev.filter(s => s._id !== student._id);
      } else {
        return [...prev, student];
      }
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSection = !filters.section || student.section === filters.section;
    const matchesYear = !filters.year || student.year === filters.year;
    return matchesSection && matchesYear;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create New Class</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter class name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter class description"
              required
            />
          </div>

          {/* Selected Students Count */}
          {selectedStudents.length > 0 && (
            <div className="text-sm text-slate-600">
              {selectedStudents.length} student(s) selected
            </div>
          )}

          {/* Add Students Button */}
          <div>
            <button
              type="button"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              onClick={() => setShowStudentList(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Students
            </button>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Class
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Student List Modal */}
        <AnimatePresence>
          {showStudentList && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-slate-500/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Select Students</h3>
                  <button
                    onClick={() => setShowStudentList(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Section
                    </label>
                    <select
                      name="section"
                      value={filters.section}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Year
                    </label>
                    <select
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Years</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                  </div>
                </div>

                {/* Student List */}
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Select</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Name</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Roll No</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Section</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStudents.map(student => (
                        <tr key={student._id} className="hover:bg-slate-50">
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedStudents.some(s => s._id === student._id)}
                              onChange={() => toggleStudentSelection(student)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2">{student.rollNo}</td>
                          <td className="px-4 py-2">{student.section}</td>
                          <td className="px-4 py-2">{student.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowStudentList(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CreateClassForm; 