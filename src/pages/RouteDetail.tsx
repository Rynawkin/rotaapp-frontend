import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  Calendar,
  User,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Loader2,
  Play,
  Copy,
  Phone,
  Mail,
  Star,
  Timer,
  Package,
  Home,
  Map,
  Zap,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import MapComponent from '@/components/maps/MapComponent';
import LeafletMapComponent from '@/components/maps/LeafletMapComponent';
import { Route, RouteStop, Customer } from '@/types';
import { LatLng, MarkerData } from '@/types/maps';
import { routeService, customerService } from '@/services/mockData';
import { googleMapsService } from '@/services/googleMapsService';

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stops' | 'timeline'>('overview');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [routeData, customersData] = await Promise.all([
        routeService.getById(id),
        customerService.getAll()
      ]);
      
      setRoute(routeData);
      setCustomers(customersData);
      
      // Haritayı biraz gecikmeyle yükle (Google Maps'in yüklenmesini bekle)
      if (routeData && routeData.stops.length > 0) {
        setTimeout(() => loadRouteOnMap(routeData), 1000);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRouteOnMap = async (routeData: Route) => {
    if (!routeData.stops || routeData.stops.length === 0) return;

    // Find depot
    const depot = { lat: 40.9913, lng: 29.0236 }; // Default depot location
    
    const waypoints = routeData.stops.map(stop => ({
      lat: stop.customer?.latitude || 0,
      lng: stop.customer?.longitude || 0
    }));

    // Google Maps yüklenene kadar bekle
    const waitForGoogle = () => {
      return new Promise((resolve) => {
        const checkGoogle = () => {
          if (window.google && window.google.maps) {
            resolve(true);
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      });
    };

    // Google Maps yüklü mü kontrol et
    const googleReady = await waitForGoogle();
    
    if (googleReady) {
      googleMapsService.initializeServices();
      
      const directions = await googleMapsService.getDirections(
        depot,
        waypoints,
        depot
      );
      
      if (directions) {
        setMapDirections(directions);
        setShowMap(true);
      }
    } else {
      // Google Maps yüklenemezse sadece haritayı göster
      setShowMap(true);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Bu rotayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await routeService.delete(id);
      navigate('/routes');
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!route) return;
    
    const newRoute = {
      ...route,
      id: undefined,
      name: `${route.name} (Kopya)`,
      status: 'draft' as const,
      createdAt: new Date(),
      startedAt: undefined,
      completedAt: undefined
    };
    
    const created = await routeService.create(newRoute);
    if (created) {
      navigate(`/routes/${created.id}/edit`);
    }
  };

  const handleStartJourney = () => {
    if (!route) return;
    alert('Sefer başlatma özelliği yakında eklenecek!');
    // TODO: Journey modülü tamamlandığında implement edilecek
  };

  const handleOptimize = async () => {
    if (!route || route.stops.length < 2) {
      alert('Optimizasyon için en az 2 durak gerekli!');
      return;
    }

    setOptimizing(true);
    try {
      const optimizedRoute = await routeService.optimize(route.id);
      if (optimizedRoute) {
        setRoute(optimizedRoute);
        await loadRouteOnMap(optimizedRoute);
        alert('✅ Rota başarıyla optimize edildi!');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Optimizasyon sırasında bir hata oluştu.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleExport = () => {
    if (!route) return;
    
    // Create CSV content
    const csvContent = [
      ['Sıra', 'Müşteri', 'Adres', 'Telefon', 'Durum', 'Mesafe', 'Süre'],
      ...route.stops.map(stop => [
        stop.order,
        stop.customer?.name || '',
        stop.customer?.address || '',
        stop.customer?.phone || '',
        stop.status,
        stop.distance ? `${stop.distance} km` : '',
        stop.duration ? `${stop.duration} dk` : ''
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <Edit className="w-4 h-4 mr-1" />
            Taslak
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <Calendar className="w-4 h-4 mr-1" />
            Planlandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <Navigation className="w-4 h-4 mr-1 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-4 h-4 mr-1" />
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <XCircle className="w-4 h-4 mr-1" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  const getStopStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Bekliyor</span>;
      case 'arrived':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Varıldı</span>;
      case 'completed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">Tamamlandı</span>;
      case 'failed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Başarısız</span>;
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Star className="w-4 h-4 text-red-500" />;
      case 'normal':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <Star className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const calculateProgress = () => {
    if (!route) return 0;
    return Math.round((route.completedDeliveries / route.totalDeliveries) * 100);
  };

  // Prepare map markers
  const getMapMarkers = (): MarkerData[] => {
    if (!route) return [];
    
    return route.stops.map((stop, index) => ({
      position: {
        lat: stop.customer?.latitude || 0,
        lng: stop.customer?.longitude || 0
      },
      title: stop.customer?.name || `Durak ${index + 1}`,
      label: String(stop.order),
      type: 'customer' as const,
      customerId: stop.customerId
    }));
  };

  const getDepotLocation = (): LatLng => {
    // Default depot location (should be fetched from depot data)
    return { lat: 40.9913, lng: 29.0236 };
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Rota Bulunamadı</h3>
              <p className="text-red-700 mt-1">Bu ID'ye sahip bir rota bulunamadı.</p>
              <Link to="/routes" className="text-blue-600 hover:underline mt-2 inline-block">
                ← Rotalara Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/routes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(route.status)}
                {route.optimized && (
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Optimize Edildi
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {new Date(route.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {route.status === 'planned' && (
              <button
                onClick={handleStartJourney}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Seferi Başlat
              </button>
            )}
            
            {!route.optimized && route.stops.length > 1 && (
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center"
              >
                {optimizing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Optimize Et
              </button>
            )}
            
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Excel'e Aktar"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Kopyala"
            >
              <Copy className="w-5 h-5 text-gray-600" />
            </button>
            
            <Link
              to={`/routes/${route.id}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Düzenle"
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </Link>
            
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {route.status === 'in_progress' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">İlerleme</span>
              <span className="text-sm font-medium text-gray-900">
                {route.completedDeliveries} / {route.totalDeliveries} tamamlandı
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Durak</p>
              <p className="text-2xl font-bold text-gray-900">{route.totalDeliveries}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900">{route.completedDeliveries}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mesafe</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDistance ? `${route.totalDistance}` : '0'} <span className="text-sm">km</span>
              </p>
            </div>
            <Navigation className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Süre</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDuration || '0'} <span className="text-sm">dk</span>
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Başarı Oranı</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDeliveries > 0 ? calculateProgress() : 0}%
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylar</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Sürücü</p>
                <p className="font-medium">{route.driver?.name || 'Atanmadı'}</p>
                {route.driver && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{route.driver.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Araç</p>
                <p className="font-medium">
                  {route.vehicle ? `${route.vehicle.plateNumber} - ${route.vehicle.brand} ${route.vehicle.model}` : 'Atanmadı'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Home className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Depo</p>
                <p className="font-medium">Ana Depo - Kadıköy</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Oluşturulma</p>
                <p className="font-medium">
                  {new Date(route.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
            
            {route.startedAt && (
              <div className="flex items-start space-x-3">
                <Play className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Başlangıç</p>
                  <p className="font-medium">
                    {new Date(route.startedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            )}
            
            {route.completedAt && (
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Tamamlanma</p>
                  <p className="font-medium">
                    {new Date(route.completedAt).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {route.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notlar:</strong> {route.notes}
              </p>
            </div>
          )}
        </div>

        {/* Map or Stops */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setShowMap(false)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    !showMap
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Duraklar ({route.stops.length})
                </button>
                <button
                  onClick={() => setShowMap(true)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    showMap
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Map className="w-4 h-4 inline mr-2" />
                  Harita
                </button>
              </nav>
            </div>

            <div className="p-6">
              {!showMap ? (
                // Stops List
                <div className="space-y-3">
                  {route.stops.map((stop, index) => (
                    <div 
                      key={stop.id} 
                      className={`p-4 rounded-lg border ${
                        stop.status === 'completed' ? 'bg-green-50 border-green-200' :
                        stop.status === 'failed' ? 'bg-red-50 border-red-200' :
                        stop.status === 'arrived' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-4 flex-shrink-0">
                          {stop.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">
                                  {stop.customer?.name || `Müşteri ${stop.customerId}`}
                                </h4>
                                {stop.customer && getPriorityIcon(stop.overridePriority || stop.customer.priority)}
                                {getStopStatusBadge(stop.status)}
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {stop.customer?.address}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                {stop.customer?.phone && (
                                  <span className="flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {stop.customer.phone}
                                  </span>
                                )}
                                
                                {stop.customer?.timeWindow && (
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {stop.overrideTimeWindow?.start || stop.customer.timeWindow.start} - 
                                    {stop.overrideTimeWindow?.end || stop.customer.timeWindow.end}
                                  </span>
                                )}
                                
                                {(stop.serviceTime || stop.customer?.estimatedServiceTime) && (
                                  <span className="flex items-center">
                                    <Timer className="w-3 h-3 mr-1" />
                                    {stop.serviceTime || stop.customer?.estimatedServiceTime} dk
                                  </span>
                                )}
                                
                                {stop.distance && (
                                  <span className="flex items-center">
                                    <Navigation className="w-3 h-3 mr-1" />
                                    {stop.distance} km
                                  </span>
                                )}
                              </div>
                              
                              {/* Stop Notes */}
                              {(stop.stopNotes || stop.customer?.notes) && (
                                <div className="mt-3 space-y-1">
                                  {stop.stopNotes && (
                                    <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                                      <strong>Durak Notu:</strong> {stop.stopNotes}
                                    </div>
                                  )}
                                  {stop.customer?.notes && (
                                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
                                      <strong>Müşteri Notu:</strong> {stop.customer.notes}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Delivery Proof */}
                              {stop.deliveryProof && (
                                <div className="mt-3 p-2 bg-green-50 rounded">
                                  <p className="text-xs font-medium text-green-800 mb-1">Teslimat Kanıtı</p>
                                  {stop.deliveryProof.signature && (
                                    <p className="text-xs text-green-700">✓ İmza alındı</p>
                                  )}
                                  {stop.deliveryProof.photo && (
                                    <p className="text-xs text-green-700">✓ Fotoğraf çekildi</p>
                                  )}
                                  {stop.deliveryProof.notes && (
                                    <p className="text-xs text-green-700 mt-1">
                                      Not: {stop.deliveryProof.notes}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Failure Reason */}
                              {stop.failureReason && (
                                <div className="mt-3 p-2 bg-red-50 rounded">
                                  <p className="text-xs font-medium text-red-800">
                                    Başarısız Teslimat: {stop.failureReason}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Stop Actions */}
                            <div className="ml-4 flex items-start space-x-1">
                              {stop.customer && (
                                <Link
                                  to={`/customers/${stop.customerId}`}
                                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                  title="Müşteri Detayı"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {route.stops.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Bu rotada henüz durak yok</p>
                    </div>
                  )}
                </div>
              ) : (
                // Map View
                <div>
                  {/* MapComponent zaten yüklendi mi kontrol et */}
                  {typeof window !== 'undefined' && window.google && window.google.maps ? (
                    <MapComponent
                      height="500px"
                      markers={getMapMarkers()}
                      depot={getDepotLocation()}
                      directions={mapDirections}
                      customers={customers}
                      showTraffic={true}
                    />
                  ) : (
                    <LeafletMapComponent
                      height="500px"
                      customers={customers}
                      depot={getDepotLocation()}
                      stops={route.stops.map((stop, index) => ({
                        customer: stop.customer || customers.find(c => c.id === stop.customerId) || {
                          id: stop.customerId,
                          name: `Müşteri ${stop.customerId}`,
                          address: '',
                          phone: '',
                          latitude: 0,
                          longitude: 0,
                          code: '',
                          priority: 'normal' as const,
                          tags: [],
                          createdAt: new Date(),
                          updatedAt: new Date()
                        },
                        order: stop.order
                      }))}
                    />
                  )}
                  {mapDirections && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>📍 Rota:</strong> Haritada gösterilen rota, 
                        {route.optimized ? ' optimize edilmiş durumda.' : ' henüz optimize edilmemiş.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;