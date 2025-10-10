// frontend/src/services/auth.service.ts

import { api } from './api';

interface MeUserModel {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  workspaceId: number;
  workspaceName?: string;
  isAdmin: boolean;
  isDispatcher: boolean;
  isDriver: boolean;
  isSuperAdmin: boolean;
  isOnboarded: boolean;
  depotId?: number;
}

interface TokenResponse {
  bearerToken: string;
  refreshToken?: string;
  expiresIn?: string;
  me: MeUserModel;
}

export const authService = {
  async login(email: string, password: string): Promise<TokenResponse> {
    try {
      console.log('Login request:', { email });
      
      // Backend'in beklediği format
      const response = await api.post<TokenResponse>('/me/login', {
        Email: email,
        Password: password
      });
      
      console.log('Login response:', response.data);
      
      // Response kontrolü
      if (!response.data || !response.data.bearerToken || !response.data.me) {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      // Token ve user bilgilerini localStorage'a kaydet
      localStorage.setItem('token', response.data.bearerToken);
      localStorage.setItem('user', JSON.stringify(response.data.me));
      localStorage.setItem('isAuthenticated', 'true');

      // BUGFIX S5.5: Save refresh token
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // WorkspaceId'yi ayrıca sakla
      if (response.data.me.workspaceId) {
        localStorage.setItem('workspaceId', response.data.me.workspaceId.toString());
      }
      
      // Axios header'ı güncelle
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.bearerToken}`;
      
      console.log('Login successful, user:', response.data.me);
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response) {
        console.error('Server error:', error.response.data);
        const message = error.response.data?.message || 'Giriş başarısız';
        throw new Error(message);
      } else if (error.request) {
        console.error('No response:', error.request);
        throw new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        console.error('Error:', error.message);
        throw new Error(error.message || 'Giriş yapılırken bir hata oluştu');
      }
    }
  },

  async register(email: string, password: string, fullName: string, companyName?: string, companyEmail?: string, companyPhone?: string): Promise<TokenResponse> {
    try {
      console.log('Register request:', { email, fullName, companyName });
      
      const response = await api.post<TokenResponse>('/me/register', {
        Email: email,
        Password: password,
        FullName: fullName,
        CompanyName: companyName,
        CompanyEmail: companyEmail,
        CompanyPhone: companyPhone
      });
      
      console.log('Register response:', response.data);
      
      // Response kontrolü
      if (!response.data || !response.data.bearerToken || !response.data.me) {
        throw new Error('Geçersiz sunucu yanıtı');
      }
      
      // Token ve user bilgilerini localStorage'a kaydet
      localStorage.setItem('token', response.data.bearerToken);
      localStorage.setItem('user', JSON.stringify(response.data.me));
      localStorage.setItem('isAuthenticated', 'true');

      // BUGFIX S5.5: Save refresh token
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // WorkspaceId'yi ayrıca sakla
      if (response.data.me.workspaceId) {
        localStorage.setItem('workspaceId', response.data.me.workspaceId.toString());
      }
      
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

  async forgotPassword(email: string): Promise<void> {
    try {
      console.log('Forgot password request:', { email });
      
      await api.post('/me/forgot-password', { 
          Email: email  // ✅ Büyük E ile
      });
        
        console.log('Forgot password email sent successfully');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.response) {
          const message = error.response.data?.message || 'Şifre sıfırlama bağlantısı gönderilemedi';
          throw new Error(message);
      } else if (error.request) {
          throw new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
          throw new Error(error.message || 'Şifre sıfırlama işlemi sırasında bir hata oluştu');
      }
    }
},

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    try {
      console.log('Reset password request:', { email, token: '***' });
      
      await api.post('/me/reset-password', { 
        Email: email, 
        Token: token, 
        NewPassword: newPassword
      });
      
      console.log('Password reset successfully');
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.response) {
        const message = error.response.data?.message || 'Şifre sıfırlama başarısız';
        throw new Error(message);
      } else if (error.request) {
        throw new Error('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        throw new Error(error.message || 'Şifre sıfırlama işlemi sırasında bir hata oluştu');
      }
    }
  },

  logout() {
    console.log('Logging out...');

    // LocalStorage'ı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken'); // BUGFIX S5.5
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('workspaceId');

    // Axios header'ı temizle
    delete api.defaults.headers.common['Authorization'];

    // Ana sayfaya yönlendir
    window.location.href = '/login';
  },

  getUser(): MeUserModel | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const isAuth = localStorage.getItem('isAuthenticated');
    return !!(token && isAuth === 'true');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getWorkspaceId(): string | null {
    return localStorage.getItem('workspaceId');
  },

  // Rol kontrol helper'ları
  getUserRole(): string {
    const user = this.getUser();
    if (!user) return 'guest';
    
    if (user.isSuperAdmin) return 'superadmin';
    if (user.isAdmin) return 'admin';
    if (user.isDispatcher) return 'dispatcher';
    if (user.isDriver) return 'driver';
    return 'user';
  },

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.isSuperAdmin === true;
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.isAdmin === true || user?.isSuperAdmin === true;
  },

  isDispatcher(): boolean {
    const user = this.getUser();
    return user?.isDispatcher === true || user?.isAdmin === true || user?.isSuperAdmin === true;
  },

  isDriver(): boolean {
    const user = this.getUser();
    return user?.isDriver === true;
  },

  // BUGFIX S5.5: Refresh token mechanism
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      console.log('Attempting to refresh token...');
      const response = await api.post<TokenResponse>('/me/refresh-token', {
        RefreshToken: refreshToken
      });

      if (!response.data || !response.data.bearerToken || !response.data.me) {
        throw new Error('Invalid refresh response');
      }

      // Update tokens
      localStorage.setItem('token', response.data.bearerToken);
      localStorage.setItem('user', JSON.stringify(response.data.me));
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      // Update axios header
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.bearerToken}`;

      console.log('Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // Clear auth data on refresh failure
      this.logout();
      return false;
    }
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  // Get current user from backend (for token validation)
  async me(): Promise<MeUserModel> {
    try {
      const response = await api.get<MeUserModel>('/me');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch current user:', error);
      throw error;
    }
  },

  // Debug helper
  debugAuth() {
    console.log('=== Auth Debug Info ===');
    console.log('Token:', this.getToken());
    console.log('User:', this.getUser());
    console.log('Role:', this.getUserRole());
    console.log('WorkspaceId:', this.getWorkspaceId());
    console.log('Is Authenticated:', this.isAuthenticated());
    console.log('Is SuperAdmin:', this.isSuperAdmin());
    console.log('Is Admin:', this.isAdmin());
    console.log('Is Dispatcher:', this.isDispatcher());
    console.log('Is Driver:', this.isDriver());
    console.log('LocalStorage:', {
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
      workspaceId: localStorage.getItem('workspaceId'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
    console.log('Axios Headers:', api.defaults.headers.common);
    console.log('=====================');
  }
};