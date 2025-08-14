import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';

console.log('API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - token'ı her istekte gönder
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'exists' : 'missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization?.substring(0, 20) + '...');
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    console.log('Request headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    
    // Backend'den gelen HTML response'u kontrol et (Login redirect)
    if (error.response?.status === 404 && 
        typeof error.response?.data === 'string' && 
        error.response.data.includes('Login')) {
      console.error('Backend is redirecting to login page - authentication issue');
      
      // Token'ı kontrol et
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, redirecting to login');
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);