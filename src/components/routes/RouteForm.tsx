import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Route, Customer, Driver, Vehicle, Depot, RouteStop } from '@/types';
import { LatLng, MarkerData, OptimizationWaypoint } from '@/types/maps';
import { customerService } from '@/services/customer.service';
import { driverService } from '@/services/driver.service';
import { vehicleService } from '@/services/vehicle.service';
import { depotService } from '@/services/depot.service';
import { routeService } from '@/services/route.service';
import { googleMapsService } from '@/services/googleMapsService';

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
  onFormChange?: (data: Partial<Route>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const formatDuration = (totalMinutes: number): string => {
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

const STORAGE_KEY = 'createRouteFormData';

const RouteForm: React.FC<RouteFormProps> = ({
  initialData,
  onSubmit,
  onSaveAsDraft,
  onFormChange,
  loading = false,
  isEdit = false
}) => {
  const loadSavedData = useCallback(() => {
    if (!isEdit && !initialData) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('Loading saved form data from localStorage:', parsed);
          if (parsed.date) {
            parsed.date = new Date(parsed.date);
          }
          return parsed;
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return null;
  }, [isEdit, initialData]);

  const savedData = loadSavedData();
  const [formData, setFormData] = useState<Partial<Route>>({
    name: savedData?.name || initialData?.name || '',
    date: savedData?.date || initialData?.date || new Date(),
    driverId: savedData?.driverId || initialData?.driverId || '',
    vehicleId: savedData?.vehicleId || initialData?.vehicleId || '',
    depotId: savedData?.depotId || initialData?.depotId || '',
    notes: savedData?.notes || initialData?.notes || '',
    stops: savedData?.stops || initialData?.stops || [],
    totalDuration: savedData?.totalDuration || initialData?.totalDuration || 0,
    totalDistance: savedData?.totalDistance || initialData?.totalDistance || 0,
    optimized: savedData?.optimized || initialData?.optimized || false
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [stopsData, setStopsData] = useState<StopData[]>(() => {
    if (savedData?.stops && savedData.stops.length > 0) {
      return savedData.stops.map((stop: any) => ({
        customer: stop.customer,
        overrideTimeWindow: stop.overrideTimeWindow,
        overridePriority: stop.overridePriority,
        serviceTime: stop.serviceTime,
        stopNotes: stop.stopNotes
      }));
    }
    return [];
  });
  
  const initialStopsLoadedRef = useRef(false);

  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 40.9869, lng: 29.0252 });
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'duration'>('distance');
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>(() => {
    return savedData?.optimized && savedData?.stops ? 
      savedData.stops.map((_: any, index: number) => index) : [];
  });

  const saveToLocalStorage = useCallback((data: Partial<Route>) => {
    if (!isEdit) {
      try {
        const toSave = {
          ...data,
          stops: stopsData.map((stop, index) => ({
            ...stop,
            order: index + 1,
            customerId: stop.customer.id,
            customer: stop.customer
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        console.log('Form data saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [isEdit, stopsData]);

  const updateFormData = useCallback((updates: Partial<Route>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      saveToLocalStorage(newData);
      if (onFormChange) {
        onFormChange(newData);
      }
      return newData;
    });
  }, [saveToLocalStorage, onFormChange]);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (initialStopsLoadedRef.current || !initialData?.stops || initialData.stops.length === 0) {
      return;
    }

    if (customers.length === 0) {
      return;
    }

    const initialStops: StopData[] = initialData.stops
      .map(stop => {
        let customer = stop.customer;
        
        if (!customer) {
          customer = customers.find(c => c.id.toString() === stop.customerId.toString());
        }
        
        if (!customer) {
          console.warn(`Customer not found for stop with customerId: ${stop.customerId}`);
          return null;
        }
        
        return {
          customer,
          overrideTimeWindow: stop.overrideTimeWindow,
          overridePriority: stop.overridePriority,
          serviceTime: stop.serviceTime || customer.estimatedServiceTime || 10,
          stopNotes: stop.stopNotes
        };
      })
      .filter(Boolean) as StopData[];
    
    if (initialStops.length > 0) {
      setStopsData(initialStops);
      initialStopsLoadedRef.current = true;
      
      if (initialData.optimized) {
        setOptimizedOrder(initialStops.map((_, index) => index));
        updateFormData({ optimized: true });
      }
    }
  }, [initialData, customers]);

  useEffect(() => {
    if (stopsData.length > 0) {
      const timer = setTimeout(() => updateMapRoute(), 500);
      return () => clearTimeout(timer);
    }
  }, [stopsData]);

  useEffect(() => {
    if (stopsData.length > 0 || formData.name || formData.driverId || formData.vehicleId) {
      saveToLocalStorage(formData);
    }
  }, [stopsData, formData, saveToLocalStorage]);

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [customersData, driversData, vehiclesData, depotsData] = await Promise.all([
        customerService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        depotService.getAll()
      ]);

      const validCustomers = customersData.filter(c => 
        typeof c.id === 'number' || (typeof c.id === 'string' && !c.id.startsWith('google-'))
      );

      setCustomers(validCustomers);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setDepots(depotsData);
      
      const defaultDepot = depotsData.find(d => d.isDefault);
      if (defaultDepot) {
        setMapCenter({ lat: defaultDepot.latitude, lng: defaultDepot.longitude });
        
        if (!formData.depotId) {
          updateFormData({ depotId: defaultDepot.id.toString() });
        }
      }

      if (savedData?.stops && savedData.stops.length > 0 && !initialStopsLoadedRef.current) {
        const savedStops: StopData[] = savedData.stops
          .map((stop: any) => {
            const customer = validCustomers.find(c => c.id.toString() === stop.customerId?.toString());
            if (customer) {
              return {
                customer,
                overrideTimeWindow: stop.overrideTimeWindow,
                overridePriority: stop.overridePriority,
                serviceTime: stop.serviceTime || customer.estimatedServiceTime || 10,
                stopNotes: stop.stopNotes
              };
            }
            return null;
          })
          .filter(Boolean) as StopData[];
        
        if (savedStops.length > 0) {
          setStopsData(savedStops);
          console.log('Restored stops from localStorage:', savedStops.length);
        }
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
      alert('⚠️ Bu müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.');
      return;
    }
    
    if (!stopsData.find(s => s.customer.id === customer.id)) {
      const newStopsData = [...stopsData, { 
        customer,
        serviceTime: customer.estimatedServiceTime || 10
      }];
      setStopsData(newStopsData);
      saveToLocalStorage(formData);
    }
  };

  const handleRemoveCustomer = (customerId: string | number) => {
    const newStopsData = stopsData.filter(s => s.customer.id.toString() !== customerId.toString());
    setStopsData(newStopsData);
    setOptimizedOrder([]);
    updateFormData({ optimized: false });
    if (newStopsData.length <= 1) {
      setMapDirections(null);
    }
  };

  const handleReorderStops = (reorderedStops: StopData[]) => {
    setStopsData(reorderedStops);
    setOptimizedOrder([]);
    setMapDirections(null);
    updateFormData({ optimized: false });
  };

  const handleUpdateStop = (index: number, updates: Partial<StopData>) => {
    const newStops = [...stopsData];
    newStops[index] = { ...newStops[index], ...updates };
    setStopsData(newStops);
  };

  const updateMapRoute = async () => {
    if (stopsData.length === 0) return;

    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) return;

    if (window.google && window.google.maps) {
      const depotLocation: LatLng = {
        lat: selectedDepot.latitude,
        lng: selectedDepot.longitude
      };

      const waypointLocations = stopsData.map(stop => ({
        lat: stop.customer.latitude,
        lng: stop.customer.longitude
      }));

      googleMapsService.initializeServices();

      const directions = await googleMapsService.getDirections(
        depotLocation,
        waypointLocations,
        depotLocation
      );

      if (directions) {
        setMapDirections(directions);
        
        if (initialData?.totalDistance && initialData?.totalDuration) {
          updateFormData({
            totalDistance: initialData.totalDistance,
            totalDuration: initialData.totalDuration
          });
        }
      }
    }
  };

  const handleOptimize = async () => {
  if (stopsData.length < 2) {
    alert('Optimizasyon için en az 2 durak gerekli!');
    return;
  }

  const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
  if (!selectedDepot) {
    alert('Lütfen bir depo seçin!');
    return;
  }

  if (!formData.name) {
    alert('Lütfen rota adı girin!');
    return;
  }

  setOptimizing(true);
  
  try {
    // 1. Önce rotayı kaydet (edit modda değilse)
    let routeId = initialData?.id;
    
    if (!routeId) {
      // Yeni rota ise önce kaydet
      const stops: RouteStop[] = stopsData.map((stopData, index) => ({
        id: `${Date.now()}-${index}`,
        routeId: '',
        customerId: stopData.customer.id.toString(),
        customer: stopData.customer,
        order: index + 1,
        status: 'pending',
        serviceTime: stopData.serviceTime,
        stopNotes: stopData.stopNotes,
        estimatedArrival: new Date(),
        distance: 0
      }));

      const routeData: Partial<Route> = {
        ...formData,
        stops,
        totalDeliveries: stops.length,
        status: 'planned',
        optimized: false,
        depot: selectedDepot
      };

      const createdRoute = await routeService.create(routeData);
      routeId = createdRoute.id;
    }

    // 2. Backend'de optimize et
    const optimizedRoute = await routeService.optimize(routeId, optimizationMode);
    
    // 3. Optimize edilmiş stops'ları güncelle
    if (optimizedRoute.stops) {
      const backendOptimizedStops = optimizedRoute.stops
        .sort((a, b) => a.order - b.order)
        .map(stop => {
          const existingStopData = stopsData.find(s => 
            s.customer.id.toString() === stop.customerId.toString()
          );
          return existingStopData || {
            customer: stop.customer || customers.find(c => c.id.toString() === stop.customerId.toString()),
            serviceTime: stop.serviceTime,
            stopNotes: stop.stopNotes
          };
        });
      
      setStopsData(backendOptimizedStops);
      setOptimizedOrder(backendOptimizedStops.map((_, i) => i));
      
      updateFormData({
        totalDuration: optimizedRoute.totalDuration,
        totalDistance: optimizedRoute.totalDistance,
        optimized: true
      });

      // 4. Haritayı güncelle
      await updateMapRoute();
      
      alert(`✅ Rota optimize edildi!\n\n` +
            `📍 Toplam Mesafe: ${optimizedRoute.totalDistance.toFixed(1)} km\n` +
            `⏱️ Tahmini Süre: ${formatDuration(optimizedRoute.totalDuration)}\n` +
            `🗺️ Google Maps ile optimize edildi\n` +
            `${optimizationMode === 'distance' ? '🎯 En kısa mesafe' : '⚡ En hızlı rota'}`);
    }
    
  } catch (error: any) {
    console.error('Optimization error:', error);
    alert('Optimizasyon sırasında bir hata oluştu: ' + (error.response?.data?.message || error.message));
  } finally {
    setOptimizing(false);
  }
};

  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    
    stopsData.forEach(stop => {
      totalMinutes += stop.serviceTime || stop.customer.estimatedServiceTime || 10;
    });
    
    if (stopsData.length > 0) {
      totalMinutes += stopsData.length * 15;
    }
    
    return totalMinutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.driverId || !formData.vehicleId) {
      alert('⚠️ Lütfen sürücü ve araç ataması yapın!');
      return;
    }
    
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) {
      alert('⚠️ Lütfen bir depo seçin!');
      return;
    }
    
    const stops: RouteStop[] = stopsData.map((stopData, index) => {
      if (!stopData.customer) {
        throw new Error(`Durak ${index + 1} için müşteri bilgisi eksik`);
      }
      
      const customer = stopData.customer;
      
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        throw new Error(`Durak ${index + 1} için müşteri henüz veritabanına kaydedilmemiş.`);
      }
      
      let customerId: string;
      if (typeof customer.id === 'number') {
        customerId = customer.id.toString();
      } else if (typeof customer.id === 'string') {
        customerId = customer.id;
      } else {
        throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
      }
      
      return {
        id: isEdit && initialData?.stops?.[index]?.id ? initialData.stops[index].id : `${Date.now()}-${index}`,
        routeId: initialData?.id || '',
        customerId: customerId,
        customer: customer,
        order: index + 1,
        status: 'pending',
        overrideTimeWindow: stopData.overrideTimeWindow,
        overridePriority: stopData.overridePriority,
        serviceTime: stopData.serviceTime,
        stopNotes: stopData.stopNotes,
        estimatedArrival: new Date(),
        distance: 0
      };
    });

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      totalDuration: formData.totalDuration || calculateTotalDuration(),
      totalDistance: formData.totalDistance || 0,
      status: 'planned',
      optimized: formData.optimized || false,
      driver: drivers.find(d => d.id.toString() === formData.driverId?.toString()),
      vehicle: vehicles.find(v => v.id.toString() === formData.vehicleId?.toString()),
      depot: selectedDepot
    };
    
    if (!isEdit) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    onSubmit(routeData);
  };

  const handleSaveDraft = () => {
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    
    const stops: RouteStop[] = stopsData.map((stopData, index) => {
      if (!stopData.customer) {
        throw new Error(`Durak ${index + 1} için müşteri bilgisi eksik`);
      }
      
      const customer = stopData.customer;
      
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        throw new Error(`Durak ${index + 1} için müşteri henüz veritabanına kaydedilmemiş.`);
      }
      
      let customerId: string;
      if (typeof customer.id === 'number') {
        customerId = customer.id.toString();
      } else if (typeof customer.id === 'string') {
        customerId = customer.id;
      } else {
        throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
      }
      
      return {
        id: isEdit && initialData?.stops?.[index]?.id ? initialData.stops[index].id : `${Date.now()}-${index}`,
        routeId: initialData?.id || '',
        customerId: customerId,
        customer: customer,
        order: index + 1,
        status: 'pending',
        overrideTimeWindow: stopData.overrideTimeWindow,
        overridePriority: stopData.overridePriority,
        serviceTime: stopData.serviceTime,
        stopNotes: stopData.stopNotes,
        estimatedArrival: new Date(),
        distance: 0
      };
    });

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      totalDeliveries: stops.length,
      totalDuration: formData.totalDuration || calculateTotalDuration(),
      totalDistance: formData.totalDistance || 0,
      status: 'draft',
      optimized: formData.optimized || false,
      driver: drivers.find(d => d.id.toString() === formData.driverId?.toString()),
      vehicle: vehicles.find(v => v.id.toString() === formData.vehicleId?.toString()),
      depot: selectedDepot
    };

    if (!isEdit) {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (onSaveAsDraft) {
      onSaveAsDraft(routeData);
    }
  };

  const getDepotLocation = (): LatLng | undefined => {
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (selectedDepot) {
      console.log('Selected depot for map:', selectedDepot);
      return {
        lat: selectedDepot.latitude,
        lng: selectedDepot.longitude
      };
    }
    console.log('No depot selected, depotId:', formData.depotId);
    return undefined;
  };

  const handleMapLoad = (map: google.maps.Map) => {
    googleMapsService.initializeServices(map);
  };

  const getMapMarkers = (): MarkerData[] => {
    return stopsData.map((stop, index) => ({
      position: {
        lat: stop.customer.latitude,
        lng: stop.customer.longitude
      },
      title: stop.customer.name,
      label: String(index + 1),
      type: 'customer' as const,
      customerId: stop.customer.id.toString()
    }));
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rota Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Kadıköy Sabah Turu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                onChange={(e) => updateFormData({ date: new Date(e.target.value) })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sürücü <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.driverId}
                onChange={(e) => updateFormData({ driverId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Araç <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.vehicleId}
                onChange={(e) => updateFormData({ vehicleId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.depotId}
                onChange={(e) => updateFormData({ depotId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                required
              >
                <option value="">Depo Seçin</option>
                {depots.map(depot => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name} {depot.isDefault && '(Varsayılan)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notlar
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateFormData({ notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Rota ile ilgili notlarınız..."
            />
          </div>
        </div>
      </div>

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
                  Süre: <span className="font-semibold">
                    {formatDuration(formData.totalDuration || calculateTotalDuration())}
                  </span>
                </div>
                {(formData.totalDistance ?? 0) > 0 && (
                  <div className="text-sm text-gray-600">
                    Mesafe: <span className="font-semibold">{(formData.totalDistance ?? 0).toFixed(1)} km</span>
                  </div>
                )}
              </>
            )}

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
                  Optimize Et
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Rota Haritası</h2>
            {stopsData.length === 0 ? (
              <span className="text-sm text-gray-500">Müşteri ekleyin</span>
            ) : (formData.totalDistance ?? 0) > 0 ? (
              <span className="text-sm text-gray-600">
                {(formData.totalDistance ?? 0).toFixed(1)} km • {formatDuration(formData.totalDuration || 0)}
              </span>
            ) : (
              <span className="text-sm text-gray-600">
                {stopsData.length} durak
              </span>
            )}
          </div>
          
          <MapComponent
            center={mapCenter}
            height="600px"
            markers={getMapMarkers()}
            depot={getDepotLocation()}
            directions={mapDirections}
            customers={stopsData.map(s => s.customer)}
            optimizedOrder={optimizedOrder}
            showTraffic={true}
            onMapLoad={handleMapLoad}
          />
          
          {stopsData.length > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 flex items-center">
                <Navigation className="w-4 h-4 mr-2" />
                <strong>Rota Bilgisi:</strong> 
                <span className="ml-1">
                  {formData.optimized ? '✅ Rota optimize edildi' : 'Optimize Et butonuna basarak rotanızı optimize edebilirsiniz'}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Duraklar {stopsData.length > 0 && `(${stopsData.length})`}
          </h2>
          
          {stopsData.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <StopsList
                stops={stopsData}
                onRemove={handleRemoveCustomer}
                onReorder={handleReorderStops}
                onUpdateStop={handleUpdateStop}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-400">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Henüz durak eklenmedi</p>
                <p className="text-sm mt-2">Yukarıdan müşteri ekleyerek başlayın</p>
              </div>
            </div>
          )}
        </div>
      </div>

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