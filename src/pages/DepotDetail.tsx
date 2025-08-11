import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Clock, 
  Edit2, 
  Trash2,
  Star,
  Navigation,
  Route,
  Users,
  Car,
  Calendar,
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';
import { Depot } from '@/types';
import { depotService, routeService } from '@/services/mockData';
import MapComponent from '@/components/maps/MapComponent';

const DAYS_TR = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar'
};

const DepotDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [depot, setDepot] = useState<Depot | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'stats'>('overview');
  const [relatedRoutes, setRelatedRoutes] = useState<any[]>([]);

  useEffect(() => {
    loadDepot();
    loadRelatedRoutes();
  }, [id]);

  const loadDepot = async () => {
    if (!id) {
      navigate('/depots');
      return;
    }

    try {
      setLoading(true);
      const data = await depotService.getById(id);
      if (!data) {
        alert('Depo bulunamadı');
        navigate('/depots');
        return;
      }
      setDepot(data);
    } catch (error) {
      console.error('Depo yüklenirken hata:', error);
      alert('Depo yüklenirken bir hata oluştu');
      navigate('/depots');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedRoutes = async () => {
    try {
      const routes = await routeService.getAll();
      const filtered = routes.filter(r => r.depotId === id);
      setRelatedRoutes(filtered);
    } catch (error) {
      console.error('Rotalar yüklenirken hata:', error);
    }
  };

  const handleDelete = async () => {
    if (!depot) return;

    try {
      await depotService.delete(depot.id);
      navigate('/depots');
    } catch (error: any) {
      alert(error.message || 'Depo silinirken bir hata oluştu');
      setDeleteModal(false);
    }
  };

  const handleSetDefault = async () => {
    if (!depot) return;

    try {
      await depotService.setDefault(depot.id);
      await loadDepot();
    } catch (error) {
      console.error('Ana depo ayarlanırken hata:', error);
      alert('Ana depo ayarlanırken bir hata oluştu');
    }
  };

  const isOpenNow = () => {
    if (!depot?.workingHours) return false;
    
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = days[now.getDay()];
    const hours = depot.workingHours[todayKey];
    
    if (!hours || hours.open === 'closed') return false;
    
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= hours.open && currentTime <= hours.close;
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
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => navigate('/depots')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <Building2 className="w-7 h-7 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">{depot.name}</h1>
                {depot.isDefault && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-yellow-700" />
                    Ana Depo
                  </span>
                )}
                {isOpenNow() ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Açık
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                    Kapalı
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 ml-11 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {depot.address}
            </p>
          </div>
          
          <div className="flex gap-2">
            {!depot.isDefault && (
              <button
                onClick={handleSetDefault}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center"
                title="Ana depo yap"
              >
                <Star className="w-5 h-5" />
              </button>
            )}
            <a
              href={`https://www.google.com/maps?q=${depot.latitude},${depot.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center"
            >
              <Navigation className="w-5 h-5" />
            </a>
            <Link
              to={`/depots/${depot.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Düzenle
            </Link>
            <button
              onClick={() => setDeleteModal(true)}
              disabled={depot.isDefault}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'routes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rotalar ({relatedRoutes.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              İstatistikler
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Location Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Konum Bilgileri</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Adres:</span>
                      <p className="font-medium text-gray-900">{depot.address}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Koordinatlar:</span>
                      <p className="font-medium text-gray-900">
                        {depot.latitude.toFixed(6)}, {depot.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Çalışma Saatleri
                  </h3>
                  {depot.workingHours ? (
                    <div className="space-y-2">
                      {Object.entries(depot.workingHours).map(([day, hours]) => {
                        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
                        const isToday = new Date().getDay() === dayIndex;
                        return (
                          <div 
                            key={day} 
                            className={`flex justify-between py-1 px-2 rounded ${
                              isToday ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className={`text-sm ${isToday ? 'font-semibold' : ''}`}>
                              {DAYS_TR[day]}
                            </span>
                            <span className={`text-sm ${
                              hours.open === 'closed' 
                                ? 'text-red-600' 
                                : isToday ? 'font-semibold text-blue-600' : 'text-gray-700'
                            }`}>
                              {hours.open === 'closed' ? 'Kapalı' : `${hours.open} - ${hours.close}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">Çalışma saatleri belirtilmemiş</p>
                  )}
                </div>
              </div>

              {/* Map */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Harita Konumu</h3>
                <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
                  <MapComponent
                    center={{ lat: depot.latitude, lng: depot.longitude }}
                    markers={[
                      {
                        position: { lat: depot.latitude, lng: depot.longitude },
                        title: depot.name
                      }
                    ]}
                    height="100%"
                    zoom={15}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div>
              {relatedRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <Route className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Bu depoya bağlı rota bulunmuyor</p>
                  <Link
                    to="/routes/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-4"
                  >
                    Rota Oluştur
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedRoutes.map((route) => (
                    <Link
                      key={route.id}
                      to={`/routes/${route.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-900">{route.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {route.totalDeliveries} teslimat • {route.totalDistance} km
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          route.status === 'completed' ? 'bg-green-100 text-green-700' :
                          route.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {route.status === 'completed' ? 'Tamamlandı' :
                           route.status === 'in_progress' ? 'Devam Ediyor' :
                           'Planlandı'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Toplam Rota</span>
                  <Route className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{relatedRoutes.length}</p>
                <p className="text-xs text-gray-500 mt-1">Bu ay</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Aktif Sürücüler</span>
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-gray-500 mt-1">Şu anda</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Araç Sayısı</span>
                  <Car className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500 mt-1">Toplam</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Teslimatlar</span>
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">247</p>
                <p className="text-xs text-gray-500 mt-1">Bu hafta</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Ortalama Süre</span>
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">4.2</p>
                <p className="text-xs text-gray-500 mt-1">Saat/Rota</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Verimlilik</span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-green-600 mt-1">↑ 5% artış</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Zamanında Teslimat</span>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">92%</p>
                <p className="text-xs text-gray-500 mt-1">Son 30 gün</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Toplam Mesafe</span>
                  <Navigation className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">3.4k</p>
                <p className="text-xs text-gray-500 mt-1">km/Bu ay</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Depoyu Sil</h3>
            </div>
            <p className="text-gray-600 mb-6">
              <strong>{depot.name}</strong> deposunu silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepotDetail;