import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import DepotForm from '@/components/depots/DepotForm';
import { depotService } from '@/services/depot.service';
import { Depot } from '@/types';

const CreateDepot: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<Depot>) => {
    setLoading(true);
    setError(null);
    
    try {
      await depotService.create(data);
      navigate('/depots');
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Depo oluşturulurken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error creating depot:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/depots')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center">
            <Building2 className="w-6 h-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Yeni Depo Ekle</h1>
          </div>
        </div>
        <p className="text-gray-600 ml-11">
          Yeni bir depo oluşturun ve konumunu belirleyin
        </p>
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
      <DepotForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/depots')}
        loading={loading}
      />
    </div>
  );
};

export default CreateDepot;