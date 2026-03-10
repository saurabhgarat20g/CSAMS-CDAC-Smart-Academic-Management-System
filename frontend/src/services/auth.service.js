import api from './api';

const login = (email, password) => {
  return api
    .post('/auth/signin', {
      email,
      password,
    })
    .then((response) => {
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const register = (data) => {
    return api.post('/admin/register', data);
};

export default {
  login,
  logout,
  getCurrentUser,
  register
};
