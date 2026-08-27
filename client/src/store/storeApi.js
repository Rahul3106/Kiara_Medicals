import axios from 'axios';

const storeApi = axios.create({
  baseURL: '/api/store',
  withCredentials: true, // Automatically sends and receives HttpOnly cookies
});

storeApi.interceptors.request.use((config) => {
  const branch = localStorage.getItem('km_branch');
  if (branch) {
    try {
      const parsed = JSON.parse(branch);
      if (parsed?.id) {
        config.headers['x-branch-id'] = parsed.id;
      }
    } catch (e) {
      console.error('Failed to parse active branch', e);
    }
  }
  return config;
});

export default storeApi;
