import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt with:', { email, password: '***' });
      await login(email, password);
      console.log('Login successful, redirecting...');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  useEffect(() => {
    console.log('=== Login Page Mounted ===');
    console.log('Current localStorage:', {
      token: localStorage.getItem('token') ? 'exists' : 'empty',
      user: localStorage.getItem('user') ? 'exists' : 'empty',
      workspaceId: localStorage.getItem('workspaceId')
    });
    console.log('========================');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/yolpilot-logo.png" 
            alt="YolPilot" 
            className="h-20 w-auto"
          />
        </div>
        
        {/* Başlık */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          YolPilot'a Hoş Geldiniz
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Devam etmek için giriş yapın
        </p>

        {/* Hata Mesajı */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="ornek@email.com"
              />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Beni Hatırla ve Şifremi Unuttum */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Beni hatırla
              </label>
            </div>

            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Şifremi unuttum
              </Link>
            </div>
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Giriş yapılıyor...
              </div>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        {/* Kayıt Ol Linki */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Hemen kayıt olun
            </Link>
          </p>
        </div>

        {/* Test Kullanıcıları (Development için) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">Test Kullanıcıları (Dev)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('super@yolpilot.com', 'super123')}
                className="text-xs bg-purple-50 text-purple-700 px-2 py-1.5 rounded hover:bg-purple-100 transition-colors"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin@yolpilot.com', 'admin123')}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1.5 rounded hover:bg-blue-100 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('manager@yolpilot.com', 'manager123')}
                className="text-xs bg-green-50 text-green-700 px-2 py-1.5 rounded hover:bg-green-100 transition-colors"
              >
                Dispatcher
              </button>
              <button
                type="button"
                onClick={() => quickLogin('driver@yolpilot.com', 'driver123')}
                className="text-xs bg-orange-50 text-orange-700 px-2 py-1.5 rounded hover:bg-orange-100 transition-colors"
              >
                Driver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;