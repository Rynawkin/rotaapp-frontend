import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';
import RouteForm from '@/components/routes/RouteForm';
import { Route } from '@/types';
import { routeService } from '@/services/route.service'; // ✅ DÜZELTME: mockData yerine route.service

const EditRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id) {
      setError('Rota ID bulunamadı');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading route with ID:', id); // Debug log
      const data = await routeService.getById(id);
      console.log('Loaded route data:', data); // Debug log
      
      if (data) {
        setRoute(data);
      } else {
        setError('Rota bulunamadı');
      }
    } catch (error: any) {
      console.error('Error loading route:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rota yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Partial<Route>) => {
    if (!id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await routeService.update(id, formData);
      navigate(`/routes/${id}`);
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rota güncellenirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error updating route:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = async (formData: Partial<Route>) => {
    if (!id) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await routeService.update(id, {
        ...formData,
        status: 'draft'
      });
      navigate('/routes');
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Taslak kaydedilirken bir hata oluştu.';
      setError(errorMessage);
      console.error('Error saving draft:', error);
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

  if (!route && !loading) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rota Bulunamadı</h2>
        <p className="text-gray-600 mb-4">
          {error || 'İstediğiniz rota bulunamadı veya silinmiş olabilir.'}
        </p>
        <Link
          to="/routes"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Rotalara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">Rota Düzenle</h1>
              <p className="text-gray-600 mt-1">{route?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Route Form */}
      {route && (
        <RouteForm
          initialData={route}
          onSubmit={handleSubmit}
          onSaveAsDraft={handleSaveAsDraft}
          loading={saving}
          isEdit
        />
      )}
    </div>
  );
};

export default EditRoute;