// src/pages/Signup.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, Mail, Lock, Phone, User, Loader2, 
  AlertCircle, CheckCircle, ArrowRight, Truck, Info, X
} from 'lucide-react';
import { authService } from '@/services/auth.service';

interface SignupForm {
  // Workspace bilgileri
  workspaceName: string;
  workspaceEmail: string;
  workspacePhone: string;
  
  // Admin kullanıcı bilgileri
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Plan seçimi
  plan: 'trial' | 'starter' | 'growth' | 'professional' | 'business';
  
  // Sözleşmeler
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [formData, setFormData] = useState<SignupForm>({
    workspaceName: '',
    workspaceEmail: '',
    workspacePhone: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    plan: 'trial',
    termsAccepted: false,
    privacyAccepted: false
  });

  const plans = [
    {
      id: 'trial',
      name: 'Deneme',
      price: '0₺',
      period: '14 gün',
      features: ['2 Sürücü', '1 Araç', '100 Durak/Ay', '25 WhatsApp Mesajı', 'Rota Şablonları'],
      popular: false
    },
    {
      id: 'starter',
      name: 'Başlangıç',
      price: '850₺',
      period: '/ay',
      features: ['3 Sürücü', '3 Araç', '500 Durak/Ay', 'Temel Özellikler'],
      popular: false
    },
    {
      id: 'growth',
      name: 'Büyüme',
      price: '1.250₺',
      period: '/ay',
      features: ['Sınırsız Sürücü', 'Sınırsız Araç', '500 Durak/Ay', '100 WhatsApp', 'Zaman Pencereleri'],
      popular: true
    },
    {
      id: 'professional',
      name: 'Profesyonel',
      price: '2.400₺',
      period: '/ay',
      features: ['Sınırsız Sürücü/Araç', '2.000 Durak/Ay', 'Müşteri Memnuniyeti Raporu'],
      popular: false
    },
    {
      id: 'business',
      name: 'İşletme',
      price: '5.900₺',
      period: '/ay',
      features: ['Sınırsız Her Şey', '5.000 Durak/Ay', '500 WhatsApp', 'Özel Raporlar', 'API Erişimi'],
      popular: false
    }
  ];

