import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Car, AlertCircle } from 'lucide-react';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { vehicleService, CreateVehicleDto } from '@/services/vehicle.service';
import { Vehicle } from '@/types';

const CreateVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<Vehicle>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Form data'yı CreateVehicleDto formatına dönüştür
      const createDto: CreateVehicleDto = {
        plateNumber: data.plateNumber || '',
        type: data.type || 'car',
        brand: data.brand || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        capacity: data.capacity || 1000,
        status: data.status || 'active',
        fuelType: data.fuelType || 'diesel'
      };

      await vehicleService.create(createDto);
      navigate('/vehicles');
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      
      // API hatalarını daha iyi handle et
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setError('Bu plaka numarası zaten kayıtlı');
      } else if (error.response?.status === 400) {
        setError('Geçersiz veri. Lütfen tüm alanları kontrol edin');
      } else {
        setError('Araç oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/vehicles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yeni Araç Ekle</h1>
            <p className="text-gray-600 mt-1">Yeni bir araç kaydı oluşturun</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Hata</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <VehicleForm
        onSubmit={handleSubmit}
        loading={loading}
        isEdit={false}
      />
    </div>
  );
};

export default CreateVehicle;