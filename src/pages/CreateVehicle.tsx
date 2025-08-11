import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { vehicleService } from '@/services/mockData';
import { Vehicle } from '@/types';

const CreateVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Vehicle>) => {
    setLoading(true);
    try {
      await vehicleService.create(data);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert('Araç oluşturulurken bir hata oluştu');
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