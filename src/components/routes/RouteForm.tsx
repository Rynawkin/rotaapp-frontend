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
  onFormChange?: (data: Partial<Route>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

// Dakikayı saat ve dakika formatına çevir
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
  // localStorage'dan veri yükle (sadece create mode'da)
  const loadSavedData = useCallback(() => {
    if (!isEdit && !initialData) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('Loading saved form data from localStorage:', parsed);
          // Date string'ini Date objesine çevir
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

  // Form State - localStorage'dan veya initialData'dan yükle
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

  // Lists State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Stops with override data - localStorage'dan yükle
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
  
  // Flag to track if initial stops have been loaded
  const initialStopsLoadedRef = useRef(false);

  // Map State
  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 40.9869, lng: 29.0252 });
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'duration'>('distance');
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>(() => {
    return savedData?.optimized && savedData?.stops ? 
      savedData.stops.map((_: any, index: number) => index) : [];
  });

  // Form değişikliklerini localStorage'a kaydet (sadece create mode'da)
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

  // Form değişikliklerinde hem state'i güncelle hem de localStorage'a kaydet
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

  // Load lists on mount
  useEffect(() => {
    loadLists();
  }, []);

  // Initialize stops from initial data - sadece bir kez çalışır
  useEffect(() => {
    // Eğer daha önce yüklendiyse veya initialData yoksa çıkış yap
    if (initialStopsLoadedRef.current || !initialData?.stops || initialData.stops.length === 0) {
      return;
    }

    // Eğer müşteriler henüz yüklenmediyse çıkış yap
    if (customers.length === 0) {
      return;
    }

    // Initial stops'ları yükle
    const initialStops: StopData[] = initialData.stops
      .map(stop => {
        // Önce stop'un içindeki customer'ı kontrol et
        let customer = stop.customer;
        
        // Eğer stop'ta customer yoksa, customers listesinden bul
        if (!customer) {
          // customerId'yi string'e çevir karşılaştırma için
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
      initialStopsLoadedRef.current = true; // Yüklendiğini işaretle
      
      // Eğer rota optimize edilmişse, optimized order'ı da ayarla
      if (initialData.optimized) {
        setOptimizedOrder(initialStops.map((_, index) => index));
        updateFormData({ optimized: true });
      }
    }
  }, [initialData, customers]); // customers dependency'si kalıyor ama ref kontrolü ile

  // Müşteri eklendiğinde otomatik olarak haritada göster
  useEffect(() => {
    if (stopsData.length > 0) {
      const timer = setTimeout(() => updateMapRoute(), 500);
      return () => clearTimeout(timer);
    }
  }, [stopsData]);

  // StopsData değiştiğinde localStorage'a kaydet
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

      // Google Places müşterilerini filtrele
      const validCustomers = customersData.filter(c => 
        typeof c.id === 'number' || (typeof c.id === 'string' && !c.id.startsWith('google-'))
      );

      setCustomers(validCustomers);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setDepots(depotsData);
      
      // Set map center to default depot
      const defaultDepot = depotsData.find(d => d.isDefault);
      if (defaultDepot) {
        setMapCenter({ lat: defaultDepot.latitude, lng: defaultDepot.longitude });
        
        // Set default depot if not set - string olarak ayarla
        if (!formData.depotId) {
          updateFormData({ depotId: defaultDepot.id.toString() });
        }
      }

      // localStorage'dan yüklenen stops'ları customer objeleriyle güncelle
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
    // Google Places müşterisi kontrolü
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
      // StopsData güncellendiğinde localStorage'a kaydet
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

  // Haritada rotayı güncelle
  const updateMapRoute = async () => {
    if (stopsData.length === 0) return;

    // String karşılaştırması yap
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
        
        // Eğer initialData'da totalDistance ve totalDuration varsa onları kullan
        if (initialData?.totalDistance && initialData?.totalDuration) {
          updateFormData({
            totalDistance: initialData.totalDistance,
            totalDuration: initialData.totalDuration
          });
        }
      }
    }
  };

  // GERÇEK OPTİMİZASYON FONKSİYONU - BACKEND KULLANIMI
  const handleOptimize = async () => {
    if (stopsData.length < 2) {
      alert('Optimizasyon için en az 2 durak gerekli!');
      return;
    }

    // String karşılaştırması yap
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) {
      alert('Lütfen bir depo seçin!');
      return;
    }

    // Form validasyonu
    if (!formData.name) {
      alert('Lütfen rota adı girin!');
      return;
    }

    setOptimizing(true);
    
    try {
      // Önce rotayı oluştur/kaydet
      let routeId = initialData?.id;
      
      // ✅ Debug log - optimize öncesi durum
      console.log('=== OPTIMIZE START (Frontend) ===');
      console.log('Current stopsData before optimize:');
      stopsData.forEach((stop, index) => {
        console.log(`  ${index + 1}. ${stop.customer.name} (ID: ${stop.customer.id})`);
      });
      
      if (!routeId) {
        // Yeni rota oluştur - route.service.ts'nin beklediği format (camelCase)
        const stops = stopsData.map((stopData, index) => ({
          customer: stopData.customer,
          customerId: stopData.customer.id,
          serviceTime: stopData.serviceTime || stopData.customer.estimatedServiceTime || 10,
          stopNotes: stopData.stopNotes || '',
          overrideTimeWindow: stopData.overrideTimeWindow,
          overridePriority: stopData.overridePriority || stopData.customer.priority || 'normal'
        }));

        // Backend için route data hazırla - camelCase kullan
        const createRouteData: Partial<Route> = {
          name: formData.name,
          date: formData.date,
          depotId: formData.depotId,
          driverId: formData.driverId,
          vehicleId: formData.vehicleId,
          notes: formData.notes || '',
          stops: stops,
          depot: selectedDepot, // Depot objesini ekle
          optimized: false,
          totalDistance: 0,
          totalDuration: 0
        };
        
        console.log('Creating route with data:', createRouteData);
        
        // Rotayı backend'e kaydet (route.service.ts halledecek)
        const createdRoute = await routeService.create(createRouteData);
        routeId = createdRoute.id;
        console.log('Route created with ID:', routeId);
      }
      
      // Backend'de optimize et
      console.log('Calling optimize for route ID:', routeId);
      const optimizedRoute = await routeService.optimize(routeId, optimizationMode);
      
      if (optimizedRoute) {
        // ✅ Debug log - optimize response
        console.log('=== OPTIMIZE RESPONSE ===');
        console.log('Optimized Route:', optimizedRoute);
        console.log('Total Distance:', optimizedRoute.totalDistance);
        console.log('Total Duration:', optimizedRoute.totalDuration);
        console.log('Optimized:', optimizedRoute.optimized);
        console.log('Stops count:', optimizedRoute.stops?.length);
        
        // Stops'ları order'a göre sıralayıp logla
        if (optimizedRoute.stops) {
          const sortedStops = [...optimizedRoute.stops].sort((a, b) => a.order - b.order);
          console.log('Sorted stops by order:');
          sortedStops.forEach((stop, index) => {
            console.log(`  ${index + 1}. Order ${stop.order}: ${stop.customer?.name || stop.name} (CustomerId: ${stop.customerId})`);
          });
          
          // ✅ YENİ: Optimize edilmiş sırayla stopsData'yı güncelle
          const newStopsData: StopData[] = sortedStops.map(stop => {
            // Önce optimize edilmiş stop'un customer'ını bul
            let customer = stop.customer;
            
            // Eğer customer yoksa, customers listesinden bul
            if (!customer) {
              customer = customers.find(c => c.id.toString() === stop.customerId.toString());
            }
            
            // Hala bulunamadıysa eski stopsData'dan bul
            if (!customer) {
              const oldStopData = stopsData.find(sd => sd.customer.id.toString() === stop.customerId.toString());
              if (oldStopData) {
                customer = oldStopData.customer;
              }
            }
            
            if (!customer) {
              console.error(`Customer not found for stop with customerId: ${stop.customerId}`);
              // Fallback - en azından temel bilgileri koru
              customer = {
                id: stop.customerId,
                name: stop.name || `Müşteri ${stop.customerId}`,
                address: stop.address || '',
                latitude: stop.latitude || 0,
                longitude: stop.longitude || 0,
                phone: stop.contactPhone || '',
                email: stop.contactEmail || '',
                code: '',
                priority: 'normal' as const,
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date()
              };
            }
            
            return {
              customer: customer,
              overrideTimeWindow: stop.overrideTimeWindow,
              overridePriority: stop.overridePriority,
              serviceTime: stop.serviceTime,
              stopNotes: stop.stopNotes
            };
          });
          
          console.log('=== UPDATING FRONTEND STATE ===');
          console.log('New stopsData order:');
          newStopsData.forEach((stop, index) => {
            console.log(`  ${index + 1}. ${stop.customer.name} (ID: ${stop.customer.id})`);
          });
          
          // ✅ State'leri güncelle
          setStopsData(newStopsData);
          setOptimizedOrder(newStopsData.map((_, index) => index));
          
          // ✅ Form data'yı güncelle
          updateFormData({
            totalDuration: optimizedRoute.totalDuration,
            totalDistance: optimizedRoute.totalDistance,
            optimized: true,
            stops: sortedStops // stops'ları da güncelle
          });
          
          // ✅ Haritada rotayı güncelle
          await updateMapRoute();
          
          console.log('=== OPTIMIZE COMPLETE (Frontend) ===');
          
          // Formatlanmış süre ile mesaj göster
          alert(`✅ Rota optimize edildi!\n\n` +
                `📍 Toplam Mesafe: ${optimizedRoute.totalDistance.toFixed(1)} km\n` +
                `⏱️ Tahmini Süre: ${formatDuration(optimizedRoute.totalDuration)}\n` +
                `🗺️ Google Maps ile optimize edildi\n` +
                `${optimizationMode === 'distance' ? '🎯 En kısa mesafe' : '⚡ En hızlı rota'}`);
          
          // ✅ Eğer edit modunda değilse ve optimize başarılı olduysa
          if (!isEdit) {
            // localStorage'ı temizle
            localStorage.removeItem(STORAGE_KEY);
            
            // Eğer initialData.id varsa (rota kaydedildiyse), detay sayfasına yönlendir
            if (routeId) {
              setTimeout(() => {
                window.location.href = `/routes/${routeId}`;
              }, 1500);
            }
          }
        } else {
          console.error('No stops in optimized route!');
          alert('⚠️ Optimizasyon sonucu alınamadı!');
        }
      } else {
        console.error('No optimized route returned!');
        alert('⚠️ Optimizasyon başarısız!');
      }
    } catch (error: any) {
      console.error('Optimization error:', error);
      console.error('Error response:', error.response);
      
      // Google Maps API hatası için özel mesaj
      if (error.response?.data?.message?.includes('Google Maps API')) {
        alert('⚠️ Rota optimizasyonu başarısız!\n\n' +
              'Google Maps rotayı optimize edemedi. Muhtemel sebepler:\n' +
              '• Çok uzun adresler nedeniyle konum bulunamıyor\n' +
              '• Google Maps API anahtarı eksik veya geçersiz\n' +
              '• Seçilen konumlar arasında rota oluşturulamıyor\n\n' +
              'Rota kaydedildi ancak optimize edilmedi.');
        
        // Rota oluşturuldu ama optimize edilmedi, localStorage'ı temizle
        if (!isEdit) {
          localStorage.removeItem(STORAGE_KEY);
        }
        
        // Ana sayfaya yönlendir
        window.location.href = '/routes';
        return;
      }
      
      // Validation hatalarını detaylı logla
      if (error.response?.data?.errors) {
        console.log('Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
      
      // Genel hata mesajı
      let errorMessage = 'Optimizasyon sırasında bir hata oluştu.';
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        errorMessage += '\n\nHatalar:\n';
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: any) => {
            if (typeof err === 'object' && err.ErrorMessage) {
              errorMessage += `• ${err.ErrorMessage}\n`;
            } else {
              errorMessage += `• ${err}\n`;
            }
          });
        } else {
          errorMessage += JSON.stringify(validationErrors, null, 2);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
    
    // Sürücü ve araç kontrolü
    if (!formData.driverId || !formData.vehicleId) {
      alert('⚠️ Lütfen sürücü ve araç ataması yapın!');
      return;
    }
    
    // Seçili depoyu bul
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) {
      alert('⚠️ Lütfen bir depo seçin!');
      return;
    }
    
    // ✅ DÜZELTME: Customer ID kontrolü güçlendirildi
    const stops: RouteStop[] = stopsData.map((stopData, index) => {
      // Customer nesnesini kontrol et
      if (!stopData.customer) {
        console.error('Customer missing for stop:', index, stopData);
        throw new Error(`Durak ${index + 1} için müşteri bilgisi eksik`);
      }
      
      const customer = stopData.customer;
      let customerId: string;
      
      // Google Places kontrolü
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        console.error('Google Places customer detected:', customer);
        throw new Error(`Durak ${index + 1} için müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.`);
      }
      
      // ID'yi string'e çevir
      if (typeof customer.id === 'number') {
        customerId = customer.id.toString();
      } else if (typeof customer.id === 'string') {
        customerId = customer.id;
      } else {
        console.error('Invalid customer ID type:', typeof customer.id, customer);
        throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
      }
      
      console.log(`Stop ${index}: Customer ID = ${customerId}, Name = ${customer.name}`);
      
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
      // Driver ve Vehicle bilgilerini ekle
      driver: drivers.find(d => d.id.toString() === formData.driverId?.toString()),
      vehicle: vehicles.find(v => v.id.toString() === formData.vehicleId?.toString()),
      // Depot objesini ekle - ÖNEMLİ: Backend'de startDetails için gerekli
      depot: selectedDepot
    };

    console.log('Submitting route with depot:', selectedDepot);
    console.log('Route optimized status:', routeData.optimized);
    console.log('Route totalDistance:', routeData.totalDistance);
    console.log('Route totalDuration:', routeData.totalDuration);
    
    // Başarılı submit'ten sonra localStorage'ı temizle
    if (!isEdit) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    onSubmit(routeData);
  };

  const handleSaveDraft = () => {
    // Seçili depoyu bul
    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    
    // ✅ DÜZELTME: Customer ID kontrolü güçlendirildi
    const stops: RouteStop[] = stopsData.map((stopData, index) => {
      // Customer nesnesini kontrol et
      if (!stopData.customer) {
        console.error('Customer missing for stop:', index, stopData);
        throw new Error(`Durak ${index + 1} için müşteri bilgisi eksik`);
      }
      
      const customer = stopData.customer;
      let customerId: string;
      
      // Google Places kontrolü
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        console.error('Google Places customer detected:', customer);
        throw new Error(`Durak ${index + 1} için müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.`);
      }
      
      // ID'yi string'e çevir
      if (typeof customer.id === 'number') {
        customerId = customer.id.toString();
      } else if (typeof customer.id === 'string') {
        customerId = customer.id;
      } else {
        console.error('Invalid customer ID type:', typeof customer.id, customer);
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
      // Driver ve Vehicle bilgilerini ekle
      driver: drivers.find(d => d.id.toString() === formData.driverId?.toString()),
      vehicle: vehicles.find(v => v.id.toString() === formData.vehicleId?.toString()),
      // Depot objesini ekle
      depot: selectedDepot
    };

    // Başarılı submit'ten sonra localStorage'ı temizle
    if (!isEdit) {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (onSaveAsDraft) {
      onSaveAsDraft(routeData);
    }
  };

  const getDepotLocation = (): LatLng | undefined => {
    // String karşılaştırması yap ve depot varsa dön
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
              onChange={(e) => updateFormData({ name: e.target.value })}
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
                onChange={(e) => updateFormData({ date: new Date(e.target.value) })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Driver */}
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

          {/* Vehicle */}
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

          {/* Depot */}
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

          {/* Notes */}
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

      {/* Map ve Stops List - YAN YANA */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sol Taraf - Harita */}
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

        {/* Sağ Taraf - Duraklar Listesi */}
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