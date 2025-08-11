import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import DriverForm from '@/components/drivers/DriverForm';
import { driverService } from '@/services/mockData';
import { Driver } from '@/types';

const CreateDriver: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Partial<Driver>) => {
    setLoading(true);
    try {
      await driverService.create(data);
      navigate('/drivers');
    } catch (error) {
      console.error('Error creating driver:', error);
      alert('Sürücü oluşturulurken bir hata oluştu');
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