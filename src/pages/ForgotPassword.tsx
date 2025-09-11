// frontend/src/pages/ForgotPassword.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Gönderildi!
            </h2>
            <p className="text-gray-600 mb-6">
              Şifre sıfırlama linki <strong>{email}</strong> adresine gönderildi.
              Lütfen email kutunuzu kontrol edin.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Email gelmezse spam klasörünü kontrol edin.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YolPilot
            </h1>
            <p className="text-gray-600 mt-2">Şifrenizi mi unuttunuz?</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Adresiniz
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Kayıtlı email adresinize şifre sıfırlama linki göndereceğiz.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Şifre Sıfırlama Linki Gönder'
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="inline w-4 h-4 mr-1" />
                Giriş sayfasına dön
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;