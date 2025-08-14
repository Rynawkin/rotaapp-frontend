import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Truck,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Play
} from 'lucide-react';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';
import { journeyService } from '@/services/journey.service';

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load routes
  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter routes
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          route.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          route.vehicle?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || route.status === selectedStatus;
    
    const matchesDate = !selectedDate || 
                       new Date(route.date).toISOString().split('T')[0] === selectedDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Delete route
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu rotayı silmek istediğinizden emin misiniz?')) {
      try {
        await routeService.delete(id);
        await loadRoutes();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Rota silinemedi');
      }
    }
  };

  // Duplicate route
  const handleDuplicate = async (route: Route) => {
    try {
      await routeService.duplicate(route);
      await loadRoutes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Rota kopyalanamadı');
    }
  };

  // Start journey from route
  const handleStartJourney = async (route: Route) => {
    try {
      if (!route.driverId || !route.vehicleId) {
        alert('⚠️ Sefer başlatmak için rotaya sürücü ve araç atamanız gerekiyor.');
        navigate(`/routes/${route.id}/edit`);
        return;
      }
      
      if (!route.stops || route.stops.length === 0) {
        alert('⚠️ Sefer başlatmak için en az bir durak eklemelisiniz!');
        return;
      }
      
      const journey = await journeyService.startFromRoute(route.id);
      
      if (journey) {
        alert('✅ Sefer başarıyla başlatıldı!');
        navigate(`/journeys/${journey.id}`);
      }
    } catch (error: any) {
      alert(`❌ ${error.message || 'Sefer başlatılamadı'}`);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            <Edit className="w-3 h-3 mr-1" />
            Taslak
          </span>
        );
      case 'planned':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Calendar className="w-3 h-3 mr-1" />
            Planlandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <Navigation className="w-3 h-3 mr-1 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotalar</h1>
          <p className="text-gray-600 mt-1">Tüm rotalarınızı yönetin ve optimize edin</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link 
            to="/routes/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center inline-flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Rota
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Rota</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{routes.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Rotalar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {routes.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Navigation className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bugünkü Rotalar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {routes.filter(r => 
                  new Date(r.date).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Optimize Edilmiş</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {routes.filter(r => r.optimized).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex-1 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rota, sürücü veya araç ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="planned">Planlandı</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedStatus !== 'all' || selectedDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedDate('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih & Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sürücü
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Araç
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İlerleme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mesafe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Rota bulunamadı</p>
                    <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  const uniqueKey = route.id || `route-${Date.now()}-${Math.random()}`;
                  
                  return (
                    <tr key={uniqueKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{route.name}</p>
                            <p className="text-xs text-gray-500">
                              {route.stops?.length || 0} durak
                              {route.optimized && (
                                <span className="ml-2 text-green-600">• Optimize</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(route.date)}</div>
                        {route.startedAt && (
                          <div className="text-xs text-gray-500">{formatTime(route.startedAt)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {route.driver ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-gray-600">
                                {route.driver.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{route.driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {route.vehicle ? (
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{route.vehicle.plateNumber}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(route.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 mr-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  route.status === 'completed' ? 'bg-green-500' : 
                                  route.status === 'in_progress' ? 'bg-blue-500' : 
                                  'bg-gray-300'
                                }`}
                                style={{ 
                                  width: `${(route.completedDeliveries / route.totalDeliveries) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {route.completedDeliveries}/{route.totalDeliveries}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {route.totalDistance ? `${route.totalDistance} km` : '-'}
                        </div>
                        {route.totalDuration && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {route.totalDuration} dk
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === route.id ? null : route.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {dropdownOpen === route.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                                <Link
                                  to={`/routes/${route.id}`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                                <Link
                                  to={`/routes/${route.id}/edit`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Düzenle
                                </Link>
                                
                                {/* Sefer Başlat Butonu */}
                                {(route.status === 'planned' || route.status === 'draft') && route.stops && route.stops.length > 0 && (
                                  <button
                                    onClick={() => {
                                      handleStartJourney(route);
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2 hover:bg-gray-50 text-green-700 w-full text-left"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Sefer Başlat
                                  </button>
                                )}
                                
                                {/* Sefere Git - in_progress durumunda */}
                                {route.status === 'in_progress' && (
                                  <button
                                    onClick={async () => {
                                      const journey = await journeyService.getByRouteId(route.id);
                                      if (journey) {
                                        navigate(`/journeys/${journey.id}`);
                                      }
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2 hover:bg-gray-50 text-blue-700 w-full text-left"
                                  >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Sefere Git
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => {
                                    handleDuplicate(route);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kopyala
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(route.id);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Sil
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Routes;