import React, { useState } from 'react';
import {
  Car,
  Truck,
  AlertCircle,
  Save,
  Loader2,
  Fuel,
  Package,
  Calendar,
  Activity,
  Hash,
  CheckCircle,
  XCircle,
  Wrench,
  Shield,
  Gauge
} from 'lucide-react';
import { Vehicle } from '@/types';

interface VehicleFormProps {
  initialData?: Vehicle;
  onSubmit: (data: Partial<Vehicle>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  isEdit = false
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plateNumber: initialData?.plateNumber || '',
    type: initialData?.type || 'car',
    brand: initialData?.brand || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    capacity: initialData?.capacity || 1000,
    status: initialData?.status || 'active',
    fuelType: initialData?.fuelType || 'diesel',
    currentKm: initialData?.currentKm || undefined
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vehicle brands by type
  const vehicleBrands = {
    car: ['Toyota', 'Honda', 'Volkswagen', 'Ford', 'Renault', 'Fiat', 'Peugeot', 'Opel'],
    van: ['Ford', 'Mercedes', 'Volkswagen', 'Fiat', 'Renault', 'Iveco', 'Peugeot'],
    truck: ['Mercedes', 'MAN', 'Volvo', 'Scania', 'DAF', 'Iveco', 'Ford'],
    motorcycle: ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'BMW', 'Vespa']
  };

  // Get current brands based on vehicle type
  const currentBrands = vehicleBrands[formData.type as keyof typeof vehicleBrands] || vehicleBrands.car;

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber?.trim()) {
      newErrors.plateNumber = 'Plaka numarası zorunludur';
    } else if (!/^[0-9]{2}\s?[A-Z]{1,3}\s?[0-9]{2,4}$/.test(formData.plateNumber.toUpperCase().replace(/\s/g, ' ').trim())) {
      newErrors.plateNumber = 'Geçerli bir plaka formatı girin (Örn: 34 ABC 123)';
    }

    if (!formData.brand?.trim()) {
      newErrors.brand = 'Marka zorunludur';
    }

    if (!formData.model?.trim()) {
      newErrors.model = 'Model zorunludur';
    }

    if (!formData.year || formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = `Yıl 1990-${new Date().getFullYear() + 1} arasında olmalıdır`;
    }

    if (!formData.capacity || formData.capacity < 0) {
      newErrors.capacity = 'Kapasite 0\'dan büyük olmalıdır';
    }

    if (formData.currentKm !== undefined && formData.currentKm < 0) {
      newErrors.currentKm = 'Kilometre 0\'dan küçük olamaz';
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

    // Format plate number
    const formattedData = {
      ...formData,
      plateNumber: formData.plateNumber?.toUpperCase().replace(/\s+/g, ' ').trim()
    };

    onSubmit(formattedData);
  };

  // Get vehicle type icon
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-4 h-4" />;
      case 'motorcycle':
        return <Activity className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Car className="w-5 h-5 mr-2" />
          Temel Bilgiler
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plaka Numarası <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.plateNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="34 ABC 123"
                maxLength={11}
              />
            </div>
            {errors.plateNumber && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.plateNumber}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Araç Tipi
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'car', label: 'Otomobil', icon: <Car className="w-4 h-4" /> },
                { value: 'van', label: 'Panelvan', icon: <Car className="w-4 h-4" /> },
                { value: 'truck', label: 'Kamyon', icon: <Truck className="w-4 h-4" /> },
                { value: 'motorcycle', label: 'Motor', icon: <Activity className="w-4 h-4" /> }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as any })}
                  className={`px-2 py-2 rounded-lg border text-xs font-medium transition-colors flex flex-col items-center justify-center ${
                    formData.type === type.value 
                      ? 'bg-blue-100 text-blue-700 border-blue-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.icon}
                  <span className="mt-1">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marka <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.brand ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Marka seçin</option>
              {currentBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
              <option value="other">Diğer</option>
            </select>
            {formData.brand === 'other' && (
              <input
                type="text"
                placeholder="Marka adını girin"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            )}
            {errors.brand && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.brand}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.model ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Örn: Transit, Doblo, Sprinter"
            />
            {errors.model && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.model}
              </p>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Yılı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>
            {errors.year && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.year}
              </p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yük Kapasitesi (kg) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1000"
              />
            </div>
            {errors.capacity && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.capacity}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Aracın maksimum yük taşıma kapasitesi
            </p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Teknik Detaylar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Km - YENİ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Güncel Kilometre
            </label>
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                value={formData.currentKm || ''}
                onChange={(e) => setFormData({ ...formData, currentKm: e.target.value ? parseInt(e.target.value) : undefined })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currentKm ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: 50000"
              />
            </div>
            {errors.currentKm && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.currentKm}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Aracın mevcut kilometre bilgisi (opsiyonel)
            </p>
          </div>

          {/* Fuel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yakıt Tipi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'diesel', label: 'Dizel', icon: <Fuel className="w-4 h-4" /> },
                { value: 'gasoline', label: 'Benzin', icon: <Fuel className="w-4 h-4" /> },
                { value: 'electric', label: 'Elektrik', icon: <Activity className="w-4 h-4" /> },
                { value: 'hybrid', label: 'Hibrit', icon: <Fuel className="w-4 h-4" /> }
              ].map(fuel => (
                <button
                  key={fuel.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, fuelType: fuel.value as any })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                    formData.fuelType === fuel.value 
                      ? 'bg-green-100 text-green-700 border-green-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {fuel.icon}
                  <span className="ml-2">{fuel.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Araç Durumu
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'active' 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'maintenance' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'maintenance' 
                    ? 'bg-orange-100 text-orange-700 border-orange-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Wrench className="w-4 h-4 mr-1" />
                Bakımda
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'inactive' })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center ${
                  formData.status === 'inactive' 
                    ? 'bg-gray-100 text-gray-700 border-gray-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Pasif
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aracın mevcut kullanılabilirlik durumu
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Summary (Only for Edit) */}
      {isEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Araç Özeti</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getVehicleIcon(formData.type || 'car')}
              </div>
              <p className="text-xs text-gray-600">Tip</p>
              <p className="text-sm font-medium text-gray-900">
                {formData.type === 'car' ? 'Otomobil' :
                 formData.type === 'van' ? 'Panelvan' :
                 formData.type === 'truck' ? 'Kamyon' : 'Motosiklet'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Kapasite</p>
              <p className="text-sm font-medium text-gray-900">{formData.capacity} kg</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Fuel className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Yakıt</p>
              <p className="text-sm font-medium text-gray-900">
                {formData.fuelType === 'diesel' ? 'Dizel' :
                 formData.fuelType === 'gasoline' ? 'Benzin' :
                 formData.fuelType === 'electric' ? 'Elektrik' : 'Hibrit'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Model</p>
              <p className="text-sm font-medium text-gray-900">{formData.year}</p>
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

export default VehicleForm;