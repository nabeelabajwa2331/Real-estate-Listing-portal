import axios from 'axios';
import { API_URL } from '../config/api.js';
import { attachColdStartHandling } from './coldStart.js';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // send the login cookie with every request
});

attachColdStartHandling(api);

export const errorMessage = (err) =>
  err?.response?.data?.message || 'Something went wrong. Please try again.';

export default api;
