import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { vehicleService, CreateVehicleDto } from '@/services/vehicle.service';
import { Vehicle } from '@/types';
import { PageAlert, PageHeader } from '@/components/ui/PageChrome';

const CreateVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<Vehicle>) => {
    setLoading(true);
    setError(null);

    try {
      const createDto: CreateVehicleDto = {
        plateNumber: data.plateNumber || '',
        type: data.type || 'car',
        brand: data.brand || '',
        model: data.model || '',
        year: data.year || new Date().getFullYear(),
        capacity: data.capacity || 1000,
        status: data.status || 'active',
        fuelType: data.fuelType || 'diesel',
        currentKm: data.currentKm
      };

      await vehicleService.create(createDto);
      navigate('/vehicles');
    } catch (submitError: any) {
      console.error('Error creating vehicle:', submitError);

      let errorMessage = submitError.userFriendlyMessage;
      if (!errorMessage) {
        if (submitError.response?.data?.message) {
          errorMessage = submitError.response.data.message;
        } else if (submitError.response?.status === 409) {
          errorMessage = 'Bu plaka numarası zaten kayıtlı.';
        } else if (submitError.response?.status === 400) {
          errorMessage = 'Geçersiz veri. Lütfen tüm alanları kontrol edin.';
        } else {
          errorMessage = 'Araç oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/vehicles"
        backLabel="Araçlara Dön"
        eyebrow="Filo Yönetimi"
        title="Yeni Araç"
        description="Araç kaydını oluştururken plaka, kapasite ve güncel kilometre gibi operasyon alanları korunur."
      />

      {error && <PageAlert message={error} />}

      <VehicleForm onSubmit={handleSubmit} loading={loading} isEdit={false} />
    </div>
  );
};

export default CreateVehicle;