  // Şifre validation fonksiyonu
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('En az 6 karakter olmalı');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('En az 1 büyük harf içermeli');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('En az 1 küçük harf içermeli');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('En az 1 rakam içermeli');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('En az 1 özel karakter içermeli (!@#$% vb.)');
    }
    
    return errors;
  };

  // Email validation fonksiyonu
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Türkiye telefon validation fonksiyonu
  const validatePhone = (phone: string): boolean => {
    // Sadece rakam, boşluk, tire, parantez, + işareti kabul et
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone)) return false;
    
    // Rakamları çıkar
    const numbersOnly = phone.replace(/[^\d]/g, '');
    
    // Türkiye telefon formatları:
    // 5xxxxxxxxx (10 rakam)
    // 905xxxxxxxxx (12 rakam, +90 ile)
    // 05xxxxxxxxx (11 rakam)
    if (numbersOnly.length === 10 && numbersOnly.startsWith('5')) {
      return true; // 5xx xxx xx xx
    }
    if (numbersOnly.length === 11 && numbersOnly.startsWith('05')) {
      return true; // 05xx xxx xx xx
    }
    if (numbersOnly.length === 12 && numbersOnly.startsWith('905')) {
      return true; // +90 5xx xxx xx xx
    }
    
    return false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Şifre değiştiğinde validation yap
    if (name === 'adminPassword') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (stepNum: number): boolean => {
    switch(stepNum) {
      case 1:
        return !!(
          formData.workspaceName && 
          formData.workspaceEmail && 
          validateEmail(formData.workspaceEmail) &&
          formData.workspacePhone && 
          validatePhone(formData.workspacePhone)
        );
      case 2:
        const passwordValidation = validatePassword(formData.adminPassword);
        return !!(
          formData.adminFullName && 
          formData.adminEmail && 
          validateEmail(formData.adminEmail) &&
          formData.adminPassword && 
          passwordValidation.length === 0 &&
          formData.adminPasswordConfirm &&
          formData.adminPassword === formData.adminPasswordConfirm
        );
      case 3:
        return formData.termsAccepted && formData.privacyAccepted;
      default:
        return false;
    }
  };

  // Modal handler functions
  const handleTermsAccept = () => {
    setFormData(prev => ({ ...prev, termsAccepted: true }));
    setShowTermsModal(false);
  };

  const handlePrivacyAccept = () => {
    setFormData(prev => ({ ...prev, privacyAccepted: true }));
    setShowPrivacyModal(false);
  };

  // ESC key handler for modals
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTermsModal(false);
        setShowPrivacyModal(false);
      }
    };

    if (showTermsModal || showPrivacyModal) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [showTermsModal, showPrivacyModal]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Gerçek API çağrısı - tüm firma bilgilerini gönder
      const response = await authService.register(
        formData.adminEmail,
        formData.adminPassword,
        formData.adminFullName,
        formData.workspaceName,
        formData.workspaceEmail,
        formData.workspacePhone
      );
      
      console.log('Register successful:', response);
      
      // Token ve user bilgileri authService.register içinde zaten localStorage'a kaydedildi
      // Başarılı kayıt sonrası direkt dashboard'a yönlendir (login sayfasına değil!)
      window.location.href = '/dashboard';
      
    } catch (err: any) {
      console.error('Register error:', err);
      
      // API interceptor'dan gelen kullanıcı dostu mesajı kullan
      let errorMessage = err.userFriendlyMessage || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      
      // Fallback: eski error handling mantığı
      if (!err.userFriendlyMessage) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join(', ');
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img 
                src="/yolpilot-logo.png" 
                alt="YolPilot" 
                className="h-10 w-auto"
              />
            </Link>
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Zaten hesabınız var mı? <span className="text-blue-600">Giriş yapın</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step > i ? <CheckCircle className="w-5 h-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-24 lg:w-32 h-1 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Firma Bilgileri</span>
            <span className="text-xs text-gray-600">Yönetici Hesabı</span>
            <span className="text-xs text-gray-600">Plan Seçimi</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Firma Bilgileri */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Firma Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma Adı *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="workspaceName"
                      value={formData.workspaceName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn: ABC Lojistik"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma E-posta *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="workspaceEmail"
                      value={formData.workspaceEmail}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.workspaceEmail && !validateEmail(formData.workspaceEmail) 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="info@firma.com"
                    />
                  </div>
                  {formData.workspaceEmail && !validateEmail(formData.workspaceEmail) && (
                    <p className="text-xs text-red-600 mt-1">Geçerli bir email adresi giriniz</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma Telefon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="workspacePhone"
                      value={formData.workspacePhone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.workspacePhone && !validatePhone(formData.workspacePhone) 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="0532 123 45 67"
                    />
                  </div>
                  {formData.workspacePhone && !validatePhone(formData.workspacePhone) && (
                    <p className="text-xs text-red-600 mt-1">Geçerli bir Türkiye telefon numarası giriniz (örn: 0532 123 45 67)</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Yönetici Hesabı */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Yönetici Hesabı</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="adminFullName"
                      value={formData.adminFullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.adminEmail && !validateEmail(formData.adminEmail) 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="admin@firma.com"
                    />
                  </div>
                  {formData.adminEmail && !validateEmail(formData.adminEmail) && (
                    <p className="text-xs text-red-600 mt-1">Geçerli bir email adresi giriniz</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.adminPassword && passwordErrors.length > 0 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {/* Şifre kuralları */}
                  {formData.adminPassword && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs space-y-1">
                          <p className="font-medium text-gray-700 mb-1">Şifre gereksinimleri:</p>
                          <div className={`flex items-center ${formData.adminPassword.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                            {formData.adminPassword.length >= 6 ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <div className="w-3 h-3 mr-1 border border-gray-400 rounded-full" />
                            }
                            En az 6 karakter
                          </div>
                          <div className={`flex items-center ${/[A-Z]/.test(formData.adminPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[A-Z]/.test(formData.adminPassword) ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <div className="w-3 h-3 mr-1 border border-gray-400 rounded-full" />
                            }
                            En az 1 büyük harf
                          </div>
                          <div className={`flex items-center ${/[a-z]/.test(formData.adminPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[a-z]/.test(formData.adminPassword) ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <div className="w-3 h-3 mr-1 border border-gray-400 rounded-full" />
                            }
                            En az 1 küçük harf
                          </div>
                          <div className={`flex items-center ${/[0-9]/.test(formData.adminPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[0-9]/.test(formData.adminPassword) ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <div className="w-3 h-3 mr-1 border border-gray-400 rounded-full" />
                            }
                            En az 1 rakam
                          </div>
                          <div className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.adminPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.adminPassword) ? 
                              <CheckCircle className="w-3 h-3 mr-1" /> : 
                              <div className="w-3 h-3 mr-1 border border-gray-400 rounded-full" />
                            }
                            En az 1 özel karakter (!@#$% vb.)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre Tekrar *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      name="adminPasswordConfirm"
                      value={formData.adminPasswordConfirm}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.adminPasswordConfirm && formData.adminPassword !== formData.adminPasswordConfirm 
                          ? 'border-red-500' 
                          : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {formData.adminPasswordConfirm && formData.adminPassword !== formData.adminPasswordConfirm && (
                    <p className="text-xs text-red-600 mt-1">Şifreler eşleşmiyor!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan Seçimi */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Seçimi</h2>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.id as any }))}
                    className={`
                      relative border-2 rounded-xl p-6 cursor-pointer transition-all
                      ${formData.plan === plan.id 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                        Popüler
                      </span>
                    )}
                    <h3 className="font-bold text-lg mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded mt-0.5"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Kullanım koşullarını
                    </button> okudum ve kabul ediyorum.
                  </span>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="privacyAccepted"
                    checked={formData.privacyAccepted}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded mt-0.5"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    <button 
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Gizlilik politikasını
                    </button> okudum ve kabul ediyorum.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Geri
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!validateStep(step)}
                className={`
                  px-6 py-2 rounded-lg font-medium flex items-center ml-auto
                  ${validateStep(step)
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                İleri
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !validateStep(3)}
                className={`
                  px-6 py-2 rounded-lg font-medium flex items-center ml-auto
                  ${validateStep(3) && !loading
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Hesap oluşturuluyor...
                  </>
                ) : (
                  <>
                    Hesabı Oluştur
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl max-h-[80vh] w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Kullanım Koşulları</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-4 text-gray-700">
                <h4 className="font-semibold">1. Hizmet Tanımı</h4>
                <p>
                  RotaApp, araç rota planlaması ve yönetimi hizmeti sunan bir yazılım platformudur. 
                  Bu platform üzerinden araç rotalarınızı optimize edebilir, sürücülerinizi takip edebilir 
                  ve müşterilerinize daha iyi hizmet verebilirsiniz.
                </p>
                
                <h4 className="font-semibold">2. Kullanım Şartları</h4>
                <p>
                  Bu hizmeti kullanarak, yasal düzenlemelere uygun hareket etmeyi ve platformu 
                  sadece meşru amaçlar için kullanmayı kabul etmektesiniz. Hizmetin kötüye kullanılması 
                  durumunda hesabınız askıya alınabilir veya kapatılabilir.
                </p>
                
                <h4 className="font-semibold">3. Veri Sorumluluğu</h4>
                <p>
                  Sisteme girdiğiniz veriler sizin sorumluluğunuzdadır. Müşteri bilgileri, araç bilgileri 
                  ve diğer operasyonel verilerin doğruluğu ve güncelliği size aittir.
                </p>
                
                <h4 className="font-semibold">4. Fiyatlandırma ve Ödemeler</h4>
                <p>
                  Abonelik ücretleri seçtiğiniz pakete göre belirlenir. Ödemeler aylık olarak tahsil edilir. 
                  Fiyat değişiklikleri önceden bildirilir.
                </p>
                
                <h4 className="font-semibold">5. Hizmet Kesintileri</h4>
                <p>
                  Bakım ve güncellemeler nedeniyle kısa süreli hizmet kesintileri yaşanabilir. 
                  Bu durumlar önceden duyurulmaya çalışılır.
                </p>
                
                <h4 className="font-semibold">6. Sorumluluk Sınırlaması</h4>
                <p>
                  RotaApp, hizmet kullanımından kaynaklanan dolaylı zararlardan sorumlu değildir. 
                  Kullanıcılar hizmeti kendi risk ve sorumluluklarında kullanır.
                </p>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={handleTermsAccept}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Okudum ve Kabul Ediyorum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPrivacyModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl max-h-[80vh] w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Gizlilik Politikası</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="space-y-4 text-gray-700">
                <h4 className="font-semibold">1. Toplanan Bilgiler</h4>
                <p>
                  RotaApp olarak, hizmetimizi sunabilmek için gerekli olan kişisel verileri topluyoruz. 
                  Bu veriler arasında firma bilgileri, iletişim bilgileri, araç bilgileri ve rota verileri bulunur.
                </p>
                
                <h4 className="font-semibold">2. Verilerin Kullanımı</h4>
                <p>
                  Toplanan veriler sadece hizmet sunumu, müşteri desteği ve yasal yükümlülüklerin 
                  yerine getirilmesi amacıyla kullanılır. Verileriniz üçüncü şahıslarla paylaşılmaz.
                </p>
                
                <h4 className="font-semibold">3. Veri Güvenliği</h4>
                <p>
                  Verilerinizin güvenliği için endüstri standardı güvenlik önlemleri alınmıştır. 
                  SSL şifreleme, güvenli veri merkezleri ve düzenli güvenlik denetimleri yapılmaktadır.
                </p>
                
                <h4 className="font-semibold">4. Çerez Politikası</h4>
                <p>
                  Platformumuz, kullanıcı deneyimini iyileştirmek için çerezler kullanır. 
                  Bu çerezler oturum yönetimi ve tercih saklama amaçlıdır.
                </p>
                
                <h4 className="font-semibold">5. Veri Saklama Süresi</h4>
                <p>
                  Verileriniz, hizmet sunumu için gerekli olduğu sürece saklanır. 
                  Hesap kapatma durumunda veriler yasal saklama süreleri dikkate alınarak silinir.
                </p>
                
                <h4 className="font-semibold">6. Kullanıcı Hakları</h4>
                <p>
                  KVKK kapsamında verilerinize erişim, düzeltme, silme ve işleme itiraz hakınız bulunur. 
                  Bu haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
                </p>
                
                <h4 className="font-semibold">7. İletişim</h4>
                <p>
                  Gizlilik politikası ile ilgili sorularınız için info@rotaapp.com adresinden 
                  bizimle iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={handlePrivacyAccept}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Okudum ve Kabul Ediyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;