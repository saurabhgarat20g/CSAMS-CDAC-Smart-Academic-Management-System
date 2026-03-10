import api from './api';

const getAllStudents = (page = 0, size = 10, search = '') => {
    return api.get(`/admin/students?page=${page}&size=${size}&search=${search}`);
};

const getAllFaculty = (page = 0, size = 10, search = '') => {
    return api.get(`/admin/faculty?page=${page}&size=${size}&search=${search}`);
};

const getAllSessions = () => {
    return api.get('/admin/sessions');
};

const getAttendanceForSession = (sessionId) => {
    return api.get(`/admin/attendance/${sessionId}`);
};

const deleteUser = (userId) => {
    return api.delete(`/admin/users/${userId}`);
};

const deleteSession = (sessionId) => {
    return api.delete(`/admin/sessions/${sessionId}`);
};

const getAllLeaves = () => {
    return api.get('/admin/leaves');
};

const updateLeaveStatus = (id, status) => {
    return api.put(`/admin/leaves/${id}/status?status=${status}`);
};

const getLocationSettings = () => {
    return api.get('/admin/location');
};

const updateLocationSettings = (data) => {
    return api.post('/admin/location', data);
};

const bulkUploadStudents = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/students/bulk-upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const bulkUploadAcademicData = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/academic/bulk-upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const getScoreboard = (role) => {
    return api.get(`/${role}/academic/scoreboard`);
};

const deleteUsersBulk = (userIds) => {
    return api.post('/admin/users/bulk-delete', userIds);
};

const deleteAcademicRecord = (id) => {
    return api.delete(`/admin/academic/${id}`);
};

const clearScoreboard = () => {
    return api.delete('/admin/academic/clear');
};

export default {
    getAllStudents,
    getAllFaculty,
    getAllSessions,
    getAttendanceForSession,
    deleteUser,
    deleteUsersBulk,
    deleteSession,
    getAllLeaves,
    updateLeaveStatus,
    getLocationSettings,
    updateLocationSettings,
    bulkUploadStudents,
    bulkUploadAcademicData,
    getScoreboard,
    deleteAcademicRecord,
    clearScoreboard
};
