import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import RouteForm from '@/components/routes/RouteForm';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';

const CreateRoute: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: Partial<Route>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newRoute = await routeService.create(formData);
      navigate(`/routes/${newRoute.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rota oluşturulurken bir hata oluştu.');
      console.error('Error creating route:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = async (formData: Partial<Route>) => {
    setLoading(true);
    setError(null);
    
    try {
      const draftRoute = await routeService.create({
        ...formData,
        status: 'draft'
      });
      navigate('/routes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Taslak kaydedilirken bir hata oluştu.');
      console.error('Error saving draft:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/routes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Yeni Rota Oluştur</h1>
              <p className="text-gray-600 mt-1">Müşterileri seçin ve rotanızı optimize edin</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <RouteForm
        onSubmit={handleSubmit}
        onSaveAsDraft={handleSaveAsDraft}
        loading={loading}
      />
    </div>
  );
};

export default CreateRoute;