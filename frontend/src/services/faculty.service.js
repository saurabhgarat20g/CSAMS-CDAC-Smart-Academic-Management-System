import api from './api';

const generateQr = (subjectId, durationMinutes) => {
    return api.post(`/faculty/qr/generate?subjectId=${subjectId}&durationMinutes=${durationMinutes}`);
};

const getMySessions = () => {
    return api.get('/faculty/sessions');
};

const getSessionAttendance = (sessionId) => {
    return api.get(`/faculty/sessions/${sessionId}/attendance`);
};

const getProfile = () => {
    return api.get('/faculty/profile');
};

const updateProfile = (data) => {
    return api.put('/faculty/profile', data);
};

const getScoreboard = () => {
    return api.get('/faculty/scoreboard');
};

export default {
    generateQr,
    getMySessions,
    getSessionAttendance,
    getProfile,
    updateProfile,
    getScoreboard
};
