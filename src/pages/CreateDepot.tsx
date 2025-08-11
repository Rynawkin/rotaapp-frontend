import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import DepotForm from '@/components/depots/DepotForm';
import { depotService } from '@/services/mockData';
import { Depot } from '@/types';

const CreateDepot: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: Partial<Depot>) => {
    await depotService.create(data);
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

      {/* Form */}
      <DepotForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/depots')}
      />
    </div>
  );
};

export default CreateDepot;