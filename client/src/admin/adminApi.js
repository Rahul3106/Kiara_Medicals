import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api/admin',
  withCredentials: true, // Automatically sends and receives HttpOnly cookies
});

export default adminApi;
