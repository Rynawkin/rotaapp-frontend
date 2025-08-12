import { api } from './api';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
}

interface TokenResponse {
  bearerToken: string;
  me: {
    id: string;
    email: string;
    name: string;
    role: string;
    workspaceId?: string;
    workspaceName?: string;
    isSuperAdmin: boolean;
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    try {
      console.log('Login request:', data);
      
      const response = await api.post<TokenResponse>('/me/login', data);
      
      console.log('Login response:', response.data);
      
      // Response kontrolü
      if (!response.data || !response.data.bearerToken || !response.data.me) {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      // Token ve user bilgilerini localStorage'a kaydet
      localStorage.setItem('token', response.data.bearerToken);
      localStorage.setItem('user', JSON.stringify(response.data.me));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Axios header'ı güncelle
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.bearerToken}`;
      
      console.log('Login successful, user:', response.data.me);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Detaylı error handling
      if (error.response) {
        // Server hatası
        console.error('Server error:', error.response.data);
        const message = error.response.data?.message || 'Giriş başarısız';
        throw new Error(message);
      } else if (error.request) {
        // Request gitti ama response gelmedi
        console.error('No response:', error.request);
        throw new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        // Başka bir hata
        console.error('Error:', error.message);
        throw new Error(error.message || 'Giriş yapılırken bir hata oluştu');
      }
    }
  },

  async register(data: RegisterRequest): Promise<TokenResponse> {
    try {
      console.log('Register request:', data);
      
      const response = await api.post<TokenResponse>('/me/register', data);
      
      console.log('Register response:', response.data);
      
      // Response kontrolü
      if (!response.data || !response.data.bearerToken || !response.data.me) {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      // Token ve user bilgilerini localStorage'a kaydet
      localStorage.setItem('token', response.data.bearerToken);
      localStorage.setItem('user', JSON.stringify(response.data.me));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Axios header'ı güncelle
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.bearerToken}`;
      
      console.log('Register successful, user:', response.data.me);
      
      return response.data;
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.response) {
        console.error('Server error:', error.response.data);
        const message = error.response.data?.message || 'Kayıt başarısız';
        throw new Error(message);
      } else if (error.request) {
        console.error('No response:', error.request);
        throw new Error('Sunucuya bağlanılamıyor');
      } else {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Kayıt olurken bir hata oluştu');
      }
    }
  },

  logout() {
    console.log('Logging out...');
    
    // LocalStorage'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Axios header'ı temizle
    delete api.defaults.headers.common['Authorization'];
    
    // Ana sayfaya yönlendir
    window.location.href = '/login';
  },

  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    const isAuth = localStorage.getItem('isAuthenticated');
    return !!(token && isAuth === 'true');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  // Debug helper
  debugAuth() {
    console.log('=== Auth Debug Info ===');
    console.log('Token:', this.getToken());
    console.log('User:', this.getUser());
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('LocalStorage:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
    console.log('=====================');
  }
};