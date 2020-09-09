/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm) => {
  console.log(name, email);
  try {
    const res = await axios({
      method: 'post',
      url: 'api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    console.log(res);

    if (res.data.status === 'success') {
      showAlert('success', 'Account Created Successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.data.message);
    console.log(err.response);
    // showAlert('error', err.response);
  }
};
