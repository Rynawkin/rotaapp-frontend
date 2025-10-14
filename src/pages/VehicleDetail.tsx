import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Car,
  Truck,
  Package,
  Fuel,
  Calendar,
  CheckCircle,
  XCircle,
  Wrench,
  Loader2,
  Route,
  Clock,
  MapPin,
  TrendingUp,
  Activity,
  Hash,
  AlertTriangle,
  Settings,
  Plus,
  Gauge
} from 'lucide-react';
import { Vehicle, getFuelLabel, getVehicleConditionLabel, getVehicleConditionColor } from '@/types';
import { vehicleService } from '@/services/vehicle.service';
import { routeService } from '@/services/route.service';
import { journeyService } from '@/services/journey.service';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [kmStats, setKmStats] = useState<{
    oneMonth: number;
    threeMonths: number;
  }>({ oneMonth: 0, threeMonths: 0 });
  const [lastJourney, setLastJourney] = useState<any>(null);

  useEffect(() => {
    loadVehicleData();
  }, [id]);

  const loadVehicleData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Load vehicle
      const vehicleId = parseInt(id);
      const vehicleData = await vehicleService.getById(vehicleId);
      if (vehicleData) {
        setVehicle(vehicleData);

        // Load vehicle's routes using real API
        const vehicleRoutes = await routeService.getByVehicleId(id);
        setRoutes(vehicleRoutes);

        // Load km statistics
        await loadKmStatistics(vehicleId);
      } else {
        alert('Araç bulunamadı');
        navigate('/vehicles');
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      alert('Veri yüklenirken bir hata oluştu');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const loadKmStatistics = async (vehicleId: number) => {
    try {
      // Get journeys from last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const journeys = await journeyService.getAll(threeMonthsAgo);

      // Filter journeys for this vehicle
      const vehicleJourneys = journeys.filter(j => j.vehicleId === vehicleId);

      // Calculate km change for last 1 month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const oneMonthJourneys = vehicleJourneys.filter(j =>
        j.startedAt && new Date(j.startedAt) >= oneMonthAgo && j.startKm && j.endKm
      );

      const threeMonthJourneys = vehicleJourneys.filter(j =>
        j.startKm && j.endKm
      );

      // Calculate total km traveled
      const oneMonthKm = oneMonthJourneys.reduce((sum, j) =>
        sum + (j.endKm! - j.startKm!), 0
      );

      const threeMonthKm = threeMonthJourneys.reduce((sum, j) =>
        sum + (j.endKm! - j.startKm!), 0
      );

      setKmStats({
        oneMonth: oneMonthKm,
        threeMonths: threeMonthKm
      });

      // ✅ YENİ: Son tamamlanan seferi bul
      const completedJourneys = vehicleJourneys.filter(j => j.status === 'completed' && j.finishedAt);
      if (completedJourneys.length > 0) {
        // En son tamamlanan seferi tarihe göre sırala ve al
        const sorted = completedJourneys.sort((a, b) =>
          new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()
        );
        setLastJourney(sorted[0]);
      }
    } catch (error) {
      console.error('Error loading km statistics:', error);
      // Don't show error to user, just log it
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      try {
        await vehicleService.delete(vehicle.id);
        navigate('/vehicles');
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Araç silinirken bir hata oluştu');
      }
    }
  };

  const handleAssignRoute = () => {
    navigate('/routes/new', { state: { vehicleId: id } });
  };

  const handleSetMaintenance = async () => {
    if (!vehicle) return;
    
    try {
      await vehicleService.updateStatus(vehicle.id, 'maintenance');
      setShowMaintenanceModal(false);
      setMaintenanceNote('');
      alert('Araç bakıma alındı!');
      await loadVehicleData();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      alert('Durum güncellenirken bir hata oluştu');
    }
  };

  const handleEditSettings = () => {
    navigate(`/vehicles/${id}/edit`, { state: { tab: 'maintenance' } });
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-5 h-5" />;
      case 'motorcycle':
        return <Activity className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'car':
        return 'Otomobil';
      case 'van':
        return 'Panelvan';
      case 'truck':
        return 'Kamyon';
      case 'motorcycle':
        return 'Motosiklet';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'maintenance':
        return 'text-orange-600 bg-orange-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'maintenance':
        return 'Bakımda';
      case 'inactive':
        return 'Pasif';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 mr-1" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 mr-1" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline':
        return 'Benzin';
      case 'diesel':
        return 'Dizel';
      case 'electric':
        return 'Elektrik';
      case 'hybrid':
        return 'Hibrit';
      default:
        return fuelType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Araç bulunamadı</p>
        <Link to="/vehicles" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Araçlara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/vehicles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-gray-600 mt-1">Araç Detayları</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/vehicles/${vehicle.id}/edit`}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Düzenle
          </Link>
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Plaka</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Hash className="w-4 h-4 mr-1 text-gray-400" />
                  {vehicle.plateNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Durum</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {getStatusIcon(vehicle.status)}
                  {getStatusLabel(vehicle.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Marka</p>
                <p className="font-medium text-gray-900">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Model</p>
                <p className="font-medium text-gray-900">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Yıl</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {vehicle.year}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tip</p>
                <p className="font-medium text-gray-900 flex items-center">
                  {getVehicleIcon(vehicle.type)}
                  <span className="ml-1">{getVehicleTypeLabel(vehicle.type)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Teknik Özellikler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Package className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{vehicle.capacity}</p>
                <p className="text-xs text-gray-600">Kapasite (kg)</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Fuel className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-gray-900">{getFuelTypeLabel(vehicle.fuelType)}</p>
                <p className="text-xs text-gray-600">Yakıt Tipi</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Gauge className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {vehicle.currentKm ? vehicle.currentKm.toLocaleString('tr-TR') : '-'}
                </p>
                <p className="text-xs text-gray-600">Güncel Kilometre</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Route className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                <p className="text-xs text-gray-600">Toplam Rota</p>
              </div>
            </div>
          </div>

          {/* Recent Routes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Rotalar</h2>
            {routes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Bu araç henüz hiçbir rotada kullanılmamış</p>
            ) : (
              <div className="space-y-3">
                {routes.slice(0, 5).map((route) => (
                  <Link
                    key={route.id}
                    to={`/routes/${route.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Route className="w-5 h-5 text-gray-400" />
                          <h3 className="font-medium text-gray-900">{route.name}</h3>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(route.date).toLocaleDateString('tr-TR')}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {route.stops?.length || 0} durak
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
            <div className="space-y-2">
              <button 
                onClick={handleAssignRoute}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Route className="w-4 h-4 mr-2" />
                Rotaya Ata
              </button>
              <button 
                onClick={() => setShowMaintenanceModal(true)}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                disabled={vehicle.status === 'maintenance'}
              >
                <Wrench className="w-4 h-4 mr-2" />
                {vehicle.status === 'maintenance' ? 'Bakımda' : 'Bakıma Al'}
              </button>
              <button 
                onClick={handleEditSettings}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ayarlar
              </button>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bakım Takvimi</h2>
              <button 
                onClick={() => navigate(`/vehicles/${id}/edit`, { state: { tab: 'maintenance' } })}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Bakım takvimini düzenle"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Son Bakım</p>
                  <p className="text-xs text-gray-600">
                    Bilgi yok
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sonraki Bakım</p>
                  <p className="text-xs text-gray-600">
                    Planlanmamış
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/vehicles/${id}/edit`, { state: { tab: 'maintenance' } })}
                className="w-full mt-2 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Plus className="w-3 h-3 mr-1" />
                Bakım Ekle
              </button>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Kilometre İstatistikleri
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Son 1 Ay</span>
                  {kmStats.oneMonth > 0 && (
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {kmStats.oneMonth > 0 ? `+${kmStats.oneMonth.toLocaleString('tr-TR')}` : '-'}
                </p>
                <p className="text-xs text-gray-600 mt-1">km artış</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Son 3 Ay</span>
                  {kmStats.threeMonths > 0 && (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {kmStats.threeMonths > 0 ? `+${kmStats.threeMonths.toLocaleString('tr-TR')}` : '-'}
                </p>
                <p className="text-xs text-gray-600 mt-1">km artış</p>
              </div>
              {kmStats.oneMonth === 0 && kmStats.threeMonths === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  Henüz tamamlanmış sefer bulunmuyor
                </p>
              )}
            </div>
          </div>

          {/* ✅ YENİ: Son Sefer Bilgileri */}
          {lastJourney && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Son Sefer Bilgileri
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-gray-600">Sefer</span>
                  <Link
                    to={`/journeys/${lastJourney.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {lastJourney.name || `#${lastJourney.id}`}
                  </Link>
                </div>

                {lastJourney.finishedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tamamlanma</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(lastJourney.finishedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}

                {lastJourney.startKm !== undefined && lastJourney.endKm !== undefined && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Kilometre</div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-gray-600">Başlangıç:</span>
                        <span className="font-bold text-blue-900 ml-1">
                          {lastJourney.startKm.toLocaleString('tr-TR')} km
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Bitiş:</span>
                        <span className="font-bold text-blue-900 ml-1">
                          {lastJourney.endKm.toLocaleString('tr-TR')} km
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-purple-600 mt-1 font-semibold">
                      Kat edilen: {(lastJourney.endKm - lastJourney.startKm).toLocaleString('tr-TR')} km
                    </div>
                  </div>
                )}

                {lastJourney.startFuel && lastJourney.endFuel && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Yakıt Seviyesi</div>
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-900">
                      {getFuelLabel(lastJourney.startFuel)}
                      <span className="text-gray-500">→</span>
                      {getFuelLabel(lastJourney.endFuel)}
                    </div>
                  </div>
                )}

                {lastJourney.vehicleCondition && (
                  <div className={`p-3 rounded-lg ${getVehicleConditionColor(lastJourney.vehicleCondition)}`}>
                    <div className="text-xs mb-1 opacity-75">Araç Durumu</div>
                    <div className="text-sm font-bold text-center">
                      {getVehicleConditionLabel(lastJourney.vehicleCondition)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Aracı Bakıma Al</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bakım Notu
                </label>
                <textarea
                  value={maintenanceNote}
                  onChange={(e) => setMaintenanceNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yapılacak bakım işlemleri..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    setMaintenanceNote('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleSetMaintenance}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Bakıma Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDetail;