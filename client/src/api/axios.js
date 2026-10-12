import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send the login cookie with every request
});

// Turns any failed request into a readable message for forms to display
export const errorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
