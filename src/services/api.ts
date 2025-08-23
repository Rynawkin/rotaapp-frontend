import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5055/api';

console.log('API URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Sayfa yüklendiğinde token varsa header'a ekle
const initialToken = localStorage.getItem('token');
if (initialToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
  console.log('Initial token loaded from localStorage');
}

// Request interceptor - token'ı her istekte gönder
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'exists' : 'missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization?.substring(0, 20) + '...');
    }
    
    // WorkspaceId'yi de kontrol et (debug için)
    const workspaceId = localStorage.getItem('workspaceId');
    if (workspaceId) {
      console.log('WorkspaceId in localStorage:', workspaceId);
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
    
    // Backend'den gelen "Workspace is not found" hatası kontrolü
    if (error.response?.status === 404 && 
        error.response?.data?.message === 'Workspace is not found.') {
      console.error('Workspace not found - possible token/workspace mismatch');
      
      // Login sayfasında değilsek ve bu hata login isteğinden gelmiyorsa
      if (!window.location.pathname.includes('/login') && 
          !error.config?.url?.includes('/me/login')) {
        
        const token = localStorage.getItem('token');
        const workspaceId = localStorage.getItem('workspaceId');
        const user = localStorage.getItem('user');
        
        console.log('Debug - Token exists:', !!token);
        console.log('Debug - WorkspaceId:', workspaceId);
        console.log('Debug - User:', user);
        
        // Token varsa ama workspace bulunamıyorsa, token eski olabilir
        console.error('Token exists but workspace not found - clearing auth and redirecting to login');
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    
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
    
    // 401 Unauthorized - token geçersiz veya süresi dolmuş
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing auth data');
      localStorage.clear();
      delete api.defaults.headers.common['Authorization'];
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Debug helper function
export const debugApiAuth = () => {
  console.log('=== API Auth Debug ===');
  console.log('Token:', localStorage.getItem('token')?.substring(0, 50) + '...');
  console.log('WorkspaceId:', localStorage.getItem('workspaceId'));
  console.log('User:', localStorage.getItem('user'));
  console.log('API Headers:', api.defaults.headers.common);
  console.log('====================');
};