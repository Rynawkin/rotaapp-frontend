import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package,
  Navigation,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Truck,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';
import { Route } from '@/types';
import { journeyService, JourneySummary } from '@/services/journey.service';
import { routeService } from '@/services/route.service';

const Journeys: React.FC = () => {
  // ✅ PERFORMANS: Journey yerine JourneySummary kullan
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // Her 30 saniyede bir aktif seferleri güncelle (3 saniye yerine)
    const interval = setInterval(() => {
      loadJourneys();
    }, 30000); // ✅ PERFORMANS: 10 saniye yerine 30 saniye
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadJourneys();
      await loadAvailableRoutes();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJourneys = async () => {
    try {
      // ✅ PERFORMANS: getAllSummary kullan
      const data = await journeyService.getAllSummary();
      setJourneys(data);
    } catch (error) {
      console.error('Error loading journeys:', error);
    }
  };

  const loadAvailableRoutes = async () => {
    try {
      const routes = await routeService.getAll();
      // Sadece planned veya draft durumundaki rotaları göster
      const available = routes.filter(r => 
        (r.status === 'planned' || r.status === 'draft') && 
        r.driverId && 
        r.vehicleId
      );
      setAvailableRoutes(available);
    } catch (error) {
      console.error('Error loading routes:', error);
    }
  };

  const handleStartJourney = async (route: Route) => {
    try {
      const journey = await journeyService.startFromRoute(route.id);
      await loadData();
      setShowStartModal(false);
      setSelectedRoute(null);
      // Journey detay sayfasına yönlendir
      navigate(`/journeys/${journey.id}`);
    } catch (error: any) {
      alert(error.message || 'Sefer başlatılamadı');
    }
  };

  const handlePauseJourney = async (journeyId: number) => {
    try {
      await journeyService.updateStatus(journeyId, 'preparing');
      await loadJourneys();
    } catch (error) {
      console.error('Error pausing journey:', error);
      alert('Sefer duraklatılamadı');
    }
  };

  const handleResumeJourney = async (journeyId: number) => {
    try {
      await journeyService.updateStatus(journeyId, 'in_progress');
      await loadJourneys();
    } catch (error) {
      console.error('Error resuming journey:', error);
      alert('Sefer devam ettirilemedi');
    }
  };

  const handleCancelJourney = async (journeyId: number) => {
    if (window.confirm('Bu seferi iptal etmek istediğinizden emin misiniz?')) {
      try {
        await journeyService.cancel(journeyId);
        await loadData();
      } catch (error) {
        console.error('Error cancelling journey:', error);
        alert('Sefer iptal edilemedi');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'preparing':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Hazırlanıyor
          </span>
        );
      case 'started':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Play className="w-3 h-3 mr-1" />
            Başladı
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

  const formatTime = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const calculateProgress = (journey: JourneySummary) => {
    if (journey.totalStops === 0) return 0;
    return (journey.completedStops / journey.totalStops) * 100;
  };

  const filteredJourneys = journeys.filter(journey => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'active') {
      return ['preparing', 'started', 'in_progress'].includes(journey.status);
    }
    if (selectedStatus === 'completed') {
      return journey.status === 'completed';
    }
    if (selectedStatus === 'cancelled') {
      return journey.status === 'cancelled';
    }
    return journey.status === selectedStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Seferler</h1>
          <p className="text-gray-600 mt-1">Aktif seferleri takip edin ve yönetin</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Play className="w-4 h-4 mr-2" />
          Yeni Sefer Başlat
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Seferler</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.filter(j => ['preparing', 'started', 'in_progress'].includes(j.status)).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.filter(j => j.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Mesafe</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.reduce((sum, j) => sum + j.totalDistance, 0).toFixed(1)} km
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Süre</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.length > 0 
                  ? formatDuration(
                      Math.round(journeys.reduce((sum, j) => sum + j.totalDuration, 0) / journeys.length)
                    )
                  : '0dk'
                }
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-1 border border-gray-100 inline-flex">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tümü ({journeys.length})
        </button>
        <button
          onClick={() => setSelectedStatus('active')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'active' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Aktif ({journeys.filter(j => ['preparing', 'started', 'in_progress'].includes(j.status)).length})
        </button>
        <button
          onClick={() => setSelectedStatus('completed')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'completed' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tamamlanan ({journeys.filter(j => j.status === 'completed').length})
        </button>
        <button
          onClick={() => setSelectedStatus('cancelled')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'cancelled' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          İptal ({journeys.filter(j => j.status === 'cancelled').length})
        </button>
      </div>

      {/* Journeys List */}
      <div className="space-y-4">
        {filteredJourneys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Sefer bulunamadı</p>
            {selectedStatus === 'active' && (
              <p className="text-sm text-gray-400 mt-1">
                Yeni bir sefer başlatmak için yukarıdaki butonu kullanın
              </p>
            )}
          </div>
        ) : (
          filteredJourneys.map((journey) => (
            <div key={journey.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {journey.routeName || 'İsimsiz Rota'}
                    </h3>
                    {getStatusBadge(journey.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {journey.driverName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="w-4 h-4 mr-2 text-gray-400" />
                      {journey.vehiclePlateNumber}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(journey.startedAt || journey.createdAt).toLocaleDateString('tr-TR')}
                      {' • '}
                      {formatTime(journey.startedAt || journey.createdAt)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>İlerleme</span>
                      <span>
                        {journey.completedStops} / {journey.totalStops} durak
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          journey.status === 'completed' ? 'bg-green-500' : 
                          journey.status === 'cancelled' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${calculateProgress(journey)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {journey.totalDistance.toFixed(1)} km
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDuration(journey.totalDuration)}
                    </div>
                    {journey.liveLocation && (
                      <div className="flex items-center text-green-600">
                        <Activity className="w-4 h-4 mr-1 animate-pulse" />
                        {journey.liveLocation.speed?.toFixed(0)} km/h
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="relative ml-4">
                  <button
                    onClick={() => setDropdownOpen(dropdownOpen === journey.id.toString() ? null : journey.id.toString())}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  {dropdownOpen === journey.id.toString() && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDropdownOpen(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                        <Link
                          to={`/journeys/${journey.id}`}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setDropdownOpen(null)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Detayları Görüntüle
                        </Link>
                        
                        {journey.status === 'preparing' && (
                          <button
                            onClick={() => {
                              handleResumeJourney(journey.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Devam Et
                          </button>
                        )}
                        
                        {journey.status === 'in_progress' && (
                          <button
                            onClick={() => {
                              handlePauseJourney(journey.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Duraklat
                          </button>
                        )}
                        
                        {['preparing', 'started', 'in_progress'].includes(journey.status) && (
                          <>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                handleCancelJourney(journey.id);
                                setDropdownOpen(null);
                              }}
                              className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              İptal Et
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start Journey Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Sefer Başlat</h2>
            
            {availableRoutes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                <p className="text-gray-600">Başlatılabilecek rota bulunamadı.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Sefer başlatmak için rotaya sürücü ve araç atamanız gerekiyor.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableRoutes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoute?.id === route.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{route.name}</h3>
                      <span className="text-xs text-gray-500">
                        {route.stops?.length || 0} durak
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {route.driver?.name}
                      </div>
                      <div className="flex items-center">
                        <Truck className="w-3 h-3 mr-1" />
                        {route.vehicle?.plateNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStartModal(false);
                  setSelectedRoute(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              {selectedRoute && (
                <button
                  onClick={() => handleStartJourney(selectedRoute)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Seferi Başlat
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journeys;