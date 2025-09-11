import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, Copy, Mail, Phone, Shield } from 'lucide-react';
import DriverForm from '@/components/drivers/DriverForm';
import { driverService } from '@/services/driver.service';
import { Driver } from '@/types';

const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDriver, setCreatedDriver] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await driverService.create(data);
      
      // Eğer kullanıcı oluşturulduysa login bilgilerini göster
      if (response.isUserCreated) {
        setCreatedDriver({
          ...response,
          tempPassword: response.generatedPassword || data.password
        });
        
        // Email gönderildi bildirimi
        if (response.isUserCreated && response.generatedPassword) {
          console.log('Driver created with auto-generated password, email sent');
        }
        
        setShowSuccess(true);
      } else {
        // Normal akış
        navigate('/drivers');
      }
    } catch (error: any) {
      console.error('Error creating driver:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Sürücü oluşturulurken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Panoya kopyalandı!');
  };

  // Başarı ekranı
  if (showSuccess && createdDriver) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sürücü Başarıyla Oluşturuldu!</h1>
              <p className="text-gray-600 mt-1">Giriş bilgileri aşağıdadır</p>
            </div>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Driver Info */}
            <div className="pb-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sürücü Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Ad Soyad:</span>
                  <p className="font-medium">{createdDriver.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Telefon:</span>
                  <p className="font-medium">{createdDriver.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{createdDriver.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ehliyet No:</span>
                  <p className="font-medium">{createdDriver.licenseNumber}</p>
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Giriş Bilgileri
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <p className="text-xs text-gray-500">Email (Kullanıcı Adı)</p>
                    <p className="font-mono font-medium">{createdDriver.loginEmail || createdDriver.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdDriver.loginEmail || createdDriver.email)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Panoya kopyala"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {createdDriver.tempPassword && (
                  <div className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div>
                      <p className="text-xs text-gray-500">Geçici Şifre</p>
                      <p className="font-mono font-medium">{createdDriver.tempPassword}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdDriver.tempPassword)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Panoya kopyala"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Önemli:</strong> Bu bilgileri sürücüye iletin. 
                  Sürücü mobil uygulamadan bu bilgilerle giriş yapabilecektir.
                </p>
              </div>
            </div>

            {/* Email Gönderim Durumu */}
            {createdDriver.isUserCreated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">
                      Hoşgeldin Email'i Gönderildi!
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Sürücüye <strong>{createdDriver.email}</strong> adresine giriş bilgileri 
                      ve mobil uygulama linki içeren email başarıyla gönderildi.
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      Email YolPilot adından gönderilmiştir.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Email Otomatik Gönderildi
                </div>
                <button 
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                  onClick={() => alert('SMS gönderme özelliği henüz aktif değil')}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  SMS Gönder
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setCreatedDriver(null);
                    window.location.reload(); // Sayfayı yenile
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Yeni Sürücü Ekle
                </button>
                <Link
                  to="/drivers"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sürücüler Listesine Git
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal form görünümü
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/drivers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Sürücü Ekle</h1>
            <p className="text-gray-600 mt-1">Yeni bir sürücü kaydı oluşturun</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <DriverForm
        onSubmit={handleSubmit}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
};

export default CreateDriver;