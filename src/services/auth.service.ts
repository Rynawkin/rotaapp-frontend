import { api } from './api';
import { LoginRequest, TokenModel } from '@/types/api.types';

export const authService = {
  async login(data: LoginRequest): Promise<TokenModel> {
    const response = await api.post<TokenModel>('/me/login', data);
    localStorage.setItem('token', response.data.bearerToken);
    localStorage.setItem('user', JSON.stringify(response.data.me));
    return response.data;
  },

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};