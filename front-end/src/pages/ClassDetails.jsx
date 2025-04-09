import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classAPI, materialAPI, assignmentAPI } from '../utils/api';
import CloudinaryUpload from '../components/Cloudinary';
import FilePreview from '../components/FilePreview';

// Helper function to process Google profile URLs
const getProfileImageUrl = (url) => {
  if (!url) return null;
  if (url.includes('googleusercontent.com')) {
    // Convert Google URLs to use our proxy
    return `/googleusercontent${url.split('googleusercontent.com')[1]}`;
  }
  return url;
};

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    fileUrl: '',
    fileName: '',
    totalPoints: 100
  });
  const [creatingAssignment, setCreatingAssignment] = useState(false);
  const [showSubmitAssignmentModal, setShowSubmitAssignmentModal] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [currentSubmissionId, setCurrentSubmissionId] = useState(null);
  const [gradeData, setGradeData] = useState({ marks: '', feedback: '' });
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData || !userData.id) {
      navigate('/');
      return;
    }
    setUser(userData);
    
    // Check URL params for active tab
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'materials', 'assignments', 'students'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    fetchClassDetails();
  }, [classId, navigate]);

  // Refresh assignments when switching to the assignments tab
  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeTab]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getClassDetails(classId);
      console.log('Class details:', response);
      setClassData(response.class);
      setError(null);
      
      // After fetching class details, fetch the materials and assignments for this class
      fetchClassMaterials();
      fetchAssignments();
    } catch (err) {
      console.error('Error fetching class details:', err);
      setError('Failed to load class details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassMaterials = async () => {
    try {
      const response = await materialAPI.getClassMaterials(classId);
      console.log('Class materials:', response);
      if (response && response.materials) {
        setMaterials(response.materials);
      }
    } catch (err) {
      console.error('Error fetching class materials:', err);
      // Don't set an error here to avoid blocking the UI if materials fail to load
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await assignmentAPI.getClassAssignments(classId);
      console.log('Class assignments:', response);
      if (response && response.assignments) {
        setAssignments(response.assignments);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      // Don't set an error here to avoid blocking the UI if assignments fail to load
    }
  };

  const handleBack = () => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else {
      navigate('/faculty-dashboard');
    }
  };

  const handleMaterialUpload = async (fileData) => {
    try {
      setUploading(true);
      setUploadError(null);
      
      // Create material data object for the API
      const materialData = {
        title: fileData.fileName,
        description: `Uploaded file: ${fileData.fileName}`,
        // Instead of passing a file object, we pass the cloudinary URL directly
        fileUrl: fileData.url,
        // Include additional file metadata from Cloudinary
        fileId: fileData.publicId,
        fileName: fileData.fileName,
        mimeType: fileData.fileType,
        size: fileData.fileSize
      };

      const response = await materialAPI.uploadMaterial(classId, materialData);
      setMaterials(prev => [response.material, ...prev]);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error uploading material:', err);
      setUploadError('Failed to upload material. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentFileUpload = (fileData) => {
    setAssignmentForm(prev => ({ ...prev, fileUrl: fileData.url, fileName: fileData.fileName }));
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      setCreatingAssignment(true);
      console.log('Creating assignment with data:', assignmentForm);
      
      // We need to use the assignmentAPI instead of classAPI
      if (!assignmentAPI || !assignmentAPI.createAssignment) {
        throw new Error('assignmentAPI.createAssignment function is not defined');
      }
      
      console.log('Using API endpoint for assignment creation');
      
      // Prepare the data in the format the backend expects
      const formattedData = {
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate,
        totalPoints: assignmentForm.totalPoints || 100,
        fileUrl: assignmentForm.fileUrl,
        fileName: assignmentForm.fileName
      };
      
      console.log('Formatted data:', formattedData);
      
      const response = await assignmentAPI.createAssignment(classId, formattedData);
      console.log('Assignment created successfully:', response);
      
      // Check if response contains the expected assignment data
      if (!response || !response.assignment) {
        throw new Error('Invalid response from server');
      }
      
      // Update assignments state with the new assignment
      setAssignments(prev => [response.assignment, ...prev]);
      
      // Reset form and close modal
      setAssignmentForm({
        title: '',
        description: '',
        dueDate: '',
        fileUrl: '',
        fileName: '',
        totalPoints: 100
      });
      setShowCreateAssignmentModal(false);
    } catch (err) {
      console.error('Error creating assignment:', err);
      // Show more specific error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create assignment. Please try again.';
      setError(errorMessage);
      alert(`Assignment creation failed: ${errorMessage}`);
    } finally {
      setCreatingAssignment(false);
    }
  };

  const handleSubmissionFileUpload = (fileData) => {
    // Format the file data in the structure expected by the backend
    const formattedFileData = {
      url: fileData.url,
      publicId: fileData.publicId,
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize
    };
    
    setSubmissionFile(formattedFileData);
    console.log('Submission file data:', formattedFileData);
  };

  const handleSubmitAssignment = (assignmentId) => {
    setCurrentAssignmentId(assignmentId);
    setSubmissionFile(null);
    setSubmissionError(null);
    setShowSubmitAssignmentModal(true);
  };

  const submitAssignment = async () => {
    try {
      setSubmitting(true);
      setSubmissionError(null);
      
      if (!submissionFile) {
        throw new Error('Please upload a file before submitting');
      }
      
      console.log('Submitting file:', submissionFile);
      
      // Format submission data for the API
      const submissionData = {
        notes: '', // You could add a notes field to the form if needed
        file: submissionFile
      };
      
      const response = await assignmentAPI.submitAssignment(currentAssignmentId, submissionData);
      console.log('Assignment submitted:', response);
      
      // Update assignments state with the new submission
      setAssignments(prev => 
        prev.map(assignment => {
          if (assignment.id === currentAssignmentId) {
            return {
              ...assignment,
              submissions: [
                ...(assignment.submissions || []),
                response.submission
              ]
            };
          }
          return assignment;
        })
      );
      
      // Close modal and show success message
      setShowSubmitAssignmentModal(false);
      alert('Assignment submitted successfully!');
      
      // Refresh assignments to get updated data
      fetchAssignments();
      
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setSubmissionError(err.response?.data?.message || err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnterMarks = (submissionId) => {
    setCurrentSubmissionId(submissionId);
    setGradeData({ marks: '', feedback: '' });
    setGradeError(null);
    setShowGradeModal(true);
  };

  const handleGradeChange = (e) => {
    const { name, value } = e.target;
    setGradeData(prev => ({ ...prev, [name]: value }));
  };

  const submitGrade = async () => {
    try {
      setGrading(true);
      setGradeError(null);
      
      if (!gradeData.marks) {
        throw new Error('Please enter marks for the submission');
      }
      
      // Convert marks to a number
      const marks = parseFloat(gradeData.marks);
      
      // Validate marks
      if (isNaN(marks) || marks < 0) {
        throw new Error('Please enter a valid marks value');
      }
      
      // Find the current assignment to get the total points
      const currentAssignment = assignments.find(assignment => 
        assignment.submissions?.some(sub => sub.id === currentSubmissionId)
      );
      
      if (!currentAssignment) {
        throw new Error('Assignment not found');
      }
      
      // Validate against total points
      if (marks > currentAssignment.totalPoints) {
        throw new Error(`Marks cannot exceed the total points (${currentAssignment.totalPoints})`);
      }
      
      // Log the data being sent
      console.log('Submitting grade with data:', {
        marks,
        feedback: gradeData.feedback || ''
      });
      
      // Submit the grade
      const response = await assignmentAPI.gradeSubmission(currentSubmissionId, {
        marks,
        feedback: gradeData.feedback || ''
      });
      
      console.log('Grade submitted successfully:', response);
      
      // Update the assignments state with the new grade
      setAssignments(prev => 
        prev.map(assignment => {
          if (assignment.submissions) {
            return {
              ...assignment,
              submissions: assignment.submissions.map(submission => {
                if (submission.id === currentSubmissionId) {
                  return {
                    ...submission,
                    marks: response.submission.marks,
                    feedback: response.submission.feedback
                  };
                }
                return submission;
              })
            };
          }
          return assignment;
        })
      );
      
      // Close the modal
      setShowGradeModal(false);
      
      // Show success message
      alert('Marks submitted successfully!');
      
    } catch (err) {
      console.error('Error submitting grade:', err);
      setGradeError(err.message || 'Failed to submit marks. Please try again.');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 max-w-md">
          {error || 'Class not found'}
        </div>
        <button
          onClick={handleBack}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{classData.className}</h1>
                <p className="text-sm text-gray-500">{classData.subject} - Year {classData.year}, Section {classData.section}</p>
              </div>
            </div>
            
            {user?.role !== 'student' && (
              <div className="shrink-0">
                <span className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                  Class Code: {classData.classCode}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
            <nav className="flex space-x-2 p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-purple-100/20 mb-4 sm:mb-0">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'materials' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                Materials
                </div>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'assignments' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                Assignments
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`
                  px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300
                  ${activeTab === 'students' 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                Students
                </div>
              </button>
            </nav>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Faculty Information - Now more prominent */}
                <div className="lg:col-span-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
                  <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Faculty Information
                  </h2>
                  {classData.creator ? (
                    <div className="flex items-center gap-8">
                      <div className="relative">
                        {classData.creator.picture ? (
                          <img 
                            src={getProfileImageUrl(classData.creator.picture)} 
                            alt={classData.creator.name} 
                            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.parentElement.innerHTML = `
                                <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                                  <span class="text-4xl font-bold">
                                    ${classData.creator.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              `;
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                            <span className="text-4xl font-bold">
                              {classData.creator.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-gray-900">{classData.creator.name}</h3>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Faculty
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-gray-600">{classData.creator.email}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="text-gray-600">Computer Science</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Faculty information not available
                    </div>
                  )}
                </div>

                {/* About Section */}
                <div className="bg-gradient-to-br from-purple-50/50 to-white rounded-2xl p-8 border border-purple-100/20">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">About</h3>
                  <p className="text-gray-700 mb-6">
                    {classData.description || 'No description provided.'}
                  </p>
                  
                  <h4 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Details</h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Subject</dt>
                      <dd className="font-medium text-gray-900">{classData.subject}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Section</dt>
                      <dd className="font-medium text-gray-900">Section {classData.section}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Year</dt>
                      <dd className="font-medium text-gray-900">{classData.year}</dd>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-purple-100/20">
                      <dt className="text-sm text-gray-500 mb-1">Created</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(classData.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl p-8 border border-blue-100/20">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Class Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                <div>
                          <p className="text-sm text-purple-600 font-medium">Total Students</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {classData.students?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-100/20">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      <div>
                          <p className="text-sm text-blue-600 font-medium">Active Today</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {classData.students?.filter(s => s.lastActive > Date.now() - 86400000).length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'materials' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Class Materials
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchClassMaterials}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    title="Refresh materials"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  {user?.role !== 'student' && (
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Upload Material
                    </button>
                  )}
                </div>
              </div>
              
              {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map((material) => (
                    <div key={material.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100/20 hover:shadow-lg transition-shadow">
                      <FilePreview
                        fileUrl={material.fileUrl}
                        fileName={material.fileName}
                        mimeType={material.mimeType}
                        fileId={material.fileId}
                      />
                      
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">{material.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{material.description}</p>
                        
                        <div className="pt-3 mt-auto border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate max-w-[120px]">{material.fileName}</span>
                            </div>
                            <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {material.uploadedBy && (
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span>Uploaded by: </span>
                              <span className="ml-1 font-medium text-gray-700">
                                {typeof material.uploadedBy === 'object' 
                                  ? material.uploadedBy.name 
                                  : material.uploadedBy}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">No materials have been added yet</p>
                  {user?.role !== 'student' && (
                    <p className="text-gray-500 text-sm">
                      Click the 'Upload Material' button to add study materials
                    </p>
                  )}
                </div>
              )}

              {/* Upload Modal */}
              {showUploadModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ alignItems: 'flex-start', paddingTop: 'calc(5rem + env(safe-area-inset-top))' }}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
                  <div className="relative bg-gradient-to-br from-white to-purple-50/90 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-100/20 transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn">
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        Upload Material
                      </h3>
                      <p className="text-gray-500">Share study materials with your class</p>
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100/40 mb-6 shadow-inner">
                      <CloudinaryUpload 
                        onFileUpload={handleMaterialUpload}
                        accept="*/*"
                      />
                    </div>
                    
                    {uploadError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {uploadError}
                      </div>
                    )}
                    
                    {uploading && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-600 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Uploading material...
                      </div>
                    )}

                    <div className="flex justify-center gap-4 mt-6">
                      <button 
                        onClick={() => setShowUploadModal(false)}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={() => document.querySelector('.cloudinary-button').click()}
                      >
                        Select File
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'assignments' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Assignments
                </h2>
                {user?.role !== 'student' && (
                  <button 
                    onClick={() => setShowCreateAssignmentModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assignment
                  </button>
                )}
              </div>

              {assignments && assignments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100/20 hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{assignment.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                              {new Date(assignment.dueDate) < new Date() ? (
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">Overdue</span>
                              ) : (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Open</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Total Marks: {assignment.totalPoints}
                            </div>
                          </div>
                          
                          {user?.role === 'student' && (
                            <button 
                              onClick={() => handleSubmitAssignment(assignment.id)}
                              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium text-sm transition-colors"
                            >
                              Submit Work
                            </button>
                          )}
                        </div>
                        
                        <div className="bg-purple-50/50 rounded-xl p-4 mb-4">
                          <p className="text-gray-700">{assignment.description}</p>
                        </div>
                        
                        {assignment.fileUrl && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg text-purple-700">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium">{assignment.fileName || 'Assignment File'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={assignment.fileUrl} 
                                  download={assignment.fileName}
                                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </a>
                                <button
                                  onClick={() => {
                                    // Handle PDF files specially for Firefox
                                    const isPdf = assignment.fileName?.toLowerCase().endsWith('.pdf');
                                    if (isPdf) {
                                      // Create a loading indicator
                                      const loadingElement = document.createElement('div');
                                      loadingElement.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
                                      loadingElement.innerHTML = `
                                        <div class="bg-white rounded-lg p-4 flex flex-col items-center">
                                          <div class="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                          <span class="text-sm font-medium">Preparing PDF...</span>
                                        </div>
                                      `;
                                      document.body.appendChild(loadingElement);
                                      
                                      // First download, then open
                                      fetch(assignment.fileUrl)
                                        .then(response => response.blob())
                                        .then(blob => {
                                          const blobUrl = window.URL.createObjectURL(blob);
                                          
                                          // Create download link
                                          const link = document.createElement('a');
                                          link.href = blobUrl;
                                          link.download = assignment.fileName || 'download.pdf';
                                          link.style.display = 'none';
                                          document.body.appendChild(link);
                                          link.click();
                                          
                                          // Open in new tab
                                          setTimeout(() => {
                                            window.open(blobUrl, '_blank');
                                            window.URL.revokeObjectURL(blobUrl);
                                            document.body.removeChild(loadingElement);
                                          }, 1000);
                                          
                                          document.body.removeChild(link);
                                        })
                                        .catch(error => {
                                          console.error('Error handling PDF:', error);
                                          document.body.removeChild(loadingElement);
                                          window.open(assignment.fileUrl, '_blank');
                                        });
                                    } else {
                                      // For non-PDFs, just open
                                      window.open(assignment.fileUrl, '_blank');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm font-medium flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* For faculty: Show submissions section */}
                        {user?.role !== 'student' && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <h4 className="font-medium text-gray-900 mb-4">Student Submissions</h4>
                            
                            {assignment.submissions && assignment.submissions.length > 0 ? (
                              <div className="space-y-3">
                                {assignment.submissions.map((submission) => (
                                  <div key={submission.id} className="flex flex-col bg-green-50 rounded-lg text-green-700 border border-green-100 overflow-hidden">
                                    <div className="p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {submission.student.picture ? (
                                          <img 
                                            src={getProfileImageUrl(submission.student.picture)} 
                                            alt={submission.student.name} 
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-lg font-semibold border-2 border-white shadow">
                                            {submission.student.name.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-semibold text-green-800">{submission.student.name}</div>
                                          <div className="text-xs text-green-600">Submitted: {new Date(submission.submittedAt).toLocaleString()}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <a 
                                          href={submission.fileUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          download={submission.fileName}
                                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium flex items-center gap-1"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                          Download
                                        </a>
                                        <button
                                          onClick={() => handleEnterMarks(submission.id)}
                                          className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium flex items-center gap-1"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                          </svg>
                                          Enter Marks
                                        </button>
                                      </div>
                                    </div>
                                    <div className="px-4 py-2 bg-green-100 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="text-sm font-medium">{submission.fileName || 'Submitted File'}</span>
                                      {submission.marks && (
                                        <span className="ml-auto text-sm font-medium text-blue-600">Marks: {submission.marks}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>Not submitted yet</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* For students: Show their own submission status */}
                        {user?.role === 'student' && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="font-medium text-gray-900 mb-2">Your Submission</h4>
                            {assignment.submissions?.find(s => s.student.id === user.id) ? (
                              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg text-green-700 border border-green-100">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Submitted</span>
                                  <span className="text-xs">
                                    {new Date(assignment.submissions.find(s => s.student.id === user.id).submittedAt).toLocaleString()}
                                  </span>
                                </div>
                                <a 
                                  href={assignment.submissions.find(s => s.student.id === user.id).fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium"
                                >
                                  View
                                </a>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-700 border border-yellow-100">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>Not submitted yet</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">No assignments have been created yet</p>
                  {user?.role !== 'student' && (
                    <p className="text-gray-500 text-sm">
                      Click the 'Create Assignment' button to create a new assignment
                    </p>
                  )}
                </div>
              )}
              
              {/* Create Assignment Modal */}
              {showCreateAssignmentModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ alignItems: 'flex-start', paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateAssignmentModal(false)}></div>
                  <div className="relative bg-gradient-to-br from-white to-purple-50/90 rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-purple-100/20 transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Create Assignment
                      </h3>
                      <button 
                        onClick={() => setShowCreateAssignmentModal(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <form onSubmit={handleCreateAssignment} className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                          Assignment Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={assignmentForm.title}
                          onChange={handleAssignmentFormChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Enter assignment title"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={assignmentForm.description}
                          onChange={handleAssignmentFormChange}
                          required
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Provide assignment instructions and details"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Deadline
                        </label>
                        <input
                          type="datetime-local"
                          id="dueDate"
                          name="dueDate"
                          value={assignmentForm.dueDate}
                          onChange={handleAssignmentFormChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label htmlFor="totalPoints" className="block text-sm font-medium text-gray-700 mb-1">
                          Total Marks
                        </label>
                        <input
                          type="number"
                          id="totalPoints"
                          name="totalPoints"
                          value={assignmentForm.totalPoints}
                          onChange={handleAssignmentFormChange}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Enter total marks for the assignment"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assignment File (Optional)
                        </label>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100/40 shadow-inner">
                          <CloudinaryUpload 
                            onFileUpload={handleAssignmentFileUpload}
                            accept="*/*"
                          />
                        </div>
                        {assignmentForm.fileUrl && (
                          <div className="mt-3 flex items-center gap-2 p-3 bg-purple-50 rounded-lg text-purple-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{assignmentForm.fileName} uploaded</span>
                          </div>
                        )}
                      </div>
                        
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateAssignmentModal(false)}
                          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingAssignment}
                          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {creatingAssignment ? 'Creating...' : 'Create Assignment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              {/* Submit Assignment Modal */}
              {showSubmitAssignmentModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ alignItems: 'flex-start', paddingTop: 'calc(5rem + env(safe-area-inset-top))' }}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setShowSubmitAssignmentModal(false)}></div>
                  <div className="relative bg-gradient-to-br from-white to-purple-50/90 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-100/20 transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn">
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        Submit Assignment
                      </h3>
                      <p className="text-gray-500">Upload your completed assignment</p>
                    </div>
                    
                    {!submissionFile && !submitting && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-100/40 mb-6 shadow-inner">
                        <CloudinaryUpload 
                          onFileUpload={handleSubmissionFileUpload}
                          accept="*/*"
                        />
                      </div>
                    )}
                    
                    {submissionFile && (
                      <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600 flex items-center justify-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>File ready to submit: <strong>{submissionFile.fileName}</strong></span>
                      </div>
                    )}
                    
                    {submissionError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-center gap-2 mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {submissionError}
                      </div>
                    )}
                    
                    {submitting && (
                      <div className="p-6 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-purple-700 font-medium">Submitting your assignment...</p>
                        <p className="text-gray-500 text-sm">Please wait while we upload your file</p>
                      </div>
                    )}

                    <div className="flex justify-center gap-4 mt-6">
                      <button 
                        onClick={() => setShowSubmitAssignmentModal(false)}
                        disabled={submitting}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={submitAssignment}
                        disabled={!submissionFile || submitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Grade Submission Modal */}
              {showGradeModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{ alignItems: 'flex-start', paddingTop: 'calc(5rem + env(safe-area-inset-top))' }}>
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !grading && setShowGradeModal(false)}></div>
                  <div className="relative bg-gradient-to-br from-white to-purple-50/90 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-purple-100/20 transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn">
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                        Enter Marks
                      </h3>
                      <p className="text-gray-500">Grade the student's submission</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="marks" className="block text-sm font-medium text-gray-700 mb-1">
                          Marks
                        </label>
                        <input
                          type="number"
                          id="marks"
                          name="marks"
                          value={gradeData.marks}
                          onChange={handleGradeChange}
                          required
                          min="0"
                          step="0.1"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Enter marks"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (Optional)
                        </label>
                        <textarea
                          id="feedback"
                          name="feedback"
                          value={gradeData.feedback}
                          onChange={handleGradeChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                          placeholder="Provide feedback on the submission"
                        />
                      </div>
                      
                      {gradeError && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {gradeError}
                        </div>
                      )}
                      
                      {grading && (
                        <div className="p-6 flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-purple-700 font-medium">Submitting grade...</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                      <button 
                        onClick={() => setShowGradeModal(false)}
                        disabled={grading}
                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={submitGrade}
                        disabled={grading || !gradeData.marks}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {grading ? 'Processing...' : 'Submit Grade'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'students' && (
            <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-2xl p-8 border border-purple-100/20">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-8">
                Enrolled Students
              </h2>
              
              {classData.students && classData.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-purple-100/20 md:rounded-2xl">
                      <table className="min-w-full divide-y divide-purple-100/20">
                        <thead className="bg-purple-50/50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Student
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Email
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Year
                        </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                          Section
                        </th>
                      </tr>
                    </thead>
                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-purple-100/20">
                      {classData.students.map(student => (
                            <tr key={student._id || student.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {student.picture ? (
                                <img 
                                  src={getProfileImageUrl(student.picture)} 
                                  alt={student.name}
                                      className="h-10 w-10 rounded-xl object-cover ring-2 ring-purple-100"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                        e.target.parentElement.innerHTML = `<div class="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                      ${student.name.charAt(0).toUpperCase()}
                                    </div>`;
                                  }}
                                />
                              ) : (
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                                  <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                                    </div>
                              </div>
                            </div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.email}</div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.year || '-'}</div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{student.section || '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium mb-2">No students enrolled yet</p>
                  <p className="text-gray-500 text-sm">
                    Students can join using the class code: {classData.classCode}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};


export default ClassDetails; 