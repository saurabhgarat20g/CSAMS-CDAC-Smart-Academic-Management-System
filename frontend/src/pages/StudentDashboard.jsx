import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StudentService from '../services/student.service';
import { Html5Qrcode } from 'html5-qrcode';
import ThemeToggle from '../components/ThemeToggle';
import PasswordUpdate from '../components/PasswordUpdate';
import FingerprintRegistration from '../components/FingerprintRegistration';
import WebAuthnService from '../services/webauthn.service';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);
  
  // States
  const [token, setToken] = useState('');
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [leaveData, setLeaveData] = useState({ reason: '', startDate: '', endDate: '' });
  const [leaveMsg, setLeaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [profileData, setProfileData] = useState({ fullName: '', phone: '', enrollmentNo: '', courseName: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [scoreboard, setScoreboard] = useState([]);

  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
    if (activeTab === 'leave' || activeTab === 'leave-status') fetchLeaveHistory();
    if (activeTab === 'scoreboard') {
        fetchScoreboard();
        if (!profileData.enrollmentNo) fetchProfile();
    }
  }, [activeTab]);

  useEffect(() => {
    let html5QrCode;
    if (isScanning) {
        html5QrCode = new Html5Qrcode("reader");
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                const cameraId = devices[devices.length - 1].id;
                html5QrCode.start(
                    cameraId, 
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        html5QrCode.stop().then(() => {
                            html5QrCode.clear();
                            setToken(decodedText);
                            setIsScanning(false);
                        }).catch(err => {
                            console.error("Error stopping scanner:", err);
                            setIsScanning(false);
                        });
                    },
                ).catch(err => {
                    setErrorMsg("Camera Failed: " + err);
                    setIsScanning(false);
                });
            } else {
                setErrorMsg("No Camera Found");
                setIsScanning(false);
            }
        }).catch(err => {
            setErrorMsg("Permission Denied or Camera Error");
            setIsScanning(false);
        });
    }
    return () => {
        try {
            if(html5QrCode) {
                if(html5QrCode.isScanning) html5QrCode.stop().catch(() => {});
                html5QrCode.clear().catch(() => {});
            }
        } catch(e) {}
    };
  }, [isScanning]);

  const fetchProfile = async () => {
      try {
          const res = await StudentService.getProfile();
          setProfileData({
              fullName: res.data.user.fullName,
              phone: res.data.user.phone || '',
              enrollmentNo: res.data.enrollmentNo,
              courseName: res.data.courseName
          });
      } catch (err) { console.error(err); }
  };

  const fetchLeaveHistory = async () => {
      try {
          const res = await StudentService.getMyLeaves();
          setLeaveHistory(res.data);
      } catch (err) { console.error(err); }
  };

  const fetchScoreboard = async () => {
      try {
          const res = await StudentService.getScoreboard();
          setScoreboard(res.data);
      } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const myResultsData = useMemo(() => {
    const record = scoreboard.find(r => r.prn === profileData.enrollmentNo);
    const rank = scoreboard.findIndex(r => r.prn === profileData.enrollmentNo) + 1;
    return { myRecord: record, myRank: rank };
  }, [scoreboard, profileData.enrollmentNo]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setAttendanceMsg('Initiating Biometric Verification...');
    if (!navigator.geolocation) {
        setAttendanceMsg('Error: Geolocation is not supported');
        return;
    }
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const response = await WebAuthnService.verifyFingerprintAndMarkAttendance(token, pos.coords.latitude, pos.coords.longitude);
                setAttendanceMsg(response.data);
            } catch (error) {
                setAttendanceMsg('Error: ' + (error.response?.data?.message || error.message));
            }
        },
        () => setAttendanceMsg('Error: Location access denied'),
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      await StudentService.applyLeave(leaveData);
      setLeaveMsg('Leave application submitted successfully');
      setLeaveData({ reason: '', startDate: '', endDate: '' });
      fetchLeaveHistory();
      setTimeout(() => setLeaveMsg(''), 3000);
    } catch (error) {
      setLeaveMsg('Error: ' + (error.response?.data || error.message));
    }
  };

  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      try {
          await StudentService.updateProfile(profileData);
          setProfileMsg('Profile updated successfully');
          setTimeout(() => setProfileMsg(''), 3000);
      } catch (err) {
          setProfileMsg('Error: ' + (err.response?.data || err.message));
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center z-10 border-b dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600 dark:text-gray-300 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Student Dashboard</h1>
        </div>
        <div className="flex gap-4 items-center">
          <ThemeToggle />
          <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="text-red-500 font-semibold hover:text-red-700">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 relative overflow-hidden">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={`absolute md:relative top-0 left-0 h-full z-30 w-64 bg-white dark:bg-gray-800 shadow-md border-r dark:border-gray-700 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <ul className="flex flex-col py-4">
            {[
              { id: 'attendance', label: 'Mark Attendance', color: 'green' },
              { id: 'leave', label: 'Apply Leave', color: 'orange' },
              { id: 'leave-status', label: 'Leave Status', color: 'blue' },
              { id: 'scoreboard', label: 'My Results', color: 'blue' },
              { id: 'profile', label: 'My Profile', color: 'blue' },
            ].map(tab => (
              <li key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === tab.id ? `bg-${tab.color}-50 dark:bg-${tab.color}-900/30 border-r-4 border-${tab.color}-500 font-medium text-${tab.color}-600 dark:text-${tab.color}-400` : 'text-gray-600 dark:text-gray-300'}`}>
                {tab.label}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          {activeTab === 'attendance' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow border dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Attendance Scan</h2>
              {isScanning ? (
                <div className="mb-6">
                  <div id="reader" className="w-full h-64 bg-black rounded-lg overflow-hidden border-4 border-green-500"></div>
                  <button onClick={() => setIsScanning(false)} className="mt-4 w-full bg-red-100 dark:bg-red-900/30 text-red-600 py-2 rounded font-medium">Cancel Scan</button>
                </div>
              ) : (
                <button onClick={() => { setIsScanning(true); setErrorMsg(''); }} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 mb-8 shadow-lg transform active:scale-95 transition">Scan QR Code</button>
              )}
              {errorMsg && <div className="mb-6 text-red-600 bg-red-50 p-4 border border-red-200 rounded-lg">{errorMsg}</div>}
              <form onSubmit={handleMarkAttendance}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">QR Token</label>
                  <input type="text" value={token} onChange={(e) => setToken(e.target.value)} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" placeholder="Scan or enter token" required />
                </div>
                <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-900 shadow-md">Mark Present</button>
              </form>
              {attendanceMsg && <div className="mt-6 p-4 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">{attendanceMsg}</div>}
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow border dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Apply for Leave</h2>
              {leaveMsg && <div className={`mb-6 p-4 rounded font-medium ${leaveMsg.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{leaveMsg}</div>}
              <form onSubmit={handleLeaveSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason for Leave</label>
                  <textarea value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg h-32 bg-white dark:bg-gray-700 dark:text-white" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                    <input type="date" value={leaveData.startDate} onChange={(e) => setLeaveData({...leaveData, startDate: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                    <input type="date" value={leaveData.endDate} onChange={(e) => setLeaveData({...leaveData, endDate: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700">Submit Application</button>
              </form>
            </div>
          )}

          {activeTab === 'leave-status' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">My Leave Applications</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600 text-gray-700 dark:text-gray-200">
                      <th className="p-4 font-bold">Reason</th>
                      <th className="p-4 font-bold">Date Range</th>
                      <th className="p-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.map(leave => (
                      <tr key={leave.id} className="border-b dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <td className="p-4 text-gray-700 dark:text-gray-200 align-top"><div className="font-medium">{leave.reason}</div></td>
                        <td className="p-4 text-sm dark:text-gray-300 align-top">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">From: {leave.startDate}</span>
                            <span className="text-xs text-gray-500">To: {leave.endDate}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center align-top">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{leave.status}</span>
                        </td>
                      </tr>
                    ))}
                    {leaveHistory.length === 0 && <tr><td colSpan="3" className="p-12 text-center text-gray-500 italic">No leave applications yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scoreboard' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">Academic Performance</h2>
                <button onClick={fetchScoreboard} className="bg-white dark:bg-gray-800 border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">Refresh Data</button>
              </div>

              {!myResultsData.myRecord ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl text-center border dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Results Pending</h3>
                  <p className="text-gray-500 dark:text-gray-400">Your records haven't been uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
                      <p className="text-indigo-100 text-sm uppercase mb-1">Class Rank</p>
                      <div className="flex items-baseline gap-2"><span className="text-4xl font-black">#{myResultsData.myRank}</span><span className="text-indigo-200">of {scoreboard.length}</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-2xl shadow-lg text-white">
                      <p className="text-blue-100 text-sm uppercase mb-1">Percentage</p>
                      <span className="text-4xl font-black">{myResultsData.myRecord.percentage?.toFixed(2)}%</span>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-lg text-white bg-gradient-to-br ${myResultsData.myRecord.status === 'Pass' ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'}`}>
                      <p className="text-sm uppercase mb-1">Result Status</p>
                      <span className="text-4xl font-black uppercase tracking-widest">{myResultsData.myRecord.status}</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">Subject-wise Scorecard</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: 'Aptitude', val: myResultsData.myRecord.aptitude },
                          { label: 'CPP', val: myResultsData.myRecord.cpp },
                          { label: 'Java OOP', val: myResultsData.myRecord.oopJava },
                          { label: 'Java ADS', val: myResultsData.myRecord.adsJava },
                          { label: 'WPT', val: myResultsData.myRecord.wpt },
                          { label: 'DBT', val: myResultsData.myRecord.dbt },
                          { label: '.NET', val: myResultsData.myRecord.dotnet },
                          { label: 'OS / SDM', val: myResultsData.myRecord.osSdm },
                          { label: 'WBJ', val: myResultsData.myRecord.wbj },
                        ].map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border dark:border-gray-700">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{s.label}</span>
                            <div className="flex items-center gap-2 font-bold"><span className="text-blue-600 dark:text-blue-400">{s.val}</span><span className="text-xs text-gray-400">/ 40</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 pt-8 border-t dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                          <p className="text-sm text-gray-500 mb-1">Aggregate Total</p>
                          <p className="text-3xl font-black text-gray-800 dark:text-white">{myResultsData.myRecord.total} <span className="text-lg font-normal text-gray-400">/ 360</span></p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center bg-gray-100 dark:bg-gray-700 px-6 py-3 rounded-xl"><p className="text-[10px] font-bold text-gray-500 uppercase">PRN</p><p className="font-mono font-bold dark:text-white">{myResultsData.myRecord.prn}</p></div>
                          <div className="text-center bg-gray-100 dark:bg-gray-700 px-6 py-3 rounded-xl"><p className="text-[10px] font-bold text-gray-500 uppercase">Name</p><p className="font-bold dark:text-white uppercase text-sm">{myResultsData.myRecord.name}</p></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow border dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">Student Profile</h2>
              {profileMsg && (
                <div className={`mb-6 p-4 rounded font-medium ${profileMsg.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {profileMsg}
                </div>
              )}
              <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enrollment No</label>
                    <input value={profileData.enrollmentNo} onChange={(e) => setProfileData({...profileData, enrollmentNo: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Course Name</label>
                    <input value={profileData.courseName} onChange={(e) => setProfileData({...profileData, courseName: e.target.value})} className="w-full border dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 dark:text-white" required />
                  </div>
                </div>
                <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition mt-4 shadow-md">Update Profile</button>
              </form>
              <FingerprintRegistration />
              <PasswordUpdate />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
