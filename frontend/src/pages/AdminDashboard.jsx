import React, { useState, useContext, useEffect } from 'react';
import AuthService from '../services/auth.service';
import AdminService from '../services/admin.service';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import PasswordUpdate from '../components/PasswordUpdate';
import FingerprintRegistration from '../components/FingerprintRegistration';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  
  // Registration State
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: 'STUDENT', enrollmentNo: '', courseName: '', department: '',
  });
  const [message, setMessage] = useState('');

  // Data States
  const [students, setStudents] = useState([]);
  const [studentPage, setStudentPage] = useState(0);
  const [studentSize, setStudentSize] = useState(10);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentMeta, setStudentMeta] = useState({ totalPages: 0, totalElements: 0, first: true, last: true });

  const [faculty, setFaculty] = useState([]);
  const [facultyPage, setFacultyPage] = useState(0);
  const [facultySize, setFacultySize] = useState(10);
  const [facultySearch, setFacultySearch] = useState('');
  const [facultyMeta, setFacultyMeta] = useState({ totalPages: 0, totalElements: 0, first: true, last: true });

  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [leaves, setLeaves] = useState([]);
  
  // Location State
  const [locationSettings, setLocationSettings] = useState({ latitude: '', longitude: '', radiusInMeters: '' });
  const [locationMsg, setLocationMsg] = useState('');

  // Bulk Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Bulk Deletion State
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Academic Upload State
  const [academicFile, setAcademicFile] = useState(null);
  const [academicUploadLoading, setAcademicUploadLoading] = useState(false);
  const [academicUploadResult, setAcademicUploadResult] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await AuthService.register(formData);
      setMessage('User registered successfully');
      setFormData({
        fullName: '', email: '', password: '', phone: '',
        role: 'STUDENT', enrollmentNo: '', courseName: '', department: '',
      });
    } catch (error) {
      setMessage('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchStudents = async (page = 0, size = studentSize, search = '') => {
      try {
          const res = await AdminService.getAllStudents(page, size, search);
          if (res.data && res.data.content) {
              setStudents(res.data.content);
              setStudentMeta(res.data);
          } else {
              setStudents(Array.isArray(res.data) ? res.data : []);
          }
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      if (activeTab === 'students') fetchStudents(studentPage, studentSize, studentSearch);
  }, [activeTab, studentPage, studentSize]);

  const fetchFaculty = async (page = 0, size = facultySize, search = '') => {
      try {
          const res = await AdminService.getAllFaculty(page, size, search);
          if (res.data && res.data.content) {
              setFaculty(res.data.content);
              setFacultyMeta(res.data);
          } else {
              setFaculty(Array.isArray(res.data) ? res.data : []);
          }
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      if (activeTab === 'faculty') fetchFaculty(facultyPage, facultySize, facultySearch);
  }, [activeTab, facultyPage, facultySize]);


  const fetchSessions = async () => {
      try {
          const res = await AdminService.getAllSessions();
          setSessions(res.data);
      } catch (err) { console.error(err); }
  };

  const deleteUser = async (userId) => {
      if(!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      try {
          await AdminService.deleteUser(userId);
          if (activeTab === 'students') fetchStudents();
          if (activeTab === 'faculty') fetchFaculty();
      } catch (err) {
          alert('Failed to delete user: ' + (err.response?.data || err.message));
      }
  };

  const deleteSession = async (sessionId) => {
      if(!window.confirm("Are you sure you want to delete this session and all its attendance records?")) return;
      try {
          await AdminService.deleteSession(sessionId);
          fetchSessions();
          if (selectedSessionId === sessionId) {
              setSelectedSessionId(null);
              setAttendance([]);
          }
      } catch (err) {
          alert('Failed to delete session: ' + (err.response?.data || err.message));
      }
  };

  const fetchLeaves = async () => {
      try {
          const res = await AdminService.getAllLeaves();
          setLeaves(res.data);
      } catch (err) { console.error(err); }
  };

  const handleUpdateLeaveStatus = async (leaveId, status) => {
      try {
          await AdminService.updateLeaveStatus(leaveId, status);
          fetchLeaves();
      } catch (err) {
          alert('Failed to update leave status: ' + (err.response?.data || err.message));
      }
  };

  const viewSessionDetails = async (sessionId) => {
      setSelectedSessionId(sessionId);
      try {
          const res = await AdminService.getAttendanceForSession(sessionId);
          setAttendance(res.data);
      } catch (err) { 
          console.error(err); 
          setAttendance([]);
      }
  };

  const fetchLocationSettings = async () => {
      try {
          const res = await AdminService.getLocationSettings();
          if (res.data) {
              setLocationSettings({
                  latitude: res.data.latitude,
                  longitude: res.data.longitude,
                  radiusInMeters: res.data.radiusInMeters
              });
          }
      } catch (err) { console.error(err); }
  };

  const handleUpdateLocation = async (e) => {
      e.preventDefault();
      try {
          // Convert string values to numbers
          const numericSettings = {
              latitude: parseFloat(locationSettings.latitude),
              longitude: parseFloat(locationSettings.longitude),
              radiusInMeters: parseFloat(locationSettings.radiusInMeters)
          };

          if (isNaN(numericSettings.latitude) || isNaN(numericSettings.longitude) || isNaN(numericSettings.radiusInMeters)) {
              setLocationMsg('Error: Please enter valid numbers for all fields');
              return;
          }

          await AdminService.updateLocationSettings(numericSettings);
          setLocationMsg('Location settings updated successfully');
          setTimeout(() => setLocationMsg(''), 3000);
      } catch (err) {
          console.error("Location update error:", err);
          const errorMsg = err.response?.data?.message || err.response?.data || err.message;
          setLocationMsg('Error: ' + errorMsg);
      }
  };

  const handleFetchCurrentLocation = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              setLocationSettings({
                  ...locationSettings,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
              });
          }, (error) => {
              alert("Error fetching location: " + error.message);
          });
      } else {
          alert("Geolocation is not supported by this browser.");
      }
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (!file.name.endsWith('.xlsx')) {
              alert('Please select a valid Excel file (.xlsx)');
              e.target.value = '';
              return;
          }
          setSelectedFile(file);
          setUploadResult(null);
      }
  };

  const handleBulkUpload = async () => {
      if (!selectedFile) {
          alert('Please select a file first');
          return;
      }

      setUploadLoading(true);
      setUploadResult(null);

      try {
          const res = await AdminService.bulkUploadStudents(selectedFile);
          setUploadResult(res.data);
          setSelectedFile(null);
          // Reset file input
          document.getElementById('bulkUploadInput').value = '';
      } catch (err) {
          setUploadResult({
              totalRecords: 0,
              successCount: 0,
              failureCount: 0,
              errors: [err.response?.data || 'Upload failed. Please try again.'],
              successMessages: []
          });
      } finally {
          setUploadLoading(false);
      }
  };

  const handleSelectStudent = (studentId) => {
      setSelectedStudents(prev => 
          prev.includes(studentId) 
              ? prev.filter(id => id !== studentId) 
              : [...prev, studentId]
      );
  };

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedStudents(students.map(s => s.userId));
      } else {
          setSelectedStudents([]);
      }
  };

  const handleBulkDelete = async () => {
      if (selectedStudents.length === 0) return;
      if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) return;

      try {
          await AdminService.deleteUsersBulk(selectedStudents);
          setSelectedStudents([]);
          fetchStudents();
          alert('Selected students deleted successfully');
      } catch (err) {
          alert('Failed to delete students: ' + (err.response?.data || err.message));
      }
  };

  const handleAcademicFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xlsx')) {
        alert('Please select a valid Excel file (.xlsx)');
        e.target.value = '';
        return;
      }
      setAcademicFile(file);
      setAcademicUploadResult(null);
    }
  };

  const handleAcademicBulkUpload = async () => {
    if (!academicFile) {
      alert('Please select a file first');
      return;
    }
    setAcademicUploadLoading(true);
    setAcademicUploadResult(null);
    try {
      const res = await AdminService.bulkUploadAcademicData(academicFile);
      setAcademicUploadResult(res.data);
      setAcademicFile(null);
      document.getElementById('academicUploadInput').value = '';
      fetchScoreboard();
    } catch (err) {
      setAcademicUploadResult({
        totalRecords: 0,
        successCount: 0,
        failureCount: 0,
        errors: [err.response?.data || 'Upload failed. Please try again.'],
        successMessages: []
      });
    } finally {
      setAcademicUploadLoading(false);
    }
  };

  const fetchScoreboard = async () => {
    try {
      const res = await AdminService.getScoreboard('admin');
      setScoreboard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAcademicRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await AdminService.deleteAcademicRecord(id);
      fetchScoreboard();
    } catch (err) {
      alert('Failed to delete record: ' + (err.response?.data || err.message));
    }
  };

  const handleClearScoreboard = async () => {
    if (!window.confirm('Are you sure you want to CLEAR ALL academic records? This cannot be undone.')) return;
    try {
      await AdminService.clearScoreboard();
      fetchScoreboard();
    } catch (err) {
      alert('Failed to clear scoreboard: ' + (err.response?.data || err.message));
    }
  };

  useEffect(() => {
      if (activeTab === 'students') fetchStudents();
      if (activeTab === 'faculty') fetchFaculty();
      if (activeTab === 'attendance') fetchSessions();
      if (activeTab === 'leaves') fetchLeaves();
      if (activeTab === 'location') fetchLocationSettings();
      if (activeTab === 'academic') fetchScoreboard();
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Close sidebar when tab changes on mobile
    setIsSidebarOpen(false);
    setSelectedStudents([]);
  }, [activeTab]);

  return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col overflow-hidden">
       <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center z-20 border-b dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
        </div>
         <div className="flex gap-4 items-center">
           <ThemeToggle />
           <span className="hidden sm:inline text-gray-600 dark:text-gray-300">Welcome, {user?.name}</span>
           <button onClick={handleLogout} className="text-red-500 font-semibold hover:text-red-700 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            absolute md:relative top-0 left-0 h-full z-30
            w-64 bg-white dark:bg-gray-800 shadow-md border-r dark:border-gray-700
            transform transition-transform duration-300 ease-in-out shrink-0 overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
              <ul className="flex flex-col py-4 h-full overflow-y-auto">
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'register' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('register')}>Register User</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'bulkUpload' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('bulkUpload')}>Bulk Upload Students</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'students' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('students')}>Manage Students</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'faculty' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('faculty')}>Manage Faculty</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'academic' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('academic')}>Academic Records</li>
                   <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'attendance' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('attendance')}>View Attendance</li>
                   <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'leaves' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('leaves')}>Leave Management</li>
                   <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'location' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('location')}>Campus Geofencing</li>
                   <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('profile')}>My Profile</li>
              </ul>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-auto">
              {activeTab === 'register' && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-2xl mx-auto animate-fade-in border dark:border-gray-700">
                      <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">Register New User</h2>
                      {message && <div className={`mb-6 p-4 rounded-lg font-medium ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
                      <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                              <input name="fullName" placeholder="Enter full name" value={formData.fullName} onChange={handleChange} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" required />
                          </div>
                          <div className="space-y-1">
                               <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email Address</label>
                               <input name="email" type="email" placeholder="enter email" value={formData.email} onChange={handleChange} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" required />
                          </div>
                          <div className="space-y-1">
                               <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Password</label>
                               <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" required />
                          </div>
                          <div className="space-y-1">
                               <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone Number</label>
                               <input name="phone" placeholder="Enter phone number" value={formData.phone} onChange={handleChange} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" />
                          </div>
                          
                          <div className="space-y-1">
                              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">User Role</label>
                              <select name="role" value={formData.role} onChange={handleChange} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white">
                                  <option value="STUDENT">Student</option>
                                  <option value="FACULTY">Faculty</option>
                              </select>
                          </div>

                          {formData.role === 'STUDENT' && (
                              <>
                                  <div className="space-y-1">
                                      <label className="text-sm font-semibold text-gray-600">Enrollment No</label>
                                      <input name="enrollmentNo" placeholder="ENR12345" value={formData.enrollmentNo} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition" required />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-sm font-semibold text-gray-600">Course Name</label>
                                      <input name="courseName" placeholder="PG-DAC" value={formData.courseName} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition" required />
                                  </div>
                              </>
                          )}

                          {formData.role === 'FACULTY' && (
                              <div className="space-y-1">
                                  <label className="text-sm font-semibold text-gray-600">Department</label>
                                  <input name="department" placeholder="IT / CS" value={formData.department} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition" required />
                              </div>
                          )}

                          <div className="md:col-span-2 mt-6">
                              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition font-bold shadow-md hover:shadow-lg">Create Account</button>
                          </div>
                      </form>
                  </div>
              )}

              {activeTab === 'bulkUpload' && (
                  <div className="max-w-4xl mx-auto animate-fade-in">
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Bulk Upload Students</h2>
                      
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700 mb-6">
                          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">📋 Instructions</h3>
                              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                                  <li>Download the Excel template below</li>
                                  <li>Fill in student details: <strong>PRN</strong> and <strong>Full Name</strong> only</li>
                                  <li>The course will be set to <strong>PG-DAC</strong> by default for all students</li>
                                  <li>Note: <strong>PRN</strong> acts as the <strong>Enrollment Number</strong> and initial Password</li>
                                  <li>Save the file as <strong>.xlsx</strong> (Excel Workbook) and upload it here</li>
                                  <li>Students will receive temporary email: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">PRN@temp.cdac.in</code></li>
                                  <li>Students must update email and password on first login</li>
                              </ul>
                          </div>

                          <div className="mb-6">
                              <a
                                  href="/backend/student_bulk_upload_template.csv"
                                  download="student_bulk_upload_template.csv"
                                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
                              >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Excel Template
                              </a>
                          </div>

                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                      Select Excel File (.xlsx)
                                  </label>
                                  <input
                                      id="bulkUploadInput"
                                      type="file"
                                      accept=".xlsx"
                                      onChange={handleFileSelect}
                                      className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 file:font-semibold hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                  />
                                  {selectedFile && (
                                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                          ✓ Selected: {selectedFile.name}
                                      </p>
                                  )}
                              </div>

                              <button
                                  onClick={handleBulkUpload}
                                  disabled={!selectedFile || uploadLoading}
                                  className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                  {uploadLoading ? (
                                      <>
                                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Uploading...
                                      </>
                                  ) : (
                                      <>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                          Upload & Create Students
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>

                      {uploadResult && (
                          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Upload Results</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Records</p>
                                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{uploadResult.totalRecords}</p>
                                  </div>
                                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                      <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Successful</p>
                                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{uploadResult.successCount}</p>
                                  </div>
                                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                                      <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Failed</p>
                                      <p className="text-3xl font-bold text-red-700 dark:text-red-300">{uploadResult.failureCount}</p>
                                  </div>
                              </div>

                              {uploadResult.successMessages && uploadResult.successMessages.length > 0 && (
                                  <div className="mb-6">
                                      <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">✓ Successfully Created:</h4>
                                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 max-h-60 overflow-y-auto">
                                          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                              {uploadResult.successMessages.map((msg, idx) => (
                                                  <li key={idx}>• {msg}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  </div>
                              )}

                              {uploadResult.errors && uploadResult.errors.length > 0 && (
                                  <div>
                                      <h4 className="font-bold text-red-700 dark:text-red-400 mb-2">✗ Errors:</h4>
                                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 max-h-60 overflow-y-auto">
                                          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                              {uploadResult.errors.map((err, idx) => (
                                                  <li key={idx}>• {err}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'students' && (
                  <div className="animate-fade-in space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Student Directory</h2>
                          <div className="flex gap-2 w-full md:w-auto items-center">
                              <div className="relative w-full md:w-64">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                      placeholder="Search students..."
                                      value={studentSearch}
                                      onChange={(e) => setStudentSearch(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && fetchStudents(0, studentSize, studentSearch)}
                                      className="pl-8"
                                  />
                              </div>
                              <Button onClick={() => fetchStudents(0, studentSize, studentSearch)}>Search</Button>
                          </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mb-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedStudents(students.map(s => s.userId))}>Select All</Button>
                          {selectedStudents.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setSelectedStudents([])}>Clear</Button>
                                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete Selected ({selectedStudents.length})</Button>
                            </>
                          )}
                      </div>

                      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-[50px] text-center">
                                          <input 
                                              type="checkbox" 
                                              onChange={handleSelectAll}
                                              checked={students.length > 0 && selectedStudents.length === students.length}
                                              className="translate-y-[2px]"
                                          />
                                      </TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Enrollment</TableHead>
                                      <TableHead>Course</TableHead>
                                      <TableHead className="text-center">Action</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {students.map(student => (
                                      <TableRow key={student.userId} data-state={selectedStudents.includes(student.userId) && "selected"}>
                                          <TableCell className="text-center">
                                              <input 
                                                  type="checkbox" 
                                                  checked={selectedStudents.includes(student.userId)}
                                                  onChange={() => handleSelectStudent(student.userId)}
                                              />
                                          </TableCell>
                                          <TableCell className="font-medium">{student.user?.fullName}</TableCell>
                                          <TableCell>{student.user?.email}</TableCell>
                                          <TableCell className="font-mono">{student.enrollmentNo}</TableCell>
                                          <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{student.courseName}</span></TableCell>
                                          <TableCell className="text-center">
                                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteUser(student.userId)}>Delete</Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                                  {students.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                            <Select value={String(studentSize)} onValueChange={(val) => { setStudentSize(Number(val)); setStudentPage(0); }}>
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                              <div className="text-sm text-muted-foreground hidden sm:block">
                                  Showing {students.length} of {studentMeta.totalElements || students.length}
                              </div>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setStudentPage(Math.max(0, studentPage - 1))}
                                  disabled={studentMeta.first}
                              >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                              </Button>
                              <div className="text-sm font-medium">
                                  Page {studentMeta.number !== undefined ? studentMeta.number + 1 : 1} of {studentMeta.totalPages || 1}
                              </div>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setStudentPage(Math.min((studentMeta.totalPages || 1) - 1, studentPage + 1))}
                                  disabled={studentMeta.last}
                              >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                              </Button>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'faculty' && (
                  <div className="animate-fade-in space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Faculty Directory</h2>
                          <div className="flex gap-2 w-full md:w-auto items-center">
                              <div className="relative w-full md:w-64">
                                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                      placeholder="Search faculty..."
                                      value={facultySearch}
                                      onChange={(e) => setFacultySearch(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && fetchFaculty(0, facultySize, facultySearch)}
                                      className="pl-8"
                                  />
                              </div>
                              <Button onClick={() => fetchFaculty(0, facultySize, facultySearch)}>Search</Button>
                          </div>
                      </div>

                      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Department</TableHead>
                                      <TableHead className="text-center">Action</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {faculty.map(fac => (
                                      <TableRow key={fac.userId}>
                                          <TableCell className="font-medium">{fac.user?.fullName}</TableCell>
                                          <TableCell>{fac.user?.email}</TableCell>
                                          <TableCell><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80">{fac.department}</span></TableCell>
                                          <TableCell className="text-center">
                                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteUser(fac.userId)}>Delete</Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                                  {faculty.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                      
                      {/* Pagination Controls */}
                      <div className="flex flex-col md:flex-row items-center justify-between px-2 gap-4">
                          <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                              <Select value={String(facultySize)} onValueChange={(val) => { setFacultySize(Number(val)); setFacultyPage(0); }}>
                                  <SelectTrigger className="w-[70px]">
                                      <SelectValue placeholder="10" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="5">5</SelectItem>
                                      <SelectItem value="10">10</SelectItem>
                                      <SelectItem value="20">20</SelectItem>
                                      <SelectItem value="50">50</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                              <div className="text-sm text-muted-foreground hidden sm:block">
                                  Showing {faculty.length} of {facultyMeta.totalElements || faculty.length}
                              </div>
                              <div className="flex items-center space-x-2">
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setFacultyPage(Math.max(0, facultyPage - 1))}
                                      disabled={facultyMeta.first}
                                  >
                                      <ChevronLeft className="h-4 w-4" />
                                      Previous
                                  </Button>
                                  <div className="text-sm font-medium">
                                      Page {facultyMeta.number !== undefined ? facultyMeta.number + 1 : 1} of {facultyMeta.totalPages || 1}
                                  </div>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setFacultyPage(Math.min((facultyMeta.totalPages || 1) - 1, facultyPage + 1))}
                                      disabled={facultyMeta.last}
                                  >
                                      Next
                                      <ChevronRight className="h-4 w-4" />
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'attendance' && (
                  <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance Management</h2>
                        <button onClick={fetchSessions} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">Refresh List</button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          {/* Sessions List */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden h-fit">
                              <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600">
                                  <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-sm text-center">Available Sessions</h3>
                              </div>
                              <div className="max-h-[600px] overflow-auto overflow-x-auto">
                                  <table className="w-full text-left border-collapse min-w-[400px]">
                                      <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                          <tr className="border-b dark:border-gray-600">
                                              <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Subject / Faculty</th>
                                              <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                              <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-center">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {sessions.map(s => (
                                              <tr key={s.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedSessionId === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                  <td className="p-4">
                                                      <div className="font-bold text-gray-800 dark:text-gray-200">{s.subject?.name}</div>
                                                      <div className="text-xs text-blue-600 dark:text-blue-400">{s.faculty?.fullName}</div>
                                                  </td>
                                                  <td className="p-4">
                                                      <div className="text-sm font-medium dark:text-gray-300">{new Date(s.createdAt).toLocaleDateString()}</div>
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleTimeString()}</div>
                                                  </td>
                                                  <td className="p-4 flex gap-2 justify-center">
                                                      <button onClick={() => viewSessionDetails(s.id)} className={`px-3 py-1 rounded text-xs font-bold transition ${selectedSessionId === s.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'}`}>Details</button>
                                                      <button onClick={() => deleteSession(s.id)} className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded text-xs font-bold transition">Delete</button>
                                                  </td>
                                              </tr>
                                          ))}
                                          {sessions.length === 0 && <tr><td colSpan="3" className="p-12 text-center text-gray-400 italic dark:text-gray-500">No activity recorded.</td></tr>}
                                      </tbody>
                                  </table>
                              </div>
                          </div>

                          {/* Attendance Details View */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden h-fit min-h-[400px] overflow-x-auto">
                              {selectedSessionId ? (
                                  <>
                                      <div className="bg-blue-600 dark:bg-blue-700 p-4 text-white flex justify-between items-center">
                                          <div>
                                              <h3 className="font-bold">Attendance Record</h3>
                                              <p className="text-xs opacity-80">Showing entries for selected session</p>
                                          </div>
                                          <div className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{attendance.length} Presents</div>
                                      </div>
                                      <table className="w-full text-left border-collapse min-w-[300px]">
                                          <thead>
                                              <tr className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Student</th>
                                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Status</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {attendance.map(a => (
                                                  <tr key={a.id} className="border-b dark:border-gray-700 transition hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                      <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{a.student?.fullName}</td>
                                                      <td className="p-4 text-xs text-gray-500 dark:text-gray-400">{new Date(a.markedAt).toLocaleTimeString()}</td>
                                                      <td className="p-4 text-right">
                                                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">Present</span>
                                                      </td>
                                                  </tr>
                                              ))}
                                              {attendance.length === 0 && <tr><td colSpan="3" className="p-12 text-center text-gray-400 italic dark:text-gray-500">No students marked attendance for this session.</td></tr>}
                                          </tbody>
                                      </table>
                                  </>
                              ) : (
                                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 dark:text-gray-500 p-8 text-center">
                                      <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-4">
                                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                      </div>
                                      <h4 className="font-bold text-gray-600 dark:text-gray-300 mb-2">No Session Selected</h4>
                                      <p className="text-sm max-w-[200px]">Click on a session's details to view student attendance list.</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
              {activeTab === 'leaves' && (
                  <div className="animate-fade-in">
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Leave Management</h2>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
                                      <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Student</th>
                                      <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Reason</th>
                                      <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Dates</th>
                                      <th className="p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                                      <th className="p-4 font-bold text-gray-700 dark:text-gray-200 text-center">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {leaves.map(leave => (
                                      <tr key={leave.id} className="border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition duration-200">
                                          <td className="p-4">
                                              <div className="font-medium dark:text-gray-200">{leave.student?.fullName}</div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">{leave.student?.email}</div>
                                          </td>
                                          <td className="p-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">{leave.reason}</td>
                                          <td className="p-4 text-sm dark:text-gray-300">
                                              <div>{leave.startDate} to</div>
                                              <div>{leave.endDate}</div>
                                          </td>
                                          <td className="p-4">
                                              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                  leave.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                  leave.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                              }`}>
                                                  {leave.status}
                                              </span>
                                          </td>
                                          <td className="p-4 text-center">
                                              {leave.status === 'PENDING' && (
                                                  <div className="flex gap-2 justify-center">
                                                      <button onClick={() => handleUpdateLeaveStatus(leave.id, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 transition">Approve</button>
                                                      <button onClick={() => handleUpdateLeaveStatus(leave.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700 transition">Reject</button>
                                                  </div>
                                              )}
                                              {leave.status !== 'PENDING' && <span className="text-gray-400 italic text-xs">Processed</span>}
                                          </td>
                                      </tr>
                                  ))}
                                  {leaves.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-gray-500 italic dark:text-gray-400">No leave requests found.</td></tr>}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {activeTab === 'location' && (
                   <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700 animate-fade-in">
                        <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">Campus Geofencing Settings</h2>
                        {locationMsg && <div className={`mb-6 p-4 rounded font-medium ${locationMsg.includes('success') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{locationMsg}</div>}
                        
                        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <strong>Tip:</strong> Set the central coordinates of your campus and the allowed radius (in meters) within which students can mark their attendance.
                            </p>
                        </div>

                        <form onSubmit={handleUpdateLocation} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Campus Latitude</label>
                                    <input type="number" step="any" value={locationSettings.latitude} onChange={(e) => setLocationSettings({...locationSettings, latitude: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" placeholder="e.g. 18.5204" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Campus Longitude</label>
                                    <input type="number" step="any" value={locationSettings.longitude} onChange={(e) => setLocationSettings({...locationSettings, longitude: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" placeholder="e.g. 73.8567" required />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Allowed Radius (Meters)</label>
                                <input type="number" value={locationSettings.radiusInMeters} onChange={(e) => setLocationSettings({...locationSettings, radiusInMeters: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition bg-white dark:bg-gray-700 dark:text-white" placeholder="e.g. 100" required />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button type="button" onClick={handleFetchCurrentLocation} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-bold shadow-sm flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    Get My Current Location
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition font-bold shadow-md hover:shadow-lg">Save Settings</button>
                            </div>
                        </form>
                   </div>
              )}
              
              {activeTab === 'academic' && (
                  <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border dark:border-gray-700">
                          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Upload Academic Data</h2>
                          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Important</h3>
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                  Academic data can only be uploaded for <strong>registered students</strong>. Ensure students are already in the system before uploading their marks.
                              </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Excel File (.xlsx)</label>
                                  <input
                                      id="academicUploadInput"
                                      type="file"
                                      accept=".xlsx"
                                      onChange={handleAcademicFileSelect}
                                      className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400"
                                  />
                              </div>
                              <button
                                  onClick={handleAcademicBulkUpload}
                                  disabled={!academicFile || academicUploadLoading}
                                  className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                  {academicUploadLoading ? 'Uploading...' : 'Upload Academic Data'}
                              </button>
                          </div>
                          {academicUploadResult && (
                              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
                                  <p className="font-bold dark:text-white">Status: {academicUploadResult.successCount} Success, {academicUploadResult.failureCount} Failed</p>
                                  {academicUploadResult.errors?.length > 0 && (
                                      <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                                          {academicUploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                      </ul>
                                  )}
                              </div>
                          )}
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden">
                          <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Scoreboard (Top Performers)</h2>
                              <div className="flex gap-4 items-center">
                                  <button onClick={handleClearScoreboard} className="text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-1 border border-red-500 rounded hover:bg-red-50 transition">Clear All</button>
                                  <button onClick={fetchScoreboard} className="text-blue-600 hover:underline">Refresh</button>
                              </div>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                  <thead>
                                      <tr className="bg-gray-100 dark:bg-gray-700 dark:text-gray-200">
                                          <th className="p-4 border-r dark:border-gray-600">PRN No</th>
                                          <th className="p-4 border-r dark:border-gray-600">Name</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">Aptitude</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">CPP</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">Java OOP</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">Java ADS</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">WPT</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">DBT</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">.NET</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">OS/SDM</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">WBJ</th>
                                          <th className="p-4 border-r dark:border-gray-600 font-bold text-center">Total (/360)</th>
                                          <th className="p-4 border-r dark:border-gray-600 font-bold text-center">Percentage</th>
                                          <th className="p-4 border-r dark:border-gray-600 text-center">Status</th>
                                          <th className="p-4 text-center">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {scoreboard.map((row, idx) => (
                                          <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                              <td className="p-4 border-r dark:border-gray-600 font-mono">{row.prn}</td>
                                              <td className="p-4 border-r dark:border-gray-600 font-medium dark:text-white">{row.name}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.aptitude}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.cpp}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.oopJava}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.adsJava}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.wpt}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.dbt}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.dotnet}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.osSdm}</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">{row.wbj}</td>
                                              <td className="p-4 border-r dark:border-gray-600 font-bold text-center text-blue-600 dark:text-blue-400">{row.total}</td>
                                              <td className="p-4 border-r dark:border-gray-600 font-bold text-center text-indigo-600 dark:text-indigo-400">{row.percentage?.toFixed(2)}%</td>
                                              <td className="p-4 border-r dark:border-gray-600 text-center">
                                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                      {row.status}
                                                  </span>
                                              </td>
                                              <td className="p-4 text-center">
                                                  <button onClick={() => handleDeleteAcademicRecord(row.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>
                                              </td>
                                          </tr>
                                      ))}
                                      {scoreboard.length === 0 && <tr><td colSpan="14" className="p-12 text-center text-gray-500 italic">No academic records available.</td></tr>}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'profile' && (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow border dark:border-gray-700 animate-fade-in">
                      <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">My Profile</h2>
                      <div className="mb-6">
                           <p className="text-gray-600 dark:text-gray-300"><strong>Name:</strong> {user?.name}</p>
                           <p className="text-gray-600 dark:text-gray-300"><strong>Role:</strong> {user?.roles?.join(', ')}</p>
                      </div>
                      <FingerprintRegistration />
                      <PasswordUpdate />
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
