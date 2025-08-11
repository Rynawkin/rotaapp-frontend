import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { vehicleService } from '@/services/mockData';
import { Vehicle } from '@/types';

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await vehicleService.getById(id);
      if (data) {
        setVehicle(data);
      } else {
        alert('Araç bulunamadı');
        navigate('/vehicles');
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Araç yüklenirken bir hata oluştu');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Vehicle>) => {
    if (!id) return;
    
    setSaving(true);
    try {
      await vehicleService.update(id, data);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Araç güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Araç Düzenle</h1>
            <p className="text-gray-600 mt-1">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <VehicleForm
        initialData={vehicle}
        onSubmit={handleSubmit}
        loading={saving}
        isEdit={true}
      />
    </div>
  );
};

export default EditVehicle;