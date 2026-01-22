import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Zap,
  XCircle,
  RefreshCw
} from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import StopsList from './StopsList';
import MapComponent from '@/components/maps/MapComponent';
import Modal from '@/components/common/Modal';
import CustomerForm from '@/components/customers/CustomerForm';
import { Route, Customer, Driver, Vehicle, Depot, RouteStop } from '@/types';
import { LatLng, MarkerData, OptimizationWaypoint } from '@/types/maps';
import { customerService } from '@/services/customer.service';
import { driverService } from '@/services/driver.service';
import { vehicleService } from '@/services/vehicle.service';
import { depotService } from '@/services/depot.service';
import { routeService } from '@/services/route.service';
import { googleMapsService } from '@/services/googleMapsService';
import { settingsService } from '@/services/settings.service';

type OptimizationStatus = 'none' | 'success' | 'partial';

interface StopData {
  customer: Customer;
  routeStopId?: string | number; // Route stop ID for API calls
  overrideTimeWindow?: { start: string; end: string };
  positionConstraint?: 'first' | 'last' | 'none';
  serviceTime?: number;
  signatureRequired?: boolean;
  photoRequired?: boolean;
  stopNotes?: string;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}

interface ExcludedStop {
  stopData: StopData;
  reason: string;
  timeWindowConflict?: string;
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

const timeSpanToTimeString = (timeSpan?: string): string => {
  if (!timeSpan) return '08:00';
  return timeSpan.substring(0, 5);
};

const timeStringToTimeSpan = (timeString: string): string => {
  return `${timeString}:00`;
};

// Time window validation helper
const validateTimeWindow = (start?: string, end?: string): { start?: string; end?: string } | undefined => {
  // Eğer ikisi de boşsa, undefined dön
  if (!start && !end) {
    return undefined;
  }

  // Eğer sadece biri doluysa, diğerini otomatik hesapla
  if (start && !end) {
    // Başlangıç varsa, bitiş = başlangıç + 1 saat
    const [hours, minutes] = start.split(':').map(Number);
    const endHours = (hours + 1) % 24; // 24 saat formatında
    const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { start, end: endTime };
  }

  if (!start && end) {
    // Bitiş varsa, başlangıç = bitiş - 1 saat
    const [hours, minutes] = end.split(':').map(Number);
    const startHours = hours === 0 ? 23 : hours - 1;
    const startTime = `${startHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { start: startTime, end };
  }

  // İkisi de doluysa, olduğu gibi dön
  return { start, end };
};

const STORAGE_KEY = 'createRouteFormData';
const TIME_WINDOW_MAX_STOPS = 70;

const RouteForm: React.FC<RouteFormProps> = ({
  initialData,
  onSubmit,
  onSaveAsDraft,
  onFormChange,
  loading = false,
  isEdit = false
}) => {
  // BUGFIX: Use useMemo to prevent re-reading localStorage on every render
  const savedData = useMemo(() => {
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
  const [formData, setFormData] = useState<Partial<Route>>({
    name: savedData?.name || initialData?.name || '',
    date: savedData?.date || initialData?.date || new Date(),
    driverId: savedData?.driverId || initialData?.driverId || '',
    vehicleId: savedData?.vehicleId || initialData?.vehicleId || '',
    currentKm: savedData?.currentKm || initialData?.currentKm || undefined,
    depotId: savedData?.depotId || initialData?.depotId || '',
    notes: savedData?.notes || initialData?.notes || '',
    stops: savedData?.stops || initialData?.stops || [],
    totalDuration: savedData?.totalDuration || initialData?.totalDuration || 0,
    totalDistance: savedData?.totalDistance || initialData?.totalDistance || 0,
    optimized: savedData?.optimized || initialData?.optimized || false
  });

  const [startTime, setStartTime] = useState<string>(() => {
    if (initialData?.startDetails?.startTime) {
      return timeSpanToTimeString(initialData.startDetails.startTime);
    }
    if (savedData?.startTime) {
      return savedData.startTime;
    }
    return '08:00';
  });

  // BUGFIX: Separate local state for currentKm to prevent form updates on every keystroke
  const [currentKmInput, setCurrentKmInput] = useState<string>(() => {
    const km = savedData?.currentKm || initialData?.currentKm;
    return km ? String(km) : '';
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
        positionConstraint: stop.positionConstraint,
        serviceTime: stop.serviceTime,
        signatureRequired: stop.signatureRequired || false,
        photoRequired: stop.photoRequired || false,
        stopNotes: stop.stopNotes
      }));
    }
    return [];
  });

  const initialStopsLoadedRef = useRef(false);

  const [mapCenter, setMapCenter] = useState<LatLng>({ lat: 40.9869, lng: 29.0252 });
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState<boolean>(() => {
    // Settings'den default değeri al
    try {
      const settings = localStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.delivery?.defaultAvoidTolls || false;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return false;
  });
  const [defaultSignatureRequired, setDefaultSignatureRequired] = useState(false);
  const [defaultPhotoRequired, setDefaultPhotoRequired] = useState(false);
  const [optimizedOrder, setOptimizedOrder] = useState<number[]>(() => {
    return savedData?.optimized && savedData?.stops ?
      savedData.stops.map((_: any, index: number) => index) : [];
  });

  const [optimizationStatus, setOptimizationStatus] = useState<OptimizationStatus>('none');
  const [excludedStops, setExcludedStops] = useState<ExcludedStop[]>([]);
  const [endDetails, setEndDetails] = useState<{ estimatedArrivalTime?: string } | null>(null);

  // Modal state'leri
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const resetOptimization = useCallback(() => {
    setOptimizationStatus('none');
    setExcludedStops([]);
    setOptimizedOrder([]);
    updateFormData({ optimized: false });
  }, []);

  const saveToLocalStorage = useCallback((data: Partial<Route>) => {
    if (!isEdit) {
      try {
        const toSave = {
          ...data,
          startTime,
          stops: stopsData.map((stop, index) => ({
            ...stop,
            order: index + 1,
            customerId: stop.customer.id,
            customer: stop.customer,
            signatureRequired: stop.signatureRequired || false,
            photoRequired: stop.photoRequired || false
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        console.log('Form data saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [isEdit, stopsData, startTime]);

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

  // Sync currentKmInput when formData.currentKm changes externally
  useEffect(() => {
    if (formData.currentKm !== undefined) {
      setCurrentKmInput(String(formData.currentKm));
    }
  }, [formData.currentKm]);

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
          routeStopId: stop.id, // Route stop ID from backend
          overrideTimeWindow: stop.overrideTimeWindow,
          positionConstraint: stop.positionConstraint,
          serviceTime: stop.serviceTime || customer.estimatedServiceTime || 10,
          signatureRequired: stop.signatureRequired || false,
          photoRequired: stop.photoRequired || false,
          stopNotes: stop.stopNotes,
          estimatedArrivalTime: stop.estimatedArrivalTime,
          estimatedDepartureTime: stop.estimatedDepartureTime
        };
      })
      .filter(Boolean) as StopData[];

    if (initialStops.length > 0) {
      setStopsData(initialStops);
      initialStopsLoadedRef.current = true;

      if (initialData.optimized) {
        setOptimizedOrder(initialStops.map((_, index) => index));
        setOptimizationStatus('success');
        updateFormData({ optimized: true });

        // EndDetails'i de set et
        if (initialData.endDetails) {
          setEndDetails(initialData.endDetails);
        }
      }
    }
  }, [initialData, customers]);

  useEffect(() => {
    console.log('🔄 stopsData useEffect triggered, length:', stopsData.length); // DEBUG
    if (stopsData.length > 0) {
      const timer = setTimeout(() => updateMapRoute(), 500);
      return () => clearTimeout(timer);
    }
  }, [stopsData]);

  useEffect(() => {
    if (stopsData.length > 0 || formData.name || formData.driverId || formData.vehicleId || startTime !== '08:00') {
      saveToLocalStorage(formData);
    }
  }, [stopsData, formData, startTime, saveToLocalStorage]);

  // StartTime 00:00 kontrolü
  useEffect(() => {
    if (startTime === '00:00') {
      setStartTime('00:01');
      console.log('Start time adjusted from 00:00 to 00:01');
    }
  }, [startTime]);

  const loadLists = async () => {
    setLoadingLists(true);
    try {
      const [customersData, driversData, vehiclesData, depotsData] = await Promise.all([
        customerService.getAll(),
        driverService.getAll(),
        vehicleService.getAll(),
        depotService.getAll()
      ]);

      try {
        const deliverySettings = await settingsService.getDeliverySettings();
        setDefaultSignatureRequired(deliverySettings.defaultSignatureRequired || false);
        setDefaultPhotoRequired(deliverySettings.defaultPhotoRequired || false);
      } catch (error) {
        console.error('Error loading delivery settings:', error);
        setDefaultSignatureRequired(false);
        setDefaultPhotoRequired(false);
      }

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

        if (!initialData?.startDetails?.startTime && !savedData?.startTime) {
          const depotStartTime = defaultDepot.startWorkingHours || '08:00:00';
          setStartTime(timeSpanToTimeString(depotStartTime));
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
                positionConstraint: stop.positionConstraint,
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

      if (savedData?.startTime) {
        setStartTime(savedData.startTime);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAddCustomer = (customer: Customer) => {
    if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
      alert('Bu müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.');
      return;
    }

    if (!stopsData.find(s => s.customer.id === customer.id)) {
      const newStopsData = [...stopsData, {
        customer,
        serviceTime: customer.estimatedServiceTime || 10,
        signatureRequired: defaultSignatureRequired,
        photoRequired: defaultPhotoRequired
      }];
      setStopsData(newStopsData);
      resetOptimization();
      saveToLocalStorage(formData);
    }
  };

  // Toplu müşteri ekleme handler'ı
  const handleAddMultipleCustomers = (customers: Customer[]) => {
    // TIME WINDOW KONTROLÜ: durak limiti
    const hasTimeWindows = [...stopsData, ...customers.map(c => ({ customer: c }))]
      .some(s => s.customer.timeWindow || (s as any).overrideTimeWindow);

    const futureStopCount = stopsData.length + customers.length;

    if (hasTimeWindows && futureStopCount > TIME_WINDOW_MAX_STOPS) {
      alert(`⚠️ Zaman pencereli rotalar için maksimum ${TIME_WINDOW_MAX_STOPS} durak ekleyebilirsiniz.\n\nMevcut: ${stopsData.length} durak\nEklemek istediğiniz: ${customers.length} durak\nToplam: ${futureStopCount} durak\n\nLütfen daha az müşteri seçin veya mevcut duraklardan bazılarını kaldırın.`);
      return;
    }

    const newStops: StopData[] = customers
      .filter(customer => {
        // Zaten eklenmişleri filtrele
        return !stopsData.find(s => s.customer.id === customer.id);
      })
      .map(customer => ({
        customer,
        serviceTime: customer.estimatedServiceTime || 10,
        signatureRequired: defaultSignatureRequired,
        photoRequired: defaultPhotoRequired
      }));

    if (newStops.length > 0) {
      setStopsData([...stopsData, ...newStops]);
      resetOptimization();
      saveToLocalStorage(formData);
      
      // Başarı mesajı
      if (newStops.length === customers.length) {
        alert(`${newStops.length} müşteri başarıyla eklendi!`);
      } else {
        const skipped = customers.length - newStops.length;
        alert(`${newStops.length} müşteri eklendi, ${skipped} müşteri zaten listede olduğu için atlandı.`);
      }
    } else {
      alert('Seçilen müşteriler zaten rotada mevcut!');
    }
  };

  // Yeni müşteri oluşturma handler'ı
  const handleCreateCustomer = async (customerData: Partial<Customer>) => {
    setSavingCustomer(true);
    try {
      // TIME WINDOW KONTROLÜ: durak limiti
      const hasTimeWindows = stopsData.some(s => s.customer.timeWindow || s.overrideTimeWindow) ||
                             customerData.timeWindow;

      if (hasTimeWindows && stopsData.length >= TIME_WINDOW_MAX_STOPS) {
        alert(`⚠️ Zaman pencereli rotalar için maksimum ${TIME_WINDOW_MAX_STOPS} durak ekleyebilirsiniz.\n\nMevcut durak sayısı: ${stopsData.length}\n\nLütfen önce mevcut duraklardan bazılarını kaldırın.`);
        setSavingCustomer(false);
        return;
      }

      // Yeni müşteriyi API'ye kaydet
      const newCustomer = await customerService.create(customerData);

      // Müşteri listesini güncelle
      setCustomers(prev => [...prev, newCustomer]);

      // Yeni müşteriyi direkt stop listesine ekle
      const newStopData = {
        customer: newCustomer,
        serviceTime: newCustomer.estimatedServiceTime || 10,
        signatureRequired: defaultSignatureRequired,
        photoRequired: defaultPhotoRequired
      };
      setStopsData(prev => [...prev, newStopData]);
      
      // Optimizasyonu resetle
      resetOptimization();
      
      // Modal'ı kapat
      setShowCustomerModal(false);
      
      // Başarı mesajı
      alert('Müşteri başarıyla eklendi ve rotaya dahil edildi!');
    } catch (error: any) {
      console.error('Error creating customer:', error);
      alert('Müşteri eklenirken hata oluştu: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleRemoveCustomer = async (customerId: string | number) => {
    const newStopsData = stopsData.filter(s => s.customer.id.toString() !== customerId.toString());
    setStopsData(newStopsData);
    resetOptimization();

    // Eğer yeterli durak varsa ve harita hazırsa, polyline'ları yeniden hesapla
    if (newStopsData.length > 0 && isGoogleMapsLoaded && formData.depotId) {
      const depot = depots.find(d => d.id.toString() === formData.depotId?.toString());
      if (depot) {
        try {
          const depotLocation = {
            lat: depot.latitude,
            lng: depot.longitude
          };

          const waypoints = newStopsData.map(stop => ({
            lat: stop.customer.latitude,
            lng: stop.customer.longitude
          }));

          googleMapsService.initializeServices();
          const directions = await googleMapsService.getDirections(
            depotLocation,
            waypoints,
            depotLocation
          );

          if (directions) {
            setMapDirections(directions);
          }
        } catch (error) {
          console.error('Polyline güncellenirken hata:', error);
          setMapDirections(null);
        }
      }
    } else {
      setMapDirections(null);
    }
  };

  const handleReorderStops = (reorderedStops: StopData[]) => {
    setStopsData(reorderedStops);
    // Manuel sıralama sonrası optimize durumunu koruyoruz
    // resetOptimization(); // Kaldırıldı - kullanıcı manuel müdahale sonrası da rota oluşturabilmeli
    setMapDirections(null);
  };

  // DÜZELTME: handleUpdateStop fonksiyonu - API çağrısı eklendi
  const handleUpdateStop = async (index: number, updates: Partial<StopData>) => {
    console.log('=== handleUpdateStop CALLED ===');
    console.log('Index:', index);
    console.log('Updates:', updates);
    console.log('isEdit:', isEdit);
    console.log('initialData?.id:', initialData?.id);

    // Eğer updates boş gelirse (validation hatası durumu), hiçbir şey yapma
    if (!updates || Object.keys(updates).length === 0) {
      console.log('Empty updates received, skipping update');
      return;
    }

    const newStops = [...stopsData];
    const currentStop = newStops[index];

    console.log('currentStop:', currentStop);
    console.log('currentStop.routeStopId:', currentStop?.routeStopId);

    // Update local state first
    newStops[index] = { ...currentStop, ...updates };
    setStopsData(newStops);
    resetOptimization();

    // If this is an edit mode and we have route/stop IDs, update backend
    if (isEdit && initialData?.id && currentStop.routeStopId) {
      try {
        const routeId = parseInt(initialData.id.toString());
        const stopId = parseInt(currentStop.routeStopId.toString());

        console.log('Attempting to update stop via API:', {
          routeId,
          stopId,
          updates
        });

        // Convert updates to API format
        const apiUpdates = {
          customerId: updates.customer?.id ? parseInt(updates.customer.id.toString()) : undefined,
          arriveBetweenStart: updates.overrideTimeWindow?.start,
          arriveBetweenEnd: updates.overrideTimeWindow?.end,
          serviceTime: updates.serviceTime ? `${updates.serviceTime}` : undefined,
          signatureRequired: updates.signatureRequired,
          photoRequired: updates.photoRequired,
          notes: updates.stopNotes
        };

        await routeService.updateStop(routeId, stopId, apiUpdates);
        console.log('Stop updated successfully via API');

      } catch (error) {
        console.error('Failed to update stop via API:', error);
        // For now, continue with local state update
        // In production, you might want to revert local state or show error message
      }
    }
  };

  const handleMoveExcludedToStops = (excludedStop: ExcludedStop) => {
    // TIME WINDOW KONTROLÜ: durak limiti
    const hasTimeWindows = [...stopsData, excludedStop.stopData]
      .some(s => s.customer.timeWindow || s.overrideTimeWindow);

    if (hasTimeWindows && stopsData.length >= TIME_WINDOW_MAX_STOPS) {
      alert(`⚠️ Zaman pencereli rotalar için maksimum ${TIME_WINDOW_MAX_STOPS} durak ekleyebilirsiniz.\n\nMevcut durak sayısı: ${stopsData.length}\n\nLütfen önce mevcut duraklardan bazılarını kaldırın.`);
      return;
    }

    setStopsData([...stopsData, excludedStop.stopData]);
    setExcludedStops(excludedStops.filter(s => s.stopData.customer.id !== excludedStop.stopData.customer.id));
    resetOptimization();
  };

  const updateMapRoute = async () => {
    console.log('🗺️ updateMapRoute called'); // DEBUG
    if (stopsData.length === 0) return;

    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) return;

    if (window.google && window.google.maps) {
      const depotLocation: LatLng = {
        lat: selectedDepot.latitude,
        lng: selectedDepot.longitude
      };

      const waypointLocations = stopsData
        .filter(stop => stop.customer && stop.customer.latitude !== undefined && stop.customer.longitude !== undefined)
        .map(stop => ({
          lat: stop.customer.latitude,
          lng: stop.customer.longitude
        }));

      googleMapsService.initializeServices();

      const directions = await googleMapsService.getDirections(
        depotLocation,
        waypointLocations,
        depotLocation,
        avoidTolls
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
      let routeId = initialData?.id;

      if (!routeId) {
        const stops: RouteStop[] = stopsData.map((stopData, index) => {
          // Time window validation for each stop
          let timeWindow = stopData.overrideTimeWindow;
          if (timeWindow) {
            timeWindow = validateTimeWindow(timeWindow.start, timeWindow.end) || undefined;
          }

          const orderType = stopData.positionConstraint === 'first' ? 10 :
                           stopData.positionConstraint === 'last' ? 30 : 20;

          console.log(`🚀 DEBUG - Stop ${index + 1} (${stopData.customer.name}):`, {
            positionConstraint: stopData.positionConstraint,
            orderType: orderType
          });

          return {
            id: `${Date.now()}-${index}`,
            routeId: '',
            customerId: stopData.customer.id.toString(),
            customer: stopData.customer,
            order: index + 1,
            status: 'pending',
            orderType: orderType,
            serviceTime: stopData.serviceTime,
            signatureRequired: stopData.signatureRequired || false,
            photoRequired: stopData.photoRequired || false,
            stopNotes: stopData.stopNotes,
            arriveBetweenStart: timeWindow?.start,
            arriveBetweenEnd: timeWindow?.end,
            estimatedArrival: new Date(),
            distance: 0
          };
        });

        const routeData: Partial<Route> = {
          ...formData,
          stops,
          currentKm: formData.currentKm,
          totalDeliveries: stops.length,
          status: 'planned',
          optimized: false,
          depot: selectedDepot,
          startDetails: {
            startTime: timeStringToTimeSpan(startTime),
            name: selectedDepot.name,
            address: selectedDepot.address,
            latitude: selectedDepot.latitude,
            longitude: selectedDepot.longitude
          }
        };

        const createdRoute = await routeService.create(routeData);
        routeId = createdRoute.id;
      }

      // Optimize öncesi OrderType'ları güncelle
      console.log('🔄 Updating OrderTypes before optimization...');

      // Mevcut route'u al
      const currentRoute = await routeService.getById(routeId);

      // Stops'ları pozisyon kısıtlamalarıyla güncelle
      const updatedStops = stopsData.map((stopData, index) => {
        const orderType = stopData.positionConstraint === 'first' ? 10 :
                          stopData.positionConstraint === 'last' ? 30 : 20;
        const currentStop = currentRoute.stops[index];

        console.log(`📍 Updating ${stopData.customer.name}: ${stopData.positionConstraint} → ${orderType}`);

        // Time window handling - Override varsa onu kullan, yoksa customer default'unu kullan
        let arriveBetweenStart: string | null = null;
        let arriveBetweenEnd: string | null = null;

        if (stopData.overrideTimeWindow) {
          // Override time window varsa onu kullan
          const timeWindow = validateTimeWindow(stopData.overrideTimeWindow.start, stopData.overrideTimeWindow.end);
          arriveBetweenStart = timeWindow?.start || null;
          arriveBetweenEnd = timeWindow?.end || null;
        } else if (stopData.customer.timeWindow) {
          // Override yoksa customer'ın default time window'unu kullan
          const timeWindow = validateTimeWindow(stopData.customer.timeWindow.start, stopData.customer.timeWindow.end);
          arriveBetweenStart = timeWindow?.start || null;
          arriveBetweenEnd = timeWindow?.end || null;
        }

        return {
          ...currentStop,
          orderType: orderType,
          positionConstraint: stopData.positionConstraint,
          arriveBetweenStart: arriveBetweenStart,
          arriveBetweenEnd: arriveBetweenEnd
        };
      });

      try {
        await routeService.update(routeId, {
          ...currentRoute,
          stops: updatedStops
        });
        console.log('✅ OrderTypes updated successfully');
      } catch (updateError) {
        console.error('❌ Failed to update OrderTypes:', updateError);
        // Continue with optimization anyway
      }

      console.log('🚀 Sending optimize request with:', { routeId, mode: 'distance', avoidTolls });
      const optimizedRoute = await routeService.optimize(routeId, 'distance', avoidTolls);
      console.log('✅ Received optimize response:', optimizedRoute);

      if (!optimizedRoute.success) {
        const message = optimizedRoute.message || 'Optimizasyon icin cozum bulunamadi.';
        setEndDetails(null);
        resetOptimization();
        alert(message);
        return;
      }

      if (optimizedRoute.hasExclusions && optimizedRoute.excludedStops && optimizedRoute.excludedStops.length > 0) {
        setOptimizationStatus('partial');

        const excluded: ExcludedStop[] = optimizedRoute.excludedStops.map((ex: any) => {
          const stopData = stopsData.find(s =>
            s.customer.id.toString() === ex.stop?.customerId?.toString()
          );

          // Eğer stopData bulunamazsa, customer'ı customers array'inden bul
          const customer = ex.stop?.customer || customers.find(c =>
            c.id.toString() === ex.stop?.customerId?.toString()
          );

          const fallbackStopData: StopData = {
            customer: customer,
            serviceTime: ex.stop?.serviceTime || '00:15:00',
            stopNotes: ex.stop?.stopNotes || '',
            overrideTimeWindow: ex.stop?.arriveBetweenStart ? {
              start: ex.stop.arriveBetweenStart,
              end: ex.stop.arriveBetweenEnd
            } : undefined
          };

          // Türkçe açıklayıcı mesaj oluştur
          let reasonText = ex.reason || 'Zaman kısıtlamaları nedeniyle dahil edilemedi';

          // Eğer time window conflict varsa daha açıklayıcı mesaj ver
          if (ex.timeWindowConflict && (stopData?.overrideTimeWindow || customer?.timeWindow)) {
            const timeWindow = stopData?.overrideTimeWindow || customer?.timeWindow;
            if (timeWindow) {
              reasonText = `Bu durak ${timeWindow.start} - ${timeWindow.end} saatleri arasında ziyaret edilmek istiyor, ancak rota planlamasında bu saat aralığına sığmıyor`;
            }
          } else if (customer?.timeWindow) {
            reasonText = `Müşteri ${customer.timeWindow.start} - ${customer.timeWindow.end} saatleri arasında ziyaret edilmek istiyor, ancak rota planlamasında bu saat aralığına sığmıyor`;
          }

          return {
            stopData: stopData || fallbackStopData,
            reason: reasonText,
            timeWindowConflict: ex.timeWindowConflict
          };
        }).filter(ex => ex.stopData?.customer); // customer'ı olmayan excluded stop'ları filtrele

        setExcludedStops(excluded);

        const optimizedStopsData = optimizedRoute.optimizedStops?.map((stop: any) => {
          const existingStopData = stopsData.find(s =>
            s.customer.id.toString() === stop.customerId.toString()
          );
          const customer = stop.customer || customers.find(c => c.id.toString() === stop.customerId.toString());

          if (!customer) {
            console.warn('Customer not found for optimized stop:', stop);
            return null;
          }

          return {
            customer: customer,
            positionConstraint: stop.orderType === 'First' ? 'first' :
                               stop.orderType === 'Last' ? 'last' : 'none',
            serviceTime: stop.serviceTime,
            stopNotes: stop.stopNotes || existingStopData?.stopNotes,
            overrideTimeWindow: existingStopData?.overrideTimeWindow,
            overridePriority: existingStopData?.overridePriority,
            signatureRequired: existingStopData?.signatureRequired,
            photoRequired: existingStopData?.photoRequired,
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime
          };
        }).filter(Boolean) || [];

        setStopsData(optimizedStopsData);

      } else if (optimizedRoute.optimizedStops && optimizedRoute.optimizedStops.length > 0) {
        setOptimizationStatus('success');
        setExcludedStops([]);

        const optimizedStopsData = optimizedRoute.optimizedStops
          .filter((stop: any) => stop.customerId) // Depot stop'larını filtrele (customerId null olan)
          .map((stop: any) => {
            const existingStopData = stopsData.find(s =>
              s.customer.id.toString() === stop.customerId.toString()
            );
            const customer = stop.customer || customers.find(c => c.id.toString() === stop.customerId.toString());

            if (!customer) {
              console.warn('Customer not found for stop:', stop);
              return null;
            }

            return {
              customer: customer,
              positionConstraint: stop.orderType === 'First' ? 'first' :
                                 stop.orderType === 'Last' ? 'last' : 'none',
              serviceTime: stop.serviceTime,
              stopNotes: stop.stopNotes || existingStopData?.stopNotes,
              overrideTimeWindow: existingStopData?.overrideTimeWindow,
              overridePriority: existingStopData?.overridePriority,
              signatureRequired: existingStopData?.signatureRequired,
              photoRequired: existingStopData?.photoRequired,
              estimatedArrivalTime: stop.estimatedArrivalTime,
              estimatedDepartureTime: stop.estimatedDepartureTime
            };
          }).filter(Boolean);

        setStopsData(optimizedStopsData);
        setOptimizedOrder(optimizedStopsData.map((_, i) => i));

      } else if (optimizedRoute.stops) {
        setOptimizationStatus('success');
        setExcludedStops([]);

        const backendOptimizedStops = optimizedRoute.stops
          .filter(stop => stop.customerId) // Depot stop'larını filtrele (customerId null olan)
          .sort((a, b) => a.order - b.order)
          .map(stop => {
            const existingStopData = stopsData.find(s =>
              s.customer.id.toString() === stop.customerId.toString()
            );
            const customer = stop.customer || customers.find(c => c.id.toString() === stop.customerId.toString());

            if (!customer) {
              console.warn('Customer not found for stop:', stop);
              return null;
            }

            return {
              customer: customer,
              positionConstraint: stop.orderType === 'First' ? 'first' :
                                 stop.orderType === 'Last' ? 'last' : 'none',
              serviceTime: stop.serviceTime,
              stopNotes: stop.stopNotes || existingStopData?.stopNotes,
              overrideTimeWindow: existingStopData?.overrideTimeWindow,
              overridePriority: existingStopData?.overridePriority,
              signatureRequired: existingStopData?.signatureRequired,
              photoRequired: existingStopData?.photoRequired,
              estimatedArrivalTime: stop.estimatedArrivalTime,
              estimatedDepartureTime: stop.estimatedDepartureTime
            };
          }).filter(Boolean);

        setStopsData(backendOptimizedStops);
        setOptimizedOrder(backendOptimizedStops.map((_, i) => i));
      }

      // EndDetails'i güncelle
      console.log('🚛 Full API response:', optimizedRoute);
      console.log('🏭 EndDetails from API:', optimizedRoute.endDetails);
      if (optimizedRoute.endDetails) {
        console.log('✅ Setting EndDetails:', optimizedRoute.endDetails);
        setEndDetails(optimizedRoute.endDetails);
      } else {
        console.log('❌ No EndDetails in API response');
      }

      if (!isEdit) {
        initialData = optimizedRoute;
      }

      updateFormData({
        ...formData,
        id: routeId,
        totalDuration: optimizedRoute.totalDuration,
        totalDistance: optimizedRoute.totalDistance,
        optimized: true
      });

      await updateMapRoute();

      const message = optimizationStatus === 'partial'
        ? `Rota optimize edildi!\n${excludedStops.length} durak zaman uyumsuzluğu nedeniyle dahil edilemedi.`
        : `Rota optimize edildi!\n\nToplam Mesafe: ${optimizedRoute.totalDistance.toFixed(1)} km\nTahmini Süre: ${formatDuration(optimizedRoute.totalDuration)}`;

      alert(message);

    } catch (error: any) {
      console.error('Optimization error:', error);
      alert('Optimizasyon sırasında bir hata oluştu: ' + (error.response?.data?.message || error.message));
    } finally {
      setOptimizing(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      date: new Date(),
      depotId: '',
      driverId: '',
      vehicleId: '',
      notes: '',
      optimized: false
    });
    setStopsData([]);
    setOptimizationStatus('none');
    setExcludedStops([]);
    setOptimizedOrder([]);
    setStartTime('08:00');
    
    // LocalStorage'ı da temizle
    localStorage.removeItem(STORAGE_KEY);
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;

    // Servis sürelerini ekle
    stopsData.forEach(stop => {
      totalMinutes += stop.serviceTime || stop.customer.estimatedServiceTime || 10;
    });

    // Optimize edilmiş rotalar için gerçek süreyi kullan
    if (formData.optimized && formData.totalDuration > 0) {
      return formData.totalDuration;
    }

    // Optimize edilmemiş rotalar için yaklaşık hesaplama
    if (stopsData.length > 0) {
      // Daha gerçekçi seyahat süresi hesaplaması
      // Ortalama durak arası seyahat süresi (şehir içi trafik dikkate alınarak)
      const avgTravelTimePerStop = stopsData.length <= 5 ? 20 : // Küçük rotalar: 20dk
                                   stopsData.length <= 10 ? 15 : // Orta rotalar: 15dk
                                   12; // Büyük rotalar: 12dk (daha yoğun)

      totalMinutes += stopsData.length * avgTravelTimePerStop;

      // Depot'a dönüş süresi (son duraktan depot'a)
      totalMinutes += 25; // Ortalama 25 dakika dönüş

      // Time window'ları olan duraklar için minimal ek bekleme süresi
      const timeWindowStops = stopsData.filter(stop =>
        stop.overrideTimeWindow || stop.customer.timeWindow
      );
      if (timeWindowStops.length > 0) {
        // Her time window'lu durak için ortalama 3dk ekstra süre
        // (erken varma durumunda minimal bekleme süresi)
        totalMinutes += timeWindowStops.length * 3;
      }
    }

    return totalMinutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (optimizationStatus === 'none') {
      alert('Lütfen önce rotayı optimize edin!');
      return;
    }

    if (formData.id && formData.optimized) {
      const updateData: Partial<Route> = {
        id: formData.id,
        driverId: formData.driverId,
        vehicleId: formData.vehicleId
      };

      onSubmit(updateData);
      return;
    }

    if (!formData.driverId || !formData.vehicleId) {
      alert('Lütfen sürücü ve araç ataması yapın!');
      return;
    }

    if (!formData.currentKm) {
      alert('Lütfen aracın güncel kilometresini giriniz!');
      return;
    }

    const selectedDepot = depots.find(d => d.id.toString() === formData.depotId?.toString());
    if (!selectedDepot) {
      alert('Lütfen bir depo seçin!');
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

      // Time window handling - Override varsa onu kullan, yoksa customer default'unu kullan
      let arriveBetweenStart: string | undefined;
      let arriveBetweenEnd: string | undefined;

      if (stopData.overrideTimeWindow) {
        // Override time window varsa onu kullan
        const timeWindow = validateTimeWindow(stopData.overrideTimeWindow.start, stopData.overrideTimeWindow.end);
        arriveBetweenStart = timeWindow?.start;
        arriveBetweenEnd = timeWindow?.end;
      } else if (customer.timeWindow) {
        // Override yoksa customer'ın default time window'unu kullan
        const timeWindow = validateTimeWindow(customer.timeWindow.start, customer.timeWindow.end);
        arriveBetweenStart = timeWindow?.start;
        arriveBetweenEnd = timeWindow?.end;
      }

      return {
        id: isEdit && initialData?.stops?.[index]?.id ? initialData.stops[index].id : `${Date.now()}-${index}`,
        routeId: initialData?.id || '',
        customerId: customerId,
        customer: customer,
        order: index + 1,
        status: 'pending',
        arriveBetweenStart: arriveBetweenStart,
        arriveBetweenEnd: arriveBetweenEnd,
        orderType: stopData.positionConstraint === 'first' ? 10 :
                   stopData.positionConstraint === 'last' ? 30 : 20,
        serviceTime: stopData.serviceTime,
        signatureRequired: stopData.signatureRequired,
        photoRequired: stopData.photoRequired,
        stopNotes: stopData.stopNotes,
        estimatedArrival: new Date(),
        distance: 0,
        estimatedArrivalTime: stopData.estimatedArrivalTime,
        estimatedDepartureTime: stopData.estimatedDepartureTime
      };
    });

    const routeData: Partial<Route> = {
      ...formData,
      stops,
      currentKm: formData.currentKm,
      totalDeliveries: stops.length,
      totalDuration: formData.totalDuration || calculateTotalDuration(),
      totalDistance: formData.totalDistance || 0,
      status: 'planned',
      optimized: formData.optimized || false,
      driver: drivers.find(d => d.id.toString() === formData.driverId?.toString()),
      vehicle: vehicles.find(v => v.id.toString() === formData.vehicleId?.toString()),
      depot: selectedDepot,
      startDetails: {
        startTime: timeStringToTimeSpan(startTime),
        name: selectedDepot.name,
        address: selectedDepot.address,
        latitude: selectedDepot.latitude,
        longitude: selectedDepot.longitude
      }
    };

    if (!isEdit && !formData.id) {
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

      // Time window handling - Override varsa onu kullan, yoksa customer default'unu kullan
      let arriveBetweenStart: string | undefined;
      let arriveBetweenEnd: string | undefined;

      if (stopData.overrideTimeWindow) {
        // Override time window varsa onu kullan
        const timeWindow = validateTimeWindow(stopData.overrideTimeWindow.start, stopData.overrideTimeWindow.end);
        arriveBetweenStart = timeWindow?.start;
        arriveBetweenEnd = timeWindow?.end;
      } else if (customer.timeWindow) {
        // Override yoksa customer'ın default time window'unu kullan
        const timeWindow = validateTimeWindow(customer.timeWindow.start, customer.timeWindow.end);
        arriveBetweenStart = timeWindow?.start;
        arriveBetweenEnd = timeWindow?.end;
      }

      return {
        id: isEdit && initialData?.stops?.[index]?.id ? initialData.stops[index].id : `${Date.now()}-${index}`,
        routeId: initialData?.id || '',
        customerId: customerId,
        customer: customer,
        order: index + 1,
        status: 'pending',
        arriveBetweenStart: arriveBetweenStart,
        arriveBetweenEnd: arriveBetweenEnd,
        orderType: stopData.positionConstraint === 'first' ? 10 :
                   stopData.positionConstraint === 'last' ? 30 : 20,
        serviceTime: stopData.serviceTime,
        signatureRequired: stopData.signatureRequired,
        photoRequired: stopData.photoRequired,
        stopNotes: stopData.stopNotes,
        estimatedArrival: new Date(),
        distance: 0,
        estimatedArrivalTime: stopData.estimatedArrivalTime,
        estimatedDepartureTime: stopData.estimatedDepartureTime
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
      depot: selectedDepot,
      startDetails: {
        startTime: timeStringToTimeSpan(startTime),
        name: selectedDepot?.name || '',
        address: selectedDepot?.address || '',
        latitude: selectedDepot?.latitude || 0,
        longitude: selectedDepot?.longitude || 0
      }
    };

    if (!isEdit && !formData.id) {
      localStorage.removeItem(STORAGE_KEY);
    }

    if (onSaveAsDraft) {
      onSaveAsDraft(routeData);
    }
  };

  // BUGFIX: Memoize depot location to prevent MapComponent re-render
  const depotLocation = useMemo((): LatLng | undefined => {
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
  }, [depots, formData.depotId]);

  const handleMapLoad = (map: google.maps.Map) => {
    googleMapsService.initializeServices(map);
  };

  // BUGFIX: Memoize map markers to prevent MapComponent re-render on every parent render
  const mapMarkers = useMemo((): MarkerData[] => {
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
  }, [stopsData]);

  // BUGFIX: Memoize customers array to prevent MapComponent re-render
  const customersForMap = useMemo(() => stopsData.map(s => s.customer), [stopsData]);

  if (loadingLists) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
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
                placeholder="İstanbul Merkez - 02 Eki 2025"
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
                Başlangıç Saati <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Rotanın planlanan başlangıç saati</p>
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

              {/* Current KM Input - Shown when vehicle is selected */}
              {formData.vehicleId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Güncel Kilometre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentKmInput}
                    onChange={(e) => {
                      // BUGFIX: Only update local input state, don't touch formData
                      console.log('🚗 Km input changed:', e.target.value); // DEBUG
                      setCurrentKmInput(e.target.value);
                    }}
                    onBlur={(e) => {
                      // Only update formData when input loses focus
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      updateFormData({ currentKm: value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Aracın güncel km'sini giriniz"
                    required
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Aracın güncel kilometresini girmeniz gerekmektedir
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
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
                <label className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={avoidTolls}
                    onChange={(e) => {
                      setAvoidTolls(e.target.checked);
                      // Ücretli yol ayarı değiştiğinde optimizasyonu resetle
                      resetOptimization();
                    }}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-700 font-medium">Ücretli yollardan kaçın</span>
                </label>
              )}

              <button
                type="button"
                onClick={handleOptimize}
                disabled={stopsData.length < 2 || optimizing || optimizationStatus !== 'none'}
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

              {optimizationStatus !== 'none' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Formu Temizle
                </button>
              )}
            </div>
          </div>

          <CustomerSelector
            customers={customers}
            selectedCustomers={stopsData.map(s => s.customer)}
            onSelect={handleAddCustomer}
            onMultiSelect={handleAddMultipleCustomers}
            onCreateNew={() => setShowCustomerModal(true)}
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
              markers={mapMarkers}
              depot={depotLocation}
              directions={mapDirections}
              customers={customersForMap}
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
                    {optimizationStatus === 'success'
                      ? 'Rota başarıyla optimize edildi'
                      : optimizationStatus === 'partial'
                        ? 'Bazı duraklar zaman uyumsuzluğu nedeniyle dahil edilemedi'
                        : 'Optimize Et butonuna basarak rotanızı optimize edebilirsiniz'}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Duraklar {stopsData.length > 0 && `(${stopsData.length})`}
            </h2>

            {stopsData.length > 0 || excludedStops.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <StopsList
                  stops={stopsData}
                  excludedStops={excludedStops}
                  optimizationStatus={optimizationStatus}
                  onRemove={handleRemoveCustomer}
                  onReorder={handleReorderStops}
                  onUpdateStop={handleUpdateStop}
                  onMoveExcludedToStops={handleMoveExcludedToStops}
                  depotStart={
                    depots.find(d => d.id.toString() === formData.depotId?.toString())
                      ? {
                          name: depots.find(d => d.id.toString() === formData.depotId?.toString())?.name || '',
                          address: depots.find(d => d.id.toString() === formData.depotId?.toString())?.address || '',
                          startTime: startTime
                        }
                      : null
                  }
                  depotReturn={
                    optimizationStatus !== 'none' && depots.find(d => d.id.toString() === formData.depotId?.toString())
                      ? {
                          name: depots.find(d => d.id.toString() === formData.depotId?.toString())?.name || 'Depo',
                          address: depots.find(d => d.id.toString() === formData.depotId?.toString())?.address || '',
                          estimatedArrivalTime: endDetails?.estimatedArrivalTime || initialData?.endDetails?.estimatedArrivalTime
                        }
                      : undefined
                  }
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
            disabled={loading || stopsData.length === 0 || optimizationStatus === 'none'}
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

      {/* Müşteri Ekleme Modal'ı */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Yeni Müşteri Ekle"
        size="xl"
      >
        <CustomerForm
          onSubmit={handleCreateCustomer}
          loading={savingCustomer}
        />
      </Modal>
    </>
  );
};

export default RouteForm;
