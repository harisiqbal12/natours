/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// Type is either password or data.
export const updateSetting = async (data, type) => {
    // console.log(name, email);
    try {
        const url = type === 'password' ? 'updateMyPassword' : 'updateMe';

        const res = await axios({
            method: 'PATCH',
            // withCredentials: false,
            url: `api/v1/users/${url}`,
            data,
        });

        console.log(res)
        if (res.data.status === 'success') {
            showAlert('success', `${type} updated successfully`);
        }

        // console.log(res);
    } catch (err) {
        console.log(err.response)
        showAlert('error', 'Failed to update user data');
    }
};
