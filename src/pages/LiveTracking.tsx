// src/pages/LiveTracking.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Zap
} from 'lucide-react';
import { Journey, Route, Driver, Vehicle } from '@/types';
import { journeyService, routeService, driverService, vehicleService } from '@/services/mockData';
import LiveMap from '@/components/tracking/LiveMap';
import VehicleCard from '@/components/tracking/VehicleCard';
import JourneyDetails from '@/components/tracking/JourneyDetails';

const LiveTracking: React.FC = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'delayed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout>();
  const simulationIntervalRef = useRef<NodeJS.Timeout>();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh every 5 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        refreshJourneys();
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Simulate vehicle movement every 3 seconds
  useEffect(() => {
    if (journeys.length > 0 && autoRefresh) {
      simulationIntervalRef.current = setInterval(() => {
        simulateMovement();
      }, 3000);
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [journeys, autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [journeysData, driversData, vehiclesData] = await Promise.all([
        journeyService.getActive(),
        driverService.getAll(),
        vehicleService.getAll()
      ]);
      
      setJourneys(journeysData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshJourneys = async () => {
    try {
      const journeysData = await journeyService.getActive();
      setJourneys(journeysData);
    } catch (error) {
      console.error('Error refreshing journeys:', error);
    }
  };

  const simulateMovement = async () => {
    // Simulate movement for all active journeys
    for (const journey of journeys) {
      if (journey.status === 'in_progress' || journey.status === 'started') {
        await journeyService.simulateMovement(journey.id);
      }
    }
    refreshJourneys();
  };

  const getFilteredJourneys = () => {
    let filtered = [...journeys];

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(j => j.status === 'in_progress' || j.status === 'started');
    } else if (filter === 'delayed') {
      // Mock delayed logic
      filtered = filtered.filter(j => {
        const estimatedTime = j.route.stops[j.currentStopIndex]?.estimatedArrival;
        return estimatedTime && new Date(estimatedTime) < new Date();
      });
    }

    // Apply driver filter
    if (selectedDriverId) {
      filtered = filtered.filter(j => j.route.driverId === selectedDriverId);
    }

    // Apply vehicle filter
    if (selectedVehicleId) {
      filtered = filtered.filter(j => j.route.vehicleId === selectedVehicleId);
    }

    return filtered;
  };

  const getJourneyStatus = (journey: Journey) => {
    switch (journey.status) {
      case 'preparing':
        return { text: 'Hazırlanıyor', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'started':
        return { text: 'Başladı', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'in_progress':
        return { text: 'Devam Ediyor', color: 'text-green-600', bg: 'bg-green-100' };
      case 'completed':
        return { text: 'Tamamlandı', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { text: 'Bilinmiyor', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return Truck;
      case 'van':
        return Car;
      case 'motorcycle':
        return Zap;
      default:
        return Car;
    }
  };

  const handleJourneySelect = (journey: Journey) => {
    setSelectedJourney(journey);
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedDriverId('');
    setSelectedVehicleId('');
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
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
                <span>Otomatik Yenileme</span>
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
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
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
            {/* Status Filter */}
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

            {/* Driver Filter */}
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

            {/* Vehicle Filter */}
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
                {journeys.filter(j => j.status === 'in_progress' || j.status === 'started').length}
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
                {journeys.reduce((sum, j) => sum + j.route.stops.length, 0)}
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
                {journeys.reduce((sum, j) => sum + j.route.completedDeliveries, 0)}
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
                {Math.round(
                  journeys.reduce((sum, j) => sum + (j.liveLocation?.speed || 0), 0) / 
                  (journeys.length || 1)
                )} km/h
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
              <h2 className="text-lg font-semibold text-gray-900">
                Harita Görünümü
              </h2>
            </div>
            <div className="p-4">
              <LiveMap
                journeys={filteredJourneys}
                selectedJourneyId={selectedJourney?.id}
                onJourneySelect={handleJourneySelect}
                height="600px"
              />
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
                filteredJourneys.map(journey => (
                  <VehicleCard
                    key={journey.id}
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

      {/* Journey Details Modal */}
      {selectedJourney && (
        <JourneyDetails
          journey={selectedJourney}
          onClose={() => setSelectedJourney(null)}
        />
      )}
    </div>
  );
};

export default LiveTracking;