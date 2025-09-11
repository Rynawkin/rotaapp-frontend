import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import DriverForm from '@/components/drivers/DriverForm';
import { driverService } from '@/services/driver.service';
import { Driver } from '@/types';

const EditDriver: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDriver();
  }, [id]);

  const loadDriver = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await driverService.getById(id);
      if (data) {
        setDriver(data);
      } else {
        alert('Sürücü bulunamadı');
        navigate('/drivers');
      }
    } catch (error: any) {
      console.error('Error loading driver:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Sürücü yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Driver>) => {
    if (!id) return;
    
    setSaving(true);
    try {
      await driverService.update(id, data);
      navigate('/drivers');
    } catch (error: any) {
      console.error('Error updating driver:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Sürücü güncellenirken bir hata oluştu';
      setError(errorMessage);
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

  if (!driver) {
    return null;
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Sürücü Düzenle</h1>
            <p className="text-gray-600 mt-1">{driver.name} - Bilgilerini güncelle</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Hata</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <DriverForm
        initialData={driver}
        onSubmit={handleSubmit}
        loading={saving}
        isEdit={true}
      />
    </div>
  );
};

export default EditDriver;