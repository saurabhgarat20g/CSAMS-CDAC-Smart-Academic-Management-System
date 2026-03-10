import React, { useState, useContext, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FacultyService from '../services/faculty.service';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import PasswordUpdate from '../components/PasswordUpdate';
import FingerprintRegistration from '../components/FingerprintRegistration';

const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generate');
  
  // QR Generation State
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [duration, setDuration] = useState(10);
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [selectedSessionAttendance, setSelectedSessionAttendance] = useState([]);
  const [viewingSessionId, setViewingSessionId] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Profile State
  const [profileData, setProfileData] = useState({ fullName: '', phone: '', department: '' });
  const [profileMsg, setProfileMsg] = useState('');

  // Scoreboard State
  const [scoreboard, setScoreboard] = useState([]);

  useEffect(() => {
    fetchSubjects();
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'profile') fetchProfile();
    if (activeTab === 'scoreboard') fetchScoreboard();
  }, [activeTab]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch subjects", error);
    }
  };

  const fetchSessions = async () => {
      setFetchError(null);
      try {
          const res = await FacultyService.getMySessions();
          console.log("Fetched sessions:", res.data);
          if (Array.isArray(res.data)) {
              setSessions(res.data);
          } else {
              console.error("Expected array for sessions, got:", res.data);
              setFetchError("Invalid data format received from server");
          }
      } catch (err) { 
          console.error("Error fetching sessions:", err);
          setFetchError("Failed to load sessions: " + (err.response?.data?.message || err.message));
      }
  };

  const fetchProfile = async () => {
      try {
          const res = await FacultyService.getProfile();
          setProfileData({
              fullName: res.data.user.fullName,
              phone: res.data.user.phone || '',
              department: res.data.department
          });
      } catch (err) { console.error(err); }
  };

  const fetchScoreboard = async () => {
      try {
          const res = await FacultyService.getScoreboard();
          setScoreboard(res.data);
      } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    try {
      if (!subjectId) {
        setMessage('Please select a subject');
        return;
      }
      const response = await FacultyService.generateQr(subjectId, duration);
      setQrData(response.data);
      setMessage('QR Code Generated Successfully');
    } catch (error) {
      setMessage('Error generating QR: ' + (error.response?.data || error.message));
    }
  };

  const handleViewAttendance = async (sessionId) => {
      try {
          const res = await FacultyService.getSessionAttendance(sessionId);
          setSelectedSessionAttendance(res.data);
          setViewingSessionId(sessionId);
      } catch (err) { alert('Error fetching attendance: ' + (err.response?.data || err.message)); }
  };

  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      try {
          await FacultyService.updateProfile(profileData);
          setProfileMsg('Profile updated successfully');
          setTimeout(() => setProfileMsg(''), 3000);
      } catch (err) {
          setProfileMsg('Error: ' + (err.response?.data || err.message));
      }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Faculty Dashboard</h1>
        </div>
         <div className="flex gap-4 items-center">
           <ThemeToggle />
           <span className="hidden sm:inline text-gray-600 dark:text-gray-300">Welcome, {user?.name}</span>
           <button onClick={handleLogout} className="text-red-500 font-semibold hover:text-red-700 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 relative overflow-hidden">
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
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'generate' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('generate')}>Generate QR</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'sessions' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('sessions')}>My Sessions</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'scoreboard' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('scoreboard')}>Scoreboard</li>
                  <li className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} onClick={() => setActiveTab('profile')}>My Profile</li>
              </ul>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-auto">
              {activeTab === 'generate' && (
                  <div className="max-w-4xl mx-auto">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-6 border dark:border-gray-700">
                          <h2 className="text-lg font-bold mb-4 dark:text-white">Generate Attendance QR</h2>
                          <form onSubmit={handleGenerateQR} className="flex flex-wrap gap-4 items-end">
                              <div className="flex-1 min-w-[200px]">
                                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="border dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 dark:text-white" required>
                                      <option value="">Select Subject</option>
                                      {subjects.map(sub => (
                                          <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                                      ))}
                                  </select>
                              </div>
                              <div className="w-32">
                                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Duration (mins)</label>
                                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="border dark:border-gray-600 p-2 rounded w-full bg-white dark:bg-gray-700 dark:text-white" required />
                              </div>
                              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 h-10 transition">Generate QR</button>
                          </form>
                          {message && <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">{message}</div>}
                      </div>

                      {qrData && (
                          <div className="bg-white dark:bg-gray-800 p-8 rounded shadow flex flex-col items-center animate-fade-in border dark:border-gray-700">
                              <h3 className="font-bold text-xl mb-6 dark:text-white">Scan to Mark Attendance</h3>
                              <div className="p-6 bg-white border-4 border-blue-500 rounded-xl shadow-lg">
                                  <QRCode value={qrData.token} size={256} />
                              </div>
                              <div className="mt-8 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg w-full max-w-md">
                                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Subject: <span className="text-blue-600 dark:text-blue-400">{qrData.subjectName}</span></p>
                                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Token: <span className="font-mono bg-white dark:bg-gray-600 px-2 py-1 border dark:border-gray-500 rounded dark:text-white">{qrData.token}</span></p>
                                  <p className="text-red-500 font-bold">Expires at: {new Date(qrData.expiresAt).toLocaleTimeString()}</p>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {activeTab === 'sessions' && (
                  <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Session Records</h2>
                        <div className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded text-gray-600 dark:text-gray-400 font-mono">
                            User ID: {user?.id || 'N/A'} | Sessions Found: {sessions.length}
                        </div>
                      </div>

                      {fetchError && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-800">{fetchError}</div>}
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden border dark:border-gray-700 overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[600px]">
                                  <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
                                      <tr>
                                          <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                                          <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Created At</th>
                                          <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Attendance</th>
                                          <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {sessions.map(s => (
                                          <tr key={s.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${viewingSessionId === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                              <td className="p-4">
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{s.subjectName || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{s.subjectCode}</div>
                                              </td>
                                              <td className="p-4 text-sm dark:text-gray-300">{s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A'}</td>
                                              <td className="p-4">
                                                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-bold">{s.attendanceCount} Students</span>
                                              </td>
                                              <td className="p-4">
                                                  <button onClick={() => handleViewAttendance(s.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">Details</button>
                                              </td>
                                          </tr>
                                      ))}
                                      {sessions.length === 0 && !fetchError && <tr><td colSpan="4" className="p-8 text-center text-gray-500 italic dark:text-gray-400">No sessions found in your history.</td></tr>}
                                  </tbody>
                              </table>
                          </div>

                          {viewingSessionId && (
                              <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden h-fit animate-slide-in border dark:border-gray-700 overflow-x-auto">
                                  <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex justify-between items-center">
                                      <h3 className="font-bold">Attendance Details</h3>
                                      <button onClick={() => setViewingSessionId(null)} className="text-white hover:text-gray-200">✕</button>
                                  </div>
                                  <table className="w-full text-left border-collapse min-w-[300px]">
                                      <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                          <tr>
                                              <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Student Name</th>
                                              <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Marked At</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {selectedSessionAttendance.map(a => (
                                              <tr key={a.id} className="border-b dark:border-gray-700">
                                                  <td className="p-4 dark:text-gray-200">{a.student?.fullName || 'N/A'}</td>
                                                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{new Date(a.markedAt).toLocaleString()}</td>
                                              </tr>
                                          ))}
                                          {selectedSessionAttendance.length === 0 && <tr><td colSpan="2" className="p-8 text-center text-gray-500 italic dark:text-gray-400">No attendance marked yet.</td></tr>}
                                      </tbody>
                                  </table>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {activeTab === 'scoreboard' && (
                <div className="max-w-7xl mx-auto animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Student Scoreboard</h2>
                            <button onClick={fetchScoreboard} className="text-blue-600 hover:underline">Refresh</button>
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
                                        <th className="p-4 text-center">Status</th>
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
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {scoreboard.length === 0 && <tr><td colSpan="13" className="p-12 text-center text-gray-500 italic">No academic records found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'profile' && (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow border dark:border-gray-700">
                      <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">My Profile</h2>
                      {profileMsg && <div className={`mb-6 p-4 rounded font-medium ${profileMsg.includes('success') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{profileMsg}</div>}
                      <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 gap-6">
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                              <input value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 dark:text-white" required />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                              <input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 dark:text-white" />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Department</label>
                              <input value={profileData.department} onChange={(e) => setProfileData({...profileData, department: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-gray-700 dark:text-white" required />
                          </div>
                          <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 mt-4 shadow-md">Update Profile</button>
                      </form>
                      <FingerprintRegistration />
                      <PasswordUpdate />
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
