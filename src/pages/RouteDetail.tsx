import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
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
  Eye,
  Share2
} from 'lucide-react';
import MapComponent from '@/components/maps/MapComponent';
import LeafletMapComponent from '@/components/maps/LeafletMapComponent';
import { Route, RouteStop, Customer } from '@/types';
import { LatLng, MarkerData } from '@/types/maps';
import { routeService, customerService, journeyService } from '@/services/mockData';
import { googleMapsService } from '@/services/googleMapsService';

// Google Maps libraries
const libraries: ("places" | "drawing" | "geometry")[] = ['places'];

// Dakikayı saat ve dakika formatına çevir
const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes === 0) return '0 dakika';
  if (totalMinutes < 60) {
    return `${totalMinutes} dakika`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} saat`;
  }
  return `${hours} saat ${minutes} dakika`;
};

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MarkerData[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Google Maps Loader Hook
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
    id: 'google-map-script'
  });

  useEffect(() => {
    loadData();
  }, [id]);

  // Route veya customers değiştiğinde marker'ları güncelle
  useEffect(() => {
    if (route && route.stops && customers.length > 0) {
      const markers = generateMapMarkers();
      setMapMarkers(markers);
      
      // Google Maps yüklendiyse ve rota optimize edildiyse directions'ı yükle
      if (isGoogleMapsLoaded && route.optimized) {
        loadRouteOnMap(route);
      }
    }
  }, [route, customers, isGoogleMapsLoaded]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [routeData, customersData] = await Promise.all([
        routeService.getById(id),
        customerService.getAll()
      ]);
      
      // Route stops'larına customer bilgilerini ekle
      if (routeData && routeData.stops) {
        routeData.stops = routeData.stops.map(stop => {
          const customer = customersData.find(c => c.id === stop.customerId);
          return {
            ...stop,
            customer: customer || stop.customer
          };
        });
      }
      
      setRoute(routeData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMapMarkers = (): MarkerData[] => {
    if (!route || !route.stops || route.stops.length === 0) {
      return [];
    }
    
    const markers = route.stops.map((stop) => {
      const customer = stop.customer || customers.find(c => c.id === stop.customerId);
      
      if (!customer) {
        return null;
      }
      
      // Koordinatları kontrol et
      if (!customer.latitude || !customer.longitude) {
        return null;
      }
      
      const marker = {
        position: {
          lat: customer.latitude,
          lng: customer.longitude
        },
        title: customer.name || `Durak ${stop.order}`,
        label: String(stop.order),
        type: 'customer' as const,
        customerId: stop.customerId,
        order: stop.order
      };
      
      return marker;
    }).filter(Boolean) as MarkerData[];
    
    return markers;
  };

  const loadRouteOnMap = async (routeData: Route) => {
    if (!routeData.stops || routeData.stops.length === 0) return;
    if (!routeData.optimized) return;
    if (!isGoogleMapsLoaded) return;

    const depot = { lat: 40.9913, lng: 29.0236 };
    
    const waypoints = routeData.stops.map(stop => {
      const customer = stop.customer || customers.find(c => c.id === stop.customerId);
      return {
        lat: customer?.latitude || 0,
        lng: customer?.longitude || 0
      };
    });

    try {
      googleMapsService.initializeServices();
      
      const directions = await googleMapsService.getDirections(
        depot,
        waypoints,
        depot
      );
      
      if (directions) {
        setMapDirections(directions);
      }
    } catch (error) {
      console.error('Error loading route on map:', error);
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

  // DÜZELTİLMİŞ KOPYALAMA FONKSİYONU
  const handleDuplicate = async () => {
    if (!route) return;
    
    try {
      // Stop'ları temizle ve sıfırla
      const cleanStops = route.stops.map((stop, index) => ({
        ...stop,
        id: `temp-${Date.now()}-${index}`, // Geçici ID
        routeId: '', // Route ID boş bırak
        status: 'pending' as const,
        actualArrival: undefined,
        completedAt: undefined,
        deliveryProof: undefined,
        failureReason: undefined,
        order: index + 1
      }));
      
      // Yeni rota oluştur
      const newRoute: Partial<Route> = {
        name: `${route.name} (Kopya)`,
        date: new Date(), // Bugünün tarihi
        driverId: route.driverId,
        vehicleId: route.vehicleId,
        depotId: route.depotId,
        status: 'draft',
        stops: cleanStops,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        totalDeliveries: route.totalDeliveries,
        completedDeliveries: 0,
        optimized: route.optimized,
        notes: route.notes ? `${route.notes} (Kopya)` : '',
        driver: route.driver,
        vehicle: route.vehicle
      };
      
      console.log('Creating duplicate route:', newRoute);
      
      // Yeni rotayı oluştur
      const created = await routeService.create(newRoute);
      
      console.log('Created route:', created);
      
      if (created && created.id) {
        // Kopyalama başarılı mesajı
        alert(`✅ Rota başarıyla kopyalandı!\n\nYeni rota: ${created.name}`);
        
        // Rotalar sayfasına git (daha güvenli)
        navigate('/routes');
      } else {
        throw new Error('Rota oluşturuldu ancak ID alınamadı');
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      alert('❌ Rota kopyalanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // KOPYALAMA FONKSİYONU - PAYLAŞMAK İÇİN
  const handleCopyRouteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStartJourney = async () => {
    if (!route) return;
    
    // Sürücü ve araç kontrolü
    if (!route.driverId || !route.vehicleId) {
      alert('⚠️ Sefer başlatmak için önce sürücü ve araç ataması yapmalısınız!');
      navigate(`/routes/${route.id}/edit`);
      return;
    }
    
    // Durak kontrolü
    if (!route.stops || route.stops.length === 0) {
      alert('⚠️ Sefer başlatmak için en az bir durak eklemelisiniz!');
      return;
    }
    
    try {
      // Sefer başlat
      const journey = await journeyService.startFromRoute(route.id);
      
      if (journey) {
        alert('✅ Sefer başarıyla başlatıldı! Sizi sefer detay sayfasına yönlendiriyoruz...');
        
        // Journeys sayfasına yönlendir
        setTimeout(() => {
          navigate(`/journeys/${journey.id}`);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sefer başlatma hatası:', error);
      alert(`❌ Sefer başlatılamadı: ${error.message || 'Bilinmeyen bir hata oluştu'}`);
    }
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
        // Optimize edilmiş rotaya customer bilgilerini ekle
        if (optimizedRoute.stops) {
          optimizedRoute.stops = optimizedRoute.stops.map(stop => ({
            ...stop,
            customer: customers.find(c => c.id === stop.customerId) || stop.customer
          }));
        }
        
        setRoute(optimizedRoute);
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

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStopClick = (stopId: string) => {
    setSelectedStopId(stopId);
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

  const calculateProgress = () => {
    if (!route) return 0;
    return Math.round((route.completedDeliveries / route.totalDeliveries) * 100);
  };

  const getDepotLocation = (): LatLng => {
    return { lat: 40.9913, lng: 29.0236 };
  };

  // Harita bileşenini render eden yardımcı fonksiyon
  const renderMapComponent = () => {
    // Google Maps yükleniyor durumu
    if (!isGoogleMapsLoaded && !googleMapsLoadError) {
      return (
        <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl" style={{ height: '650px' }}>
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            </div>
            <p className="text-gray-600 mt-4">Google Maps yükleniyor...</p>
          </div>
        </div>
      );
    }

    // Google Maps yükleme hatası durumu
    if (googleMapsLoadError) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: '650px' }}>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Google Maps API Key eksik</p>
              <p className="text-sm text-gray-500 mt-1">.env dosyasını kontrol edin</p>
            </div>
          </div>
        );
      }
      
      console.warn('Google Maps yüklenemedi, LeafletMapComponent kullanılıyor:', googleMapsLoadError);
      return (
        <div>
          <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Google Maps yüklenemedi. Alternatif harita kullanılıyor.
            </p>
          </div>
          <LeafletMapComponent
            height="650px"
            customers={customers}
            depot={getDepotLocation()}
            stops={route?.stops.map((stop) => ({
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
            })) || []}
          />
        </div>
      );
    }

    // Google Maps başarıyla yüklendi
    if (isGoogleMapsLoaded) {
      return (
        <MapComponent
          height="650px"
          markers={mapMarkers}
          depot={getDepotLocation()}
          directions={route?.optimized ? mapDirections : null}
          customers={customers}
          showTraffic={false}
          selectedCustomerId={selectedStopId ? route?.stops.find(s => s.id === selectedStopId)?.customerId : undefined}
          onCustomerSelect={(customerId) => {
            const stop = route?.stops.find(s => s.customerId === customerId);
            if (stop) setSelectedStopId(stop.id);
          }}
        />
      );
    }

    return null;
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
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50">
          ✓ Kopyalandı!
        </div>
      )}

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
            {/* Sefer Başlat Butonu - draft, planned durumlarında göster */}
            {(route.status === 'draft' || route.status === 'planned') && (
              <button
                onClick={handleStartJourney}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Seferi Başlat
              </button>
            )}
            
            {/* Devam Ediyor ise Sefere Git */}
            {route.status === 'in_progress' && (
              <button
                onClick={async () => {
                  const journey = await journeyService.getByRouteId(route.id);
                  if (journey) {
                    navigate(`/journeys/${journey.id}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Sefere Git
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
              title="CSV Olarak İndir"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleCopyRouteLink}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rota Linkini Kopyala"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rotayı Kopyala"
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
                {route.totalDistance ? `${route.totalDistance.toFixed(1)}` : '0'} <span className="text-sm">km</span>
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
                {route.totalDuration ? formatDuration(route.totalDuration) : '0 dakika'}
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

      {/* Main Content - Harita ve Duraklar YAN YANA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf - Harita (2/3 genişlik) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Map className="w-5 h-5 mr-2" />
              Rota Haritası
            </h2>
            {!route.optimized && route.stops.length > 0 && (
              <span className="text-sm text-orange-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Optimize edilmemiş
              </span>
            )}
          </div>

          {/* Harita Komponenti */}
          {renderMapComponent()}

          {!route.optimized && route.stops.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <strong>Bilgi:</strong> Rota henüz optimize edilmemiş. Optimize Et butonuna basarak rotayı optimize edebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Sağ Taraf - Duraklar Listesi (1/3 genişlik) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Duraklar ({route.stops.length})
            </h2>
          </div>
          
          <div className="max-h-[650px] overflow-y-auto">
            {route.stops.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Bu rotada henüz durak yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {route.stops.map((stop) => (
                  <div 
                    key={stop.id}
                    onClick={() => handleStopClick(stop.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedStopId === stop.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-3 flex-shrink-0">
                        {stop.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {stop.customer?.name || `Müşteri ${stop.customerId}`}
                          </h4>
                          {getStopStatusBadge(stop.status)}
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {stop.customer?.address}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {stop.customer?.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-0.5" />
                              {stop.customer.phone}
                            </span>
                          )}
                          
                          {(stop.serviceTime || stop.customer?.estimatedServiceTime) && (
                            <span className="flex items-center">
                              <Timer className="w-3 h-3 mr-0.5" />
                              {stop.serviceTime || stop.customer?.estimatedServiceTime}dk
                            </span>
                          )}
                          
                          {stop.distance && (
                            <span className="flex items-center">
                              <Navigation className="w-3 h-3 mr-0.5" />
                              {stop.distance}km
                            </span>
                          )}
                        </div>

                        {stop.customer?.timeWindow && (
                          <div className="mt-2 flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {stop.overrideTimeWindow?.start || stop.customer.timeWindow.start} - 
                            {stop.overrideTimeWindow?.end || stop.customer.timeWindow.end}
                          </div>
                        )}

                        {(stop.stopNotes || stop.customer?.notes) && (
                          <div className="mt-2">
                            {stop.stopNotes && (
                              <div className="p-1.5 bg-yellow-50 rounded text-xs text-yellow-700">
                                {stop.stopNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </div>
          
          {route.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notlar:</strong> {route.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;