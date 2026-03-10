import api from './api';

const getProfile = () => {
    return api.get('/student/profile');
};

const updateProfile = (data) => {
    return api.put('/student/profile', data);
};

const markAttendance = (token, lat, lng) => {
    const hasLocation = lat !== undefined && lat !== null && lng !== undefined && lng !== null;
    let url = `/student/attendance/mark?token=${token}`;
    if (hasLocation) {
        url += `&lat=${lat}&lng=${lng}`;
    }
    return api.post(url);
};

const applyLeave = (data) => {
    return api.post('/student/leave/apply', data);
};

const getMyLeaves = () => {
    return api.get('/student/leave/history');
};

const getScoreboard = () => {
    return api.get('/student/scoreboard');
};

export default {
    getProfile,
    updateProfile,
    markAttendance,
    applyLeave,
    getMyLeaves,
    getScoreboard
};
