import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  Truck,
  User,
  Plus,
  Save,
  Send,
  AlertCircle,
  Sparkles,
  Loader2,
  Map,
  Navigation,
  Zap
} from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import StopsList from './StopsList';
import MapComponent from '@/components/maps/MapComponent';
import LeafletMapComponent from '@/components/maps/LeafletMapComponent';
import { Route, Customer, Driver, Vehicle, Depot, RouteStop } from '@/types';
import { LatLng, MarkerData, OptimizationWaypoint } from '@/types/maps';
import { 
  customerService, 
  driverService, 
  vehicleService, 
  depotService 
} from '@/services/mockData';
import { googleMapsService } from '@/services/googleMapsService';
import { simpleOptimizationService } from '@/services/simpleOptimizationService';

// Stop data interface for managing customer overrides
interface StopData {
  customer: Customer;
  overrideTimeWindow?: { start: string; end: string };
  overridePriority?: 'high' | 'normal' | 'low';
  serviceTime?: number;
  stopNotes?: string;
}

interface RouteFormProps {
  initialData?: Route;
  onSubmit: (data: Partial<Route>) => void;
  onSaveAsDraft?: (data: Partial<Route>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const RouteForm: React.FC<RouteFormProps> = ({
  initialData,
  onSubmit,
  onSaveAsDraft,
  loading = false,
  isEdit = false
}) => {
  // Form State
  const [formData, setFormData] = useState<Partial<Route>>({
    name: initialData?.name || '',
    date: initialData?.date || new Date(),
    driverId: initialData?.driverId || '',
    vehicleId: initialData?.vehicleId || '',
    depotId: initialData?.depotId || '1',
    notes: initialData?.notes || '',
    stops: initialData?.stops || []
  });

  // Lists State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Stops with override data
  const [stopsData, setStopsData] = useState<StopData[]>([]);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 40.9869, lng: 29.0252 });
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'duration'>('distance');
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>([]);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);

  // Load lists on mount
  useEffect(() => {
    loadLists();
  }, []);

  // Initialize stops from initial data
  useEffect(() => {
    if (initialData?.stops && customers.length > 0) {
      const initialStops: StopData[] = initialData.stops
        .map(stop => {
          const customer = customers.find(c => c.id === stop.customerId);
          if (!customer) return null;
          
          return {
            customer,
            overrideTimeWindow: stop.overrideTimeWindow,
            overridePriority: stop.overridePriority,
            serviceTime: stop.serviceTime,
            stopNotes: stop.stopNotes
          };
        })
        .filter(Boolean) as StopData[];
      
      setStopsData(initialStops);
    }
  }, [initialData, customers]);

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [customersData, driversData, vehiclesData, depotsData] = await Promise.all([
        customerService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        depotService.getAll()
      ]);

      setCustomers(customersData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setDepots(depotsData);
      
      // Set map center to default depot
      const defaultDepot = depotsData.find(d => d.isDefault);
      if (defaultDepot) {
        setMapCenter({ lat: defaultDepot.latitude, lng: defaultDepot.longitude });
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    if (!stopsData.find(s => s.customer.id === customer.id)) {
      setStopsData([...stopsData, { 
        customer,
        serviceTime: customer.estimatedServiceTime || 10
      }]);
    }
  };

  const handleRemoveCustomer = (customerId: string) => {
    setStopsData(stopsData.filter(s => s.customer.id !== customerId));
    // Optimizasyon sıralamasını temizle
    setOptimizedOrder([]);
    // Clear directions when removing customer
    if (stopsData.length <= 2) {
      setMapDirections(null);
    }
  };

  const handleReorderStops = (reorderedStops: StopData[]) => {
    setStopsData(reorderedStops);
    // Manuel sıralama yapıldığında optimizasyon sıralamasını temizle
    setOptimizedOrder([]);
    setMapDirections(null);
  };

  const handleUpdateStop = (index: number, updates: Partial<StopData>) => {
    const newStops = [...stopsData];
    newStops[index] = { ...newStops[index], ...updates };
    setStopsData(newStops);
  };

  // GERÇEK OPTİMİZASYON FONKSİYONU
  const handleOptimize = async () => {
    if (stopsData.length < 2) {
      alert('Optimizasyon için en az 2 durak gerekli!');
      return;
    }

    const selectedDepot = depots.find(d => d.id === formData.depotId);
    if (!selectedDepot) {
      alert('Lütfen bir depo seçin!');
      return;
    }

    setOptimizing(true);
    
    try {
      // Depo konumu
      const depotLocation = {
        lat: selectedDepot.latitude,
        lng: selectedDepot.longitude
      };

      // Google Maps kullanılıyorsa ve yüklüyse
      if (useGoogleMaps && window.google && window.google.maps) {
        // Google Maps servisleri initialize et
        googleMapsService.initializeServices();
        
        // Waypoints oluştur
        const waypoints = stopsData.map(stop => 
          googleMapsService.customerToWaypoint(stop.customer, {
            timeWindow: stop.overrideTimeWindow,
            priority: stop.overridePriority,
            serviceTime: stop.serviceTime
          })
        );

        // Google ile optimize et
        const result = await googleMapsService.optimizeRoute(
          depotLocation,
          waypoints,
          optimizationMode
        );

        if (result) {
          // Optimize edilmiş sırayı kaydet
          setOptimizedOrder(result.optimizedOrder);
          
          // Optimize edilmiş sırayla stops'ları yeniden düzenle
          const optimizedStops = result.optimizedOrder.map(index => stopsData[index]);
          setStopsData(optimizedStops);
          
          // Haritada göster
          if (result.route) {
            setMapDirections(result.route);
            setShowMap(true);
          }

          // Kullanıcıya bilgi ver
          alert(`✅ Rota optimize edildi!\n\n` +
                `📍 Toplam Mesafe: ${result.totalDistance.toFixed(1)} km\n` +
                `⏱️ Tahmini Süre: ${result.totalDuration} dakika\n` +
                `🗺️ Google Maps ile optimize edildi\n` +
                `${optimizationMode === 'distance' ? '🎯 En kısa mesafe' : '⚡ En hızlı rota'}`);
        }
      } else {
        // Basit algoritma kullan
        const customersToOptimize = stopsData.map(stop => ({
          ...stop.customer,
          priority: stop.overridePriority || stop.customer.priority,
          timeWindow: stop.overrideTimeWindow || stop.customer.timeWindow,
          estimatedServiceTime: stop.serviceTime || stop.customer.estimatedServiceTime || 10
        }));

        const result = optimizationMode === 'distance' 
          ? simpleOptimizationService.optimizeRoute(depotLocation, customersToOptimize, 'distance')
          : simpleOptimizationService.optimizeWithTimeWindows(depotLocation, customersToOptimize);

        if (result) {
          // Optimize edilmiş sırayı kaydet
          setOptimizedOrder(result.optimizedOrder);
          
          // Optimize edilmiş sırayla stops'ları yeniden düzenle
          const optimizedStops = result.optimizedOrder.map(index => stopsData[index]);
          setStopsData(optimizedStops);
          
          // Haritayı göster
          setShowMap(true);

          let message = `✅ Rota optimize edildi!\n\n` +
                       `📍 Toplam Mesafe: ${result.totalDistance.toFixed(1)} km\n` +
                       `⏱️ Tahmini Süre: ${result.estimatedDuration} dakika\n` +
                       `${optimizationMode === 'distance' ? '🎯 En kısa mesafe' : '⚡ En hızlı rota'}`;
          
          if ('violations' in result && result.violations.length > 0) {
            message += `\n\n⚠️ Zaman Penceresi Uyarıları:\n${result.violations.join('\n')}`;
          }
          
          alert(message);
        }
      }
    } catch (error) {
      console.error('Optimization error:', error);
      alert('Optimizasyon sırasında bir hata oluştu.');
    } finally {
      setOptimizing(false);
    }
  };

  // Haritada rota göster
  const showRouteOnMap = async () => {
    if (stopsData.length === 0) {
      alert('Haritada göstermek için durak ekleyin!');
      return;
    }

    const selectedDepot = depots.find(d => d.id === formData.depotId);
    if (!selectedDepot) {
      alert('Lütfen bir depo seçin!');
      return;
    }

    // Google Maps kullanılıyorsa directions API ile rota çiz
    if (useGoogleMaps && window.google && window.google.maps) {
      const depotLocation: LatLng = {
        lat: selectedDepot.latitude,
        lng: selectedDepot.longitude
      };

      const waypointLocations = stopsData.map(stop => ({
        lat: stop.customer.latitude,
        lng: stop.customer.longitude
      }));

      // Initialize services if needed
      googleMapsService.initializeServices();

      // Get directions
      const directions = await googleMapsService.getDirections(
        depotLocation,
        waypointLocations,
        depotLocation
      );

      if (directions) {
        setMapDirections(directions);
      }
    }
    
    setShowMap(true);
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    
    // Add service time for each stop
    stopsData.forEach(stop => {
      totalMinutes += stop.serviceTime || stop.customer.estimatedServiceTime || 10;
    });
    
    // Add estimated travel time between stops
    if (stopsData.length > 0) {
      totalMinutes += stopsData.length * 15;
    }
    
    return totalMinutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create stops from stops data
    const stops: RouteStop[] = stopsData.map((stopData, index) => ({
      id: `${Date.now()}-${index}`,
      routeId: initialData?.id || '',
      customerId: stopData.customer.id,
      customer: stopData.customer,
      order: index + 1,
      status: 'pending',
      overrideTimeWindow: stopData.overrideTimeWindow,
      overridePriority: stopData.overridePriority,
      serviceTime: stopData.serviceTime,
      stopNotes: stopData.stopNotes,
      estimatedArrival: new Date(),
      distance: 0
    }));

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      totalDuration: calculateTotalDuration(),
      status: 'planned',
      optimized: optimizedOrder.length > 0 // Optimize edilmiş mi?
    };

    onSubmit(routeData);
  };

  const handleSaveDraft = () => {
    const stops: RouteStop[] = stopsData.map((stopData, index) => ({
      id: `${Date.now()}-${index}`,
      routeId: initialData?.id || '',
      customerId: stopData.customer.id,
      customer: stopData.customer,
      order: index + 1,
      status: 'pending',
      overrideTimeWindow: stopData.overrideTimeWindow,
      overridePriority: stopData.overridePriority,
      serviceTime: stopData.serviceTime,
      stopNotes: stopData.stopNotes,
      estimatedArrival: new Date()
    }));

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      totalDuration: calculateTotalDuration(),
      status: 'draft'
    };

    if (onSaveAsDraft) {
      onSaveAsDraft(routeData);
    }
  };

  // Get depot location
  const getDepotLocation = (): LatLng | undefined => {
    const selectedDepot = depots.find(d => d.id === formData.depotId);
    return selectedDepot ? {
      lat: selectedDepot.latitude,
      lng: selectedDepot.longitude
    } : undefined;
  };

  // Handle map load - Google Maps servisleri başlatma
  const handleMapLoad = (map: google.maps.Map) => {
    googleMapsService.initializeServices(map);
    console.log('✅ Google Maps servisleri yüklendi');
  };

  if (loadingLists) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rota Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Kadıköy Sabah Turu"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sürücü
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Sürücü Seçin</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} {driver.status === 'busy' && '(Meşgul)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Araç
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Araç Seçin</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Depot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.depotId}
                onChange={(e) => setFormData({ ...formData, depotId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
              >
                {depots.map(depot => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name} {depot.isDefault && '(Varsayılan)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Rota ile ilgili notlarınız..."
            />
          </div>
        </div>
      </div>

      {/* Customer Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Müşteri Seçimi</h2>
          <div className="flex items-center space-x-3">
            {stopsData.length > 0 && (
              <>
                <div className="text-sm text-gray-600">
                  Toplam: <span className="font-semibold">{stopsData.length} durak</span>
                </div>
                <div className="text-sm text-gray-600">
                  Süre: <span className="font-semibold">{calculateTotalDuration()} dk</span>
                </div>
              </>
            )}
            
            {/* Map Toggle */}
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
            >
              <Map className="w-4 h-4 mr-1.5" />
              {showMap ? 'Haritayı Gizle' : 'Haritayı Göster'}
            </button>

            {/* Show Route Button */}
            {stopsData.length > 0 && (
              <button
                type="button"
                onClick={showRouteOnMap}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <Navigation className="w-4 h-4 mr-1.5" />
                Rotayı Göster
              </button>
            )}

            {/* Optimization Mode Selector */}
            {stopsData.length > 1 && (
              <select
                value={optimizationMode}
                onChange={(e) => setOptimizationMode(e.target.value as 'distance' | 'duration')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="distance">En Kısa Mesafe</option>
                <option value="duration">En Hızlı Rota</option>
              </select>
            )}

            {/* Optimize Button */}
            <button
              type="button"
              onClick={handleOptimize}
              disabled={stopsData.length < 2 || optimizing}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Optimize Ediliyor...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1.5" />
                  {useGoogleMaps ? 'Google ile Optimize Et' : 'Optimize Et'}
                </>
              )}
            </button>
          </div>
        </div>

        <CustomerSelector
          customers={customers}
          selectedCustomers={stopsData.map(s => s.customer)}
          onSelect={handleAddCustomer}
        />
      </div>

      {/* Map */}
      {showMap && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Rota Haritası</h2>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={useGoogleMaps}
                  onChange={(e) => setUseGoogleMaps(e.target.checked)}
                  className="mr-2"
                />
                Google Maps kullan
              </label>
            </div>
          </div>
          
          {useGoogleMaps ? (
            // Google Maps
            <MapComponent
              center={mapCenter}
              height="500px"
              markers={stopsData.map((stop, index) => ({
                position: {
                  lat: stop.customer.latitude,
                  lng: stop.customer.longitude
                },
                title: stop.customer.name,
                label: String(index + 1),
                type: 'customer' as const,
                customerId: stop.customer.id
              }))}
              depot={getDepotLocation()}
              directions={mapDirections}
              customers={customers}
              optimizedOrder={optimizedOrder}
              showTraffic={true}
              onMapLoad={handleMapLoad}
            />
          ) : (
            // Leaflet Map (Ücretsiz alternatif)
            <LeafletMapComponent
              center={mapCenter}
              height="500px"
              customers={customers}
              depot={getDepotLocation()}
              stops={stopsData.map((stop, index) => ({
                customer: stop.customer,
                order: index + 1
              }))}
            />
          )}
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>📍 Rota Bilgisi:</strong> {useGoogleMaps ? 'Google Maps' : 'OpenStreetMap'} kullanılıyor. 
              {optimizedOrder.length > 0 && ' Rota optimize edildi ve sıralama güncellendi.'}
            </p>
          </div>
        </div>
      )}

      {/* Stops List */}
      {stopsData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Duraklar ({stopsData.length})
          </h2>
          
          <StopsList
            stops={stopsData}
            onRemove={handleRemoveCustomer}
            onReorder={handleReorderStops}
            onUpdateStop={handleUpdateStop}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        {onSaveAsDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || stopsData.length === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Taslak Kaydet
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || stopsData.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {isEdit ? 'Güncelle' : 'Rota Oluştur'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RouteForm;