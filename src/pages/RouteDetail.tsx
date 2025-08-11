import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Truck, 
  User, 
  Calendar,
  Clock,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Phone,
  Star,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Route } from '@/types';
import { routeService } from '@/services/mockData';

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await routeService.getById(id);
      if (data) {
        setRoute(data);
      }
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Bu rotayı silmek istediğinizden emin misiniz?')) return;

    setDeleting(true);
    try {
      await routeService.delete(id);
      navigate('/routes');
    } catch (error) {
      console.error('Error deleting route:', error);
      setDeleting(false);
    }
  };

  const handleStartRoute = () => {
    // TODO: Start journey
    alert('Sefer başlatma özelliği yakında!');
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <Edit className="w-4 h-4 mr-1.5" />
            Taslak
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <Calendar className="w-4 h-4 mr-1.5" />
            Planlandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <Navigation className="w-4 h-4 mr-1.5 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <XCircle className="w-4 h-4 mr-1.5" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rota Bulunamadı</h2>
        <p className="text-gray-600 mb-4">İstediğiniz rota bulunamadı veya silinmiş olabilir.</p>
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
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
                {getStatusBadge(route.status)}
                {route.optimized && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Optimize
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">{formatDate(route.date)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {route.status === 'planned' && (
              <button
                onClick={handleStartRoute}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Seferi Başlat
              </button>
            )}
            <Link
              to={`/routes/${route.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Sil
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Route Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Duraklar</p>
                  <p className="text-2xl font-bold text-gray-900">{route.totalDeliveries}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{route.completedDeliveries}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mesafe</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {route.totalDistance ? `${route.totalDistance} km` : '-'}
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Süre</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {route.totalDuration ? `${route.totalDuration} dk` : '-'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Stops List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Duraklar</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {route.stops.map((stop, index) => (
                <div key={stop.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {stop.customer?.name}
                            <span className="ml-2 text-xs text-gray-500">
                              ({stop.customer?.code})
                            </span>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 flex items-start">
                            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            {stop.customer?.address}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="flex items-center text-gray-500">
                              <Phone className="w-4 h-4 mr-1" />
                              {stop.customer?.phone}
                            </span>
                            {stop.customer?.timeWindow && (
                              <span className="flex items-center text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                {stop.customer.timeWindow.start} - {stop.customer.timeWindow.end}
                              </span>
                            )}
                            {stop.customer?.priority === 'high' && (
                              <span className="flex items-center text-red-600">
                                <Star className="w-4 h-4 mr-1" />
                                Yüksek Öncelik
                              </span>
                            )}
                          </div>
                          {stop.customer?.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                              <strong>Not:</strong> {stop.customer.notes}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {stop.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {stop.status === 'arrived' && (
                            <div className="flex items-center text-blue-600">
                              <MapPin className="w-5 h-5 animate-pulse" />
                            </div>
                          )}
                          {stop.status === 'pending' && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          {stop.status === 'failed' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Driver & Vehicle Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atama Bilgileri</h3>
            
            {/* Driver */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Sürücü</p>
              {route.driver ? (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{route.driver.name}</p>
                    <p className="text-sm text-gray-500">{route.driver.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Atanmadı</p>
              )}
            </div>

            {/* Vehicle */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Araç</p>
              {route.vehicle ? (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <Truck className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{route.vehicle.plateNumber}</p>
                    <p className="text-sm text-gray-500">
                      {route.vehicle.brand} {route.vehicle.model}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Atanmadı</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {route.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notlar</h3>
              <p className="text-gray-600">{route.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                <Copy className="w-4 h-4 mr-2" />
                Rotayı Kopyala
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Haritada Görüntüle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;