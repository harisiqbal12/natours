/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  console.log(email, password);
  try {
    console.log('trying');
    const res = await axios({
      method: 'post',
      // withCredentials: false,
      // xsrfCookieName: 'jwt',
      // httpAgent: new http.Agent({ keepAlive: true }),
      // headers: { 'X-Requested-With': 'XMLHttpRequest' },
      // httpAgent: true,
      url: 'api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    // console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
    // alert('Invalid Email or Password');
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      showAlert('success', 'loggedout');
      window.setTimeout(() => {
        location.assign('/');
      }, 400);
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out try again');
  }
};
