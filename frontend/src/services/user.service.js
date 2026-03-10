import api from './api';

const updatePassword = (oldPassword, newPassword) => {
    return api.post('/user/update-password', {
        oldPassword,
        newPassword
    });
};

export default {
    updatePassword
};
