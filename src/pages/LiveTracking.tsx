// frontend/src/pages/LiveTracking.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Navigation, 
  Car, 
  Clock, 
  MapPin, 
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Package,
  User,
  Phone,
  Pause,
  Play,
  ChevronRight,
  X,
  Truck,
  Info,
  Eye,
  EyeOff,
  Bell,
  Signal,
  SignalLow,
  WifiOff
} from 'lucide-react';
import { Journey, Driver, Vehicle } from '@/types';
import { journeyService } from '@/services/journey.service';
import { driverService } from '@/services/driver.service';
import { vehicleService } from '@/services/vehicle.service';
import trackingService, { ActiveVehicle, LiveLocation } from '@/services/tracking.service';
import LiveMap from '@/components/tracking/LiveMap';
import VehicleCard from '@/components/tracking/VehicleCard';
import JourneyDetails from '@/components/tracking/JourneyDetails';

interface EmergencyAlert {
  journeyId: number;
  vehicleId: number;
  driverId: number;
  message: string;
  location: LiveLocation;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const LiveTracking: React.FC = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showJourneyDetails, setShowJourneyDetails] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'delayed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const selectedJourneyRef = useRef<Journey | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const workspaceId = parseInt(localStorage.getItem('workspaceId') || '0');

  // SignalR bağlantısını düzgün kur
  useEffect(() => {
    let isMounted = true;
    
    const initializeTracking = async () => {
      try {
        // Önce SignalR'a bağlan
        await trackingService.connect();
        
        // Bağlantı durumunu kontrol et
        const connected = trackingService.isConnected();
        
        if (isMounted) {
          setIsConnected(connected);
          
          if (connected) {
            // Workspace tracking'e katıl
            if (workspaceId) {
              await trackingService.joinWorkspaceTracking(workspaceId);
            }

            // Aktif araçları al
            try {
              const activeVehiclesData = await trackingService.getActiveVehicles();
              if (isMounted) {
                setActiveVehicles(activeVehiclesData);
              }
            } catch (error) {
              console.error('Error getting active vehicles:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize tracking:', error);
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    initializeTracking();

    // Cleanup
    return () => {
      isMounted = false;
      // Workspace'ten ayrıl
      if (workspaceId) {
        trackingService.leaveWorkspaceTracking(workspaceId).catch(console.error);
      }
    };
  }, [workspaceId]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshJourneysOptimized();
      }, 10000); // 10 saniyede bir güncelle
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Vehicle update listener - SignalR
  useEffect(() => {
    const unsubscribeVehicle = trackingService.onVehicleUpdate((data) => {
      console.log('Vehicle update received:', data);
      
      // Journey'leri güncelle
      setJourneys(prev => {
        const updated = [...prev];
        const index = updated.findIndex(j => j.id === data.journeyId?.toString());
        
        if (index >= 0 && data.location) {
          updated[index] = {
            ...updated[index],
            liveLocation: {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              speed: data.location.speed,
              heading: data.location.heading,
              accuracy: data.location.accuracy,
              timestamp: new Date()
            },
            currentStopIndex: data.currentStopIndex || updated[index].currentStopIndex
          };
        }
        
        return updated;
      });

      // Seçili journey güncellendiyse
      setSelectedJourney(prev => {
        if (prev && prev.id === data.journeyId?.toString() && data.location) {
          return {
            ...prev,
            liveLocation: data.location,
            currentStopIndex: data.currentStopIndex || prev.currentStopIndex
          };
        }
        return prev;
      });

      lastUpdateRef.current = Date.now();
    });

    return () => {
      unsubscribeVehicle();
    };
  }, []);

  // Emergency alert listener
  useEffect(() => {
    const unsubscribeEmergency = trackingService.onEmergencyAlert((alert: EmergencyAlert) => {
      console.log('🚨 Emergency alert received:', alert);
      
      // Alert'i listeye ekle
      setEmergencyAlerts(prev => [alert, ...prev].slice(0, 10)); // Son 10 alert
      
      // Panel'i göster
      setShowEmergencyPanel(true);
      
      // Tarayıcı bildirimi gönder
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Acil Durum!', {
          body: `${alert.message} - Araç: ${alert.vehicleId}`,
          icon: '/emergency-icon.png'
        });
      }
    });

    return () => {
      unsubscribeEmergency();
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      trackingService.disconnect();
    };
  }, []);

  // ✅ V44 DÜZELTME: getActiveJourneys() kullan
  const loadData = async () => {
    setLoading(true);
    try {
      // API'den verileri çek
      const [activeJourneysData, driversData, vehiclesData] = await Promise.all([
        journeyService.getActiveJourneys(), // ✅ V44: Yeni optimize edilmiş endpoint
        driverService.getAll(),
        vehicleService.getAll()
      ]);
      
      console.log('Loaded active journeys with routes:', activeJourneysData);
      
      setJourneys(activeJourneysData);
      setDrivers(driversData);
      setVehicles(vehiclesData);

      // İlk yüklemede ilk journey'i seç
      if (!selectedJourney && activeJourneysData.length > 0 && loading) {
        setSelectedJourney(activeJourneysData[0]);
        selectedJourneyRef.current = activeJourneysData[0];
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ V44 DÜZELTME: Optimize edilmiş refresh
  const refreshJourneysOptimized = async () => {
    try {
      const activeJourneysData = await journeyService.getActiveJourneys(); // ✅ V44: Yeni endpoint
      
      // Veri değişmemişse güncelleme yapma
      const hasChanges = JSON.stringify(activeJourneysData) !== JSON.stringify(journeys);
      
      if (hasChanges) {
        setJourneys(activeJourneysData);
        
        // Seçili journey güncellemesi
        const currentSelectedId = selectedJourneyRef.current?.id;
        if (currentSelectedId) {
          const updated = activeJourneysData.find((j: any) => j.id === currentSelectedId);
          if (updated) {
            const hasSelectedChanged = JSON.stringify(updated) !== JSON.stringify(selectedJourneyRef.current);
            if (hasSelectedChanged) {
              setSelectedJourney(updated);
              selectedJourneyRef.current = updated;
            }
          }
        }
        
        lastUpdateRef.current = Date.now();
      }

      // SignalR'dan da aktif araçları güncelle
      if (isConnected) {
        const activeVehiclesData = await trackingService.getActiveVehicles();
        setActiveVehicles(activeVehiclesData);
      }
    } catch (error) {
      console.error('Error refreshing journeys:', error);
    }
  };

  // selectedJourneyRef'i güncelle
  useEffect(() => {
    selectedJourneyRef.current = selectedJourney;
  }, [selectedJourney]);

  const getFilteredJourneys = () => {
    let filtered = [...journeys];

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(j => 
        j.status === 'InProgress' || 
        j.status === 200 || // InProgress enum value
        j.status === 'Planned' || 
        j.status === 100 // Planned enum value
      );
    } else if (filter === 'delayed') {
      filtered = filtered.filter(j => {
        if (!j.route?.stops || !j.currentStopIndex) return false;
        const currentStop = j.route.stops[j.currentStopIndex];
        const estimatedTime = currentStop?.estimatedArrivalTime;
        return estimatedTime && new Date(estimatedTime) < new Date();
      });
    }

    // Apply driver filter
    if (selectedDriverId) {
      filtered = filtered.filter(j => j.driverId?.toString() === selectedDriverId);
    }

    // Apply vehicle filter
    if (selectedVehicleId) {
      filtered = filtered.filter(j => j.vehicleId?.toString() === selectedVehicleId);
    }

    return filtered;
  };

  const getJourneyStatus = (journey: any) => {
    const status = journey.status;
    
    // Enum değerlerini kontrol et
    if (status === 100 || status === 'Planned') {
      return { text: 'Planlandı', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else if (status === 200 || status === 'InProgress') {
      return { text: 'Devam Ediyor', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (status === 300 || status === 'Completed') {
      return { text: 'Tamamlandı', color: 'text-gray-600', bg: 'bg-gray-100' };
    } else if (status === 400 || status === 'Cancelled') {
      return { text: 'İptal Edildi', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (status === 500 || status === 'OnHold') {
      return { text: 'Beklemede', color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    
    return { text: 'Bilinmiyor', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const handleJourneySelect = useCallback((journey: any) => {
    if (journey.id !== selectedJourney?.id) {
      setSelectedJourney(journey);
      selectedJourneyRef.current = journey;
    }
  }, [selectedJourney]);

  const handleViewDetails = () => {
    if (selectedJourney) {
      setShowJourneyDetails(true);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedDriverId('');
    setSelectedVehicleId('');
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    await loadData();
    setLoading(false);
  };

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="w-5 h-5 text-red-500" />;
    if (journeys.length === 0) return <SignalLow className="w-5 h-5 text-yellow-500" />;
    return <Signal className="w-5 h-5 text-green-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getLastUpdateTime = () => {
    const diff = Math.floor((Date.now() - lastUpdateRef.current) / 1000);
    if (diff < 60) return `${diff} saniye önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    return `${Math.floor(diff / 3600)} saat önce`;
  };

  const getActiveJourneyCount = () => {
    return journeys.filter(j => 
      j.status === 200 || j.status === 'InProgress' || 
      j.status === 100 || j.status === 'Planned'
    ).length;
  };

  const getTotalStops = () => {
    return journeys.reduce((sum, j) => {
      const stops = j.totalStops || j.route?.stops?.length || 0;
      return sum + stops;
    }, 0);
  };

  const getCompletedDeliveries = () => {
    return journeys.reduce((sum, j) => {
      const completed = j.completedStops || 0;
      return sum + completed;
    }, 0);
  };

  const getTotalDeliveries = () => {
    return getTotalStops();
  };

  const getAverageSpeed = () => {
    const speeds = journeys
      .map(j => j.liveLocation?.speed || 0)
      .filter(speed => speed > 0);
    
    if (speeds.length === 0) return 0;
    
    const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    return Math.round(avgSpeed);
  };

  const filteredJourneys = getFilteredJourneys();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canlı Takip</h1>
          <p className="text-gray-600 mt-1">
            {filteredJourneys.length} aktif sefer takip ediliyor
            {autoRefresh && (
              <span className="text-xs text-gray-500 ml-2">
                • Son güncelleme: {getLastUpdateTime()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Bağlı' : 'Bağlantı Yok'}
            </span>
          </div>

          {/* Emergency Alert Button */}
          {emergencyAlerts.length > 0 && (
            <button
              onClick={() => setShowEmergencyPanel(!showEmergencyPanel)}
              className="relative p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {emergencyAlerts.length}
              </span>
            </button>
          )}

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Otomatik (10sn)</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Duraklatıldı</span>
              </>
            )}
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filtrele</span>
            {(filter !== 'all' || selectedDriverId || selectedVehicleId) && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[filter !== 'all', selectedDriverId, selectedVehicleId].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtreler</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Temizle
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durum
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="delayed">Gecikmeli</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sürücü
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Sürücüler</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Araç
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tüm Araçlar</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Sefer</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getActiveJourneyCount()}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Durak</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getTotalStops()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getCompletedDeliveries()}/{getTotalDeliveries()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ort. Hız</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {getAverageSpeed()} km/h
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Harita Görünümü
                </h2>
                {selectedJourney && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center">
                      <Car className="w-4 h-4 mr-1" />
                      {selectedJourney.vehiclePlateNumber || 'Araç Yok'} - {selectedJourney.driverName || 'Sürücü Yok'}
                    </span>
                    <button
                      onClick={handleViewDetails}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full flex items-center transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detaylar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              {filteredJourneys.length === 0 ? (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height: '600px' }}>
                  <div className="text-center">
                    <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Aktif sefer bulunmuyor</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Rotalar sayfasından yeni sefer başlatabilirsiniz
                    </p>
                  </div>
                </div>
              ) : selectedJourney && selectedJourney.route ? (
                <LiveMap
                  journeys={[selectedJourney]}
                  selectedJourneyId={selectedJourney.id}
                  onJourneySelect={handleJourneySelect}
                  height="600px"
                />
              ) : selectedJourney && !selectedJourney.route ? (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height: '600px' }}>
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Rota bilgisi yüklenemedi</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Lütfen sayfayı yenileyin veya başka bir sefer seçin
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg" style={{ height: '600px' }}>
                  <div className="text-center">
                    <Info className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Lütfen takip edilecek aracı seçin</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Sağdaki listeden bir araç seçebilirsiniz
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Aktif Araçlar ({filteredJourneys.length})
              </h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredJourneys.length === 0 ? (
                <div className="p-8 text-center">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aktif sefer bulunmuyor</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Rotalar sayfasından yeni sefer başlatabilirsiniz
                  </p>
                </div>
              ) : (
                filteredJourneys.map((journey, index) => (
                  <VehicleCard
                    key={`vehicle-${journey.id || index}`}
                    journey={journey}
                    selected={selectedJourney?.id === journey.id}
                    onClick={() => handleJourneySelect(journey)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Panel */}
      {showEmergencyPanel && emergencyAlerts.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-96 max-h-80 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              Acil Durumlar
            </h3>
            <button
              onClick={() => setShowEmergencyPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            {emergencyAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-white ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Araç #{alert.vehicleId}</span>
                  <span className="text-xs opacity-90">
                    {new Date(alert.timestamp).toLocaleTimeString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm">{alert.message}</p>
                {alert.location && (
                  <p className="text-xs mt-1 opacity-90">
                    📍 {alert.location.latitude.toFixed(6)}, {alert.location.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey Details Modal */}
      {showJourneyDetails && selectedJourney && (
        <JourneyDetails
          journey={selectedJourney}
          onClose={() => setShowJourneyDetails(false)}
        />
      )}
    </div>
  );
};

export default LiveTracking;