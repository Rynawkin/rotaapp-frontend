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
  Plus
} from 'lucide-react';
import { Vehicle, Route as RouteType } from '@/types';
import { vehicleService, routeService } from '@/services/mockData';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceNote, setMaintenanceNote] = useState('');

  useEffect(() => {
    loadVehicleData();
  }, [id]);

  const loadVehicleData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load vehicle
      const vehicleData = await vehicleService.getById(id);
      if (vehicleData) {
        setVehicle(vehicleData);
        
        // Load vehicle's routes
        const allRoutes = await routeService.getAll();
        const vehicleRoutes = allRoutes.filter(r => r.vehicleId === id);
        setRoutes(vehicleRoutes);
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      await vehicleService.delete(vehicle.id);
      navigate('/vehicles');
    }
  };

  const handleAssignRoute = () => {
    navigate('/routes/new', { state: { vehicleId: id } });
  };

  const handleSetMaintenance = async () => {
    if (!vehicle) return;
    
    await vehicleService.updateStatus(vehicle.id, 'maintenance');
    setShowMaintenanceModal(false);
    setMaintenanceNote('');
    alert('Araç bakıma alındı!');
    loadVehicleData();
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

  const getRouteStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'planned':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
                <Route className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                <p className="text-xs text-gray-600">Toplam Rota</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-gray-600">Kullanım Oranı</p>
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
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRouteStatusColor(route.status)}`}>
                            {route.status === 'completed' ? 'Tamamlandı' : 
                             route.status === 'in_progress' ? 'Devam Ediyor' :
                             route.status === 'planned' ? 'Planlandı' : route.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(route.date).toLocaleDateString('tr-TR')}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {route.stops.length} durak
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {route.totalDuration} dk
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
                    {vehicle.maintenanceSchedule?.lastMaintenance || '15 Ocak 2024 - 125,000 km'}
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
                    {vehicle.maintenanceSchedule?.nextMaintenance || '15 Nisan 2024 - 150,000 km'}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {vehicle.maintenanceSchedule?.remainingKm || '2,500 km kaldı'}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Yağ Değişimi</p>
                  <p className="text-xs text-gray-600">
                    {vehicle.maintenanceSchedule?.oilChange || '1 Mart 2024 - 135,000 km'}
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanım İstatistikleri</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bu Ay</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicle.monthlyKm || '2,450 km'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ortalama Günlük</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicle.dailyAvgKm || '82 km'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Toplam Mesafe</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicle.totalKm || '147,500 km'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Yakıt Tüketimi</span>
                <span className="text-sm font-medium text-gray-900">
                  {vehicle.fuelConsumption || '7.8 L/100km'}
                </span>
              </div>
            </div>
          </div>
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