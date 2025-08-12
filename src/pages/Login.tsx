import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, Truck } from 'lucide-react';
import { authService } from '../services/auth.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login attempt with:', { email, password: '***' });
      
      // Gerçek API çağrısı
      const response = await authService.login({ email, password });
      
      console.log('Login response received:', response);
      
      // Başarılı giriş - role'e göre yönlendirme
      if (response.me.isSuperAdmin) {
        console.log('Redirecting to super-admin...');
        navigate('/super-admin');
      } else {
        console.log('Redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error caught:', err);
      // Hata mesajını göster
      setError(err.message || 'Giriş yapılırken bir hata oluştu');
      setLoading(false);
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = (type: 'super' | 'admin' | 'manager' | 'driver') => {
    switch(type) {
      case 'super':
        setEmail('super@rotaapp.com');
        setPassword('super123');
        break;
      case 'admin':
        setEmail('admin@rotaapp.com');
        setPassword('admin123');
        break;
      case 'manager':
        setEmail('manager@rotaapp.com');
        setPassword('manager123');
        break;
      case 'driver':
        setEmail('driver@rotaapp.com');
        setPassword('driver123');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">RotaApp</h1>
          <p className="text-gray-600 mt-2">Rota Optimizasyon Platformu</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Giriş Yap</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Şifremi unuttum
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Hesabınız yok mu? </span>
            <Link to="/signup" className="text-sm text-blue-600 hover:underline">
              Ücretsiz kayıt olun
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Demo Hesaplar:</p>
              
              <div className="space-y-2">
                {/* Super Admin */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-700">Super Admin (SaaS Yönetici)</p>
                    <p className="text-xs text-gray-600">super@rotaapp.com / super123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('super')}
                    className="text-xs text-purple-600 hover:underline"
                    disabled={loading}
                  >
                    Doldur
                  </button>
                </div>

                {/* Firma Admin */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700">Firma Yöneticisi</p>
                    <p className="text-xs text-gray-600">admin@rotaapp.com / admin123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('admin')}
                    className="text-xs text-blue-600 hover:underline"
                    disabled={loading}
                  >
                    Doldur
                  </button>
                </div>

                {/* Manager */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700">Operasyon Müdürü</p>
                    <p className="text-xs text-gray-600">manager@rotaapp.com / manager123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('manager')}
                    className="text-xs text-green-600 hover:underline"
                    disabled={loading}
                  >
                    Doldur
                  </button>
                </div>

                {/* Driver */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-700">Sürücü</p>
                    <p className="text-xs text-gray-600">driver@rotaapp.com / driver123</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials('driver')}
                    className="text-xs text-orange-600 hover:underline"
                    disabled={loading}
                  >
                    Doldur
                  </button>
                </div>
              </div>

              {/* API Status */}
              <div className="mt-3 pt-3 border-t border-blue-100">
                <div className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-gray-600">
                    API: {loading ? 'Bağlanıyor...' : 'http://localhost:5055'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          © 2024 RotaApp. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
};

export default Login;