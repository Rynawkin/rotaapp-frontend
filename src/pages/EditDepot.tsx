import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import DepotForm from '@/components/depots/DepotForm';
import { depotService } from '@/services/depot.service';
import { Depot } from '@/types';

const EditDepot: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [depot, setDepot] = useState<Depot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDepot();
  }, [id]);

  const loadDepot = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await depotService.getById(id);
      setDepot(data);
    } catch (error) {
      console.error('Depo yüklenirken hata:', error);
      alert('Depo bulunamadı');
      navigate('/depots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Depot>) => {
    if (!id) return;
    await depotService.update(id, data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!depot) {
    return null;
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Depo Düzenle</h1>
          </div>
        </div>
        <p className="text-gray-600 ml-11">
          {depot.name} deposunu düzenleyin
        </p>
      </div>

      {/* Form */}
      <DepotForm
        depot={depot}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/depots')}
      />
    </div>
  );
};

export default EditDepot;