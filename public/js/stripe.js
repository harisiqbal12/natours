/* eslint-disable */

import axios from 'axios';
import showAlert from './alerts';
const stripe = Stripe(
  'pk_test_51HPAOMI8gvobKYpwVq6dgeO8HI15Odw5Pin43XIJbV7aIA5yEcb7kkTUcPNH4JD4JLGqJESLgXcyFVMwehpTqB8O00o3dyWeKd',
);

export const bookTour = async tourId => {
  try {
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`,
    );

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });

    console.log(session);
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error occured during payments processing.');
  }
};
