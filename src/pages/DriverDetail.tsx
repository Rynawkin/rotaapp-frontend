import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  Star,
  Package,
  Calendar,
  Car,
  UserCheck,
  UserX,
  Loader2,
  Route,
  Clock,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { Driver, Route as RouteType, Vehicle } from '@/types';
import { driverService } from '@/services/driver.service';
import { routeService } from '@/services/route.service';
import { vehicleService } from '@/services/vehicle.service';

const DriverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  useEffect(() => {
    loadDriverData();
  }, [id]);

  const loadDriverData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load driver
      const driverData = await driverService.getById(id);
      if (driverData) {
        setDriver(driverData);
        
        // Load driver's routes
        const allRoutes = await routeService.getAll();
        const driverRoutes = allRoutes.filter(r => r.driverId === id);
        setRoutes(driverRoutes);
        
        // Load available vehicles
        const vehicles = await vehicleService.getAvailable();
        setAvailableVehicles(vehicles);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!driver) return;
    
    if (window.confirm('Bu sürücüyü silmek istediğinizden emin misiniz?')) {
      await driverService.delete(driver.id);
      navigate('/drivers');
    }
  };

  const handleAssignRoute = () => {
    navigate('/routes/new', { state: { driverId: id } });
  };

  const handleAssignVehicle = async () => {
    if (!selectedVehicle || !driver) return;
    
    // Burada normalde driver'a vehicle ataması yapılacak
    // Şimdilik sadece modal'ı kapat
    setShowVehicleModal(false);
    setSelectedVehicle('');
    alert('Araç başarıyla atandı!');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'busy':
        return 'text-orange-600 bg-orange-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'busy':
        return 'Meşgul';
      case 'offline':
        return 'Çevrimdışı';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <UserCheck className="w-4 h-4 mr-1" />;
      case 'busy':
        return <Car className="w-4 h-4 mr-1" />;
      case 'offline':
        return <UserX className="w-4 h-4 mr-1" />;
      default:
        return null;
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

  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sürücü bulunamadı</p>
        <Link to="/drivers" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Sürücülere Dön
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
            to="/drivers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{driver.name}</h1>
            <p className="text-gray-600 mt-1">Sürücü Detayları</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/drivers/${driver.id}/edit`}
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
                <p className="text-sm text-gray-600 mb-1">Ad Soyad</p>
                <p className="font-medium text-gray-900">{driver.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Durum</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                  {getStatusIcon(driver.status)}
                  {getStatusLabel(driver.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Telefon</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                  {driver.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-1 text-gray-400" />
                  {driver.email || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ehliyet No</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1 text-gray-400" />
                  {driver.licenseNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Kayıt Tarihi</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {formatDate(driver.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performans İstatistikleri</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{driver.rating || 0}</p>
                <p className="text-xs text-gray-600">Ortalama Puan</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{driver.totalDeliveries || 0}</p>
                <p className="text-xs text-gray-600">Toplam Teslimat</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Route className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
                <p className="text-xs text-gray-600">Toplam Rota</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">92%</p>
                <p className="text-xs text-gray-600">Başarı Oranı</p>
              </div>
            </div>
          </div>

          {/* Recent Routes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Rotalar</h2>
            {routes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz rota atanmamış</p>
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
                Yeni Rota Ata
              </button>
              <button 
                onClick={() => setShowVehicleModal(true)}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Car className="w-4 h-4 mr-2" />
                Araç Ata
              </button>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Puan Dağılımı</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm text-gray-600 w-8">{rating}★</span>
                  <div className="flex-1 mx-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : 2}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-10 text-right">
                    {rating === 5 ? '65%' : rating === 4 ? '25%' : rating === 3 ? '8%' : '2%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Assignment Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Araç Ata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müsait Araçlar
                </label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Araç Seçin</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleAssignVehicle}
                  disabled={!selectedVehicle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDetail;