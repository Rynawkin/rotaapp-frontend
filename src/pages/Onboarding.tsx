// src/pages/Onboarding.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Warehouse, MapPin, Clock, CheckCircle, 
  ArrowRight, Loader2, Plus, X, Settings
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [depot, setDepot] = useState({
    name: '',
    address: '',
    latitude: 40.9869,
    longitude: 29.0252,
    workingHours: {
      start: '08:00',
      end: '18:00'
    }
  });

  const [settings, setSettings] = useState({
    distanceUnit: 'km',
    currency: 'TRY',
    timeZone: 'Europe/Istanbul',
    language: 'TR',
    defaultServiceTime: 15
  });

  const handleComplete = async () => {
    setLoading(true);
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Depot'u kaydet
    localStorage.setItem('defaultDepot', JSON.stringify(depot));
    localStorage.setItem('workspaceSettings', JSON.stringify(settings));
    
    // Dashboard'a yönlendir
    navigate('/dashboard');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= i ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}
                `}>
                  {step > i ? <CheckCircle className="w-6 h-6" /> : i}
                </div>
                {i < 3 && (
                  <div className={`w-full h-1 ${step > i ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Ana Depo */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Warehouse className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Ana Deponuzu Tanımlayın</h2>
                <p className="text-gray-600 mt-2">Teslimatlarınızın başlayacağı merkez konumu belirleyin</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Depo Adı
                  </label>
                  <input
                    type="text"
                    value={depot.name}
                    onChange={(e) => setDepot({...depot, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Ana Depo - Kadıköy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={depot.address}
                      onChange={(e) => setDepot({...depot, address: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Depo adresi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Başlangıç Saati
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={depot.workingHours.start}
                        onChange={(e) => setDepot({
                          ...depot, 
                          workingHours: {...depot.workingHours, start: e.target.value}
                        })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bitiş Saati
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        value={depot.workingHours.end}
                        onChange={(e) => setDepot({
                          ...depot, 
                          workingHours: {...depot.workingHours, end: e.target.value}
                        })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Temel Ayarlar */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Temel Ayarları Yapılandırın</h2>
                <p className="text-gray-600 mt-2">Sistemi ihtiyaçlarınıza göre özelleştirin</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mesafe Birimi
                    </label>
                    <select
                      value={settings.distanceUnit}
                      onChange={(e) => setSettings({...settings, distanceUnit: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="km">Kilometre (km)</option>
                      <option value="mi">Mil (mi)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">Dolar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zaman Dilimi
                    </label>
                    <select
                      value={settings.timeZone}
                      onChange={(e) => setSettings({...settings, timeZone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                      <option value="Europe/London">Londra (GMT+0)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dil
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({...settings, language: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TR">Türkçe</option>
                      <option value="EN">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Varsayılan Servis Süresi (dakika)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultServiceTime}
                    onChange={(e) => setSettings({...settings, defaultServiceTime: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Her teslimat noktasında geçirilecek ortalama süre</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Tamamlandı */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Kurulum Tamamlandı! 🎉</h2>
              <p className="text-gray-600 mb-8">
                RotaApp'e hoş geldiniz! Artık rota optimizasyonu yapabilir,<br />
                teslimatlarınızı takip edebilir ve işletmenizi büyütebilirsiniz.
              </p>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Sonraki Adımlar:</h3>
                <ul className="text-left space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Sürücülerinizi ve araçlarınızı ekleyin</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Müşteri veritabanınızı oluşturun</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">İlk rotanızı planlayın ve optimize edin</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between mt-8">
            {step < 3 && (
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Atla
              </button>
            )}

            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!depot.name || !depot.address}
                className={`
                  px-6 py-2 rounded-lg font-medium flex items-center ml-auto
                  ${depot.name && depot.address
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                Devam Et
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center ml-auto"
              >
                Kurulumu Tamamla
                <CheckCircle className="w-4 h-4 ml-2" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center mx-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    Dashboard'a Git
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;