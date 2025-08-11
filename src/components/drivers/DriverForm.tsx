import React, { useState } from 'react';
import { 
  User,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  Save,
  Loader2,
  Car,
  Star,
  Package,
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';
import { Driver } from '@/types';

interface DriverFormProps {
  initialData?: Driver;
  onSubmit: (data: Partial<Driver>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const DriverForm: React.FC<DriverFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  isEdit = false
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    licenseNumber: initialData?.licenseNumber || '',
    status: initialData?.status || 'available',
    vehicleId: initialData?.vehicleId || '',
    rating: initialData?.rating || 0,
    totalDeliveries: initialData?.totalDeliveries || 0
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Sürücü adı zorunludur';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon numarası zorunludur';
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!formData.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'Ehliyet numarası zorunludur';
    }

    if (formData.rating && (formData.rating < 0 || formData.rating > 5)) {
      newErrors.rating = 'Puan 0-5 arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'busy':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'offline':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Temel Bilgiler
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Driver Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sürücü Adı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: Mehmet Öz"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: 0532 111 2233"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: mehmet@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ehliyet Numarası <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: B-123456"
              />
            </div>
            {errors.licenseNumber && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.licenseNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Assignment */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Durum ve Atama
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çalışma Durumu
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'available' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'available' 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Müsait
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'busy' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'busy' 
                    ? 'bg-orange-100 text-orange-700 border-orange-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Car className="w-4 h-4 mr-1" />
                Meşgul
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'offline' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'offline' 
                    ? 'bg-gray-100 text-gray-700 border-gray-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <UserX className="w-4 h-4 mr-1" />
                Çevrimdışı
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sürücünün mevcut çalışma durumunu belirleyin
            </p>
          </div>

          {/* Vehicle Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atanmış Araç
            </label>
            <select
              value={formData.vehicleId || ''}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Araç seçin (Opsiyonel)</option>
              <option value="1">34 ABC 123 - Ford Transit</option>
              <option value="2">34 DEF 456 - Fiat Doblo</option>
              <option value="3">34 GHI 789 - Mercedes Sprinter</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Bu sürücüye varsayılan olarak atanacak araç
            </p>
          </div>
        </div>
      </div>

      {/* Performance Information (Only for Edit) */}
      {isEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Performans Bilgileri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ortalama Puan
              </label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating || 0}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.rating ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0-5 arası puan"
                />
              </div>
              {errors.rating && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.rating}
                </p>
              )}
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (formData.rating || 0) 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating || 0} / 5.0
                </span>
              </div>
            </div>

            {/* Total Deliveries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Toplam Teslimat
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.totalDeliveries || 0}
                  onChange={(e) => setFormData({ ...formData, totalDeliveries: parseInt(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Sürücünün tamamladığı toplam teslimat sayısı
              </p>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formData.totalDeliveries || 0}</p>
                <p className="text-xs text-gray-600">Teslimat</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{formData.rating || 0}</p>
                <p className="text-xs text-gray-600">Puan</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formData.totalDeliveries ? Math.round((formData.totalDeliveries * 0.92)) : 0}
                </p>
                <p className="text-xs text-gray-600">Başarılı</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Güncelle' : 'Kaydet'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DriverForm;