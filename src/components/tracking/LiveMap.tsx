// src/components/tracking/LiveMap.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsRenderer
} from '@react-google-maps/api';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Package,
  TrendingUp,
  AlertCircle,
  Home,
  Truck,
  Car
} from 'lucide-react';
import { Journey } from '@/types';

// TÜM UYGULAMADA AYNI libraries KULLAN
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

interface LiveMapProps {
  journeys: Journey[];
  selectedJourneyId?: string;
  onJourneySelect?: (journey: Journey) => void;
  height?: string;
}

const LiveMap: React.FC<LiveMapProps> = ({
  journeys,
  selectedJourneyId,
  onJourneySelect,
  height = '500px'
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Journey | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  // Kontrol state'leri
  const [userInteracted, setUserInteracted] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const userInteractionTimerRef = useRef<NodeJS.Timeout>();
  const lastDirectionsJourneyId = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // TÜM UYGULAMADA AYNI ID KULLAN
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    id: 'google-map-script' // TÜM MAP COMPONENTLERINDE AYNI ID
  });

  const containerStyle = {
    width: '100%',
    height: height,
    borderRadius: '8px'
  };

  const center = {
    lat: 40.9869,
    lng: 29.0252
  };

  // Modern map style
  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "transit",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    directionsServiceRef.current = new google.maps.DirectionsService();
    
    // Kullanıcı haritayı hareket ettirdiğinde
    map.addListener('dragstart', () => {
      setUserInteracted(true);
      // 30 saniye sonra otomatik takibe geri dön
      if (userInteractionTimerRef.current) {
        clearTimeout(userInteractionTimerRef.current);
      }
      userInteractionTimerRef.current = setTimeout(() => {
        setUserInteracted(false);
      }, 30000);
    });

    map.addListener('zoom_changed', () => {
      // Programatik zoom değişikliklerini kullanıcı etkileşimi olarak sayma
      if (mapInitialized) {
        setUserInteracted(true);
        if (userInteractionTimerRef.current) {
          clearTimeout(userInteractionTimerRef.current);
        }
        userInteractionTimerRef.current = setTimeout(() => {
          setUserInteracted(false);
        }, 30000);
      }
    });

    // İlk yüklemede haritayı ortala - SADECE BİR KERE
    if (isFirstLoad.current && journeys.length > 0) {
      setTimeout(() => {
        fitBoundsInitial(map);
        setMapInitialized(true);
        isFirstLoad.current = false;
      }, 100);
    } else {
      setMapInitialized(true);
    }
  }, [journeys.length]);

  const onUnmount = useCallback(() => {
    setMap(null);
    directionsServiceRef.current = null;
    if (userInteractionTimerRef.current) {
      clearTimeout(userInteractionTimerRef.current);
    }
  }, []);

  // İlk yükleme için bounds ayarla - SADECE BİR KERE
  const fitBoundsInitial = (mapInstance: google.maps.Map) => {
    if (journeys.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;
    
    // Sadece araç pozisyonlarını ekle
    journeys.forEach(journey => {
      if (journey.liveLocation) {
        bounds.extend(
          new window.google.maps.LatLng(
            journey.liveLocation.latitude,
            journey.liveLocation.longitude
          )
        );
        hasValidBounds = true;
      }
    });

    if (hasValidBounds) {
      mapInstance.fitBounds(bounds);
      
      // Çok fazla zoom yapma
      setTimeout(() => {
        const zoom = mapInstance.getZoom();
        if (zoom && zoom > 14) {
          mapInstance.setZoom(14);
        }
      }, 100);
    }
  };

  // Directions'ı SADECE yeni araç seçildiğinde al
  useEffect(() => {
    if (!directionsServiceRef.current || !map || !selectedJourneyId) {
      return;
    }

    // Eğer bu journey için zaten directions aldıysak, tekrar alma
    if (lastDirectionsJourneyId.current === selectedJourneyId) {
      return;
    }

    const selectedJourney = journeys.find(j => j.id === selectedJourneyId);
    
    // ✅ DÜZELTME: Route kontrolü ekle
    if (!selectedJourney || !selectedJourney.liveLocation || !selectedJourney.route?.stops) {
      console.warn('Selected journey has no route or stops');
      return;
    }

    // Tüm duraklardan customer'ı olanları filtrele
    const allStops = selectedJourney.route.stops.filter(stop => stop.customer);
    
    if (allStops.length < 2) {
      setDirections(null);
      return;
    }

    // İlk ve son durak hariç ara durakları waypoint olarak ekle
    const waypoints = allStops.slice(1, -1).map(stop => ({
      location: new google.maps.LatLng(
        stop.customer!.latitude,
        stop.customer!.longitude
      ),
      stopover: true
    }));

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(
        allStops[0].customer!.latitude,
        allStops[0].customer!.longitude
      ),
      destination: new google.maps.LatLng(
        allStops[allStops.length - 1].customer!.latitude,
        allStops[allStops.length - 1].customer!.longitude
      ),
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
      unitSystem: google.maps.UnitSystem.METRIC,
      region: 'TR'
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === 'OK' && result) {
        setDirections(result);
        lastDirectionsJourneyId.current = selectedJourneyId;
        
        // Yeni rota yüklendiğinde haritayı SADECE kullanıcı etkileşimi yoksa ortala
        if (!userInteracted && map) {
          const bounds = new window.google.maps.LatLngBounds();
          
          // Rotanın bounds'larını al
          result.routes[0].overview_path.forEach(point => {
            bounds.extend(point);
          });
          
          // Aracın mevcut konumunu da ekle
          if (selectedJourney.liveLocation) {
            bounds.extend(new window.google.maps.LatLng(
              selectedJourney.liveLocation.latitude,
              selectedJourney.liveLocation.longitude
            ));
          }
          
          map.fitBounds(bounds);
          
          // Çok fazla zoom yapma
          setTimeout(() => {
            const zoom = map.getZoom();
            if (zoom && zoom > 14) {
              map.setZoom(14);
            }
          }, 100);
        }
      } else {
        console.error('Directions request failed:', status);
        setDirections(null);
      }
    });
  }, [selectedJourneyId, map, userInteracted]);

  // Araç değiştiğinde directions'ı sıfırla
  useEffect(() => {
    if (!selectedJourneyId || selectedJourneyId !== lastDirectionsJourneyId.current) {
      // Farklı bir araç seçildi, eski directions'ı temizle
      if (selectedJourneyId !== lastDirectionsJourneyId.current) {
        setDirections(null);
      }
    }
  }, [selectedJourneyId]);

  const getVehicleIcon = (journey: Journey) => {
    const isSelected = selectedJourneyId === journey.id;
    
    if (!window.google || !window.google.maps) return undefined;
    
    // Araç ikonu için SVG path
    const vehiclePath = 'M12 2L4 7v6c0 1.1.9 2 2 2h1c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 1.66 1.34 3 3 3s3-1.34 3-3h1c1.1 0 2-.9 2-2V7l-8-5zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM5 10V7.5L12 4l7 3.5V10H5z';
    
    return {
      path: vehiclePath,
      fillColor: isSelected ? '#EF4444' : '#10B981',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 12),
      rotation: journey.liveLocation?.heading || 0
    };
  };

  const getStopIcon = (status: string, isNext: boolean = false) => {
    if (!window.google || !window.google.maps) return undefined;
    
    const colors = {
      pending: '#9CA3AF',
      arrived: '#3B82F6',
      completed: '#10B981',
      failed: '#EF4444'
    };
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: isNext ? 10 : 8,
      fillColor: colors[status as keyof typeof colors] || '#9CA3AF',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      labelOrigin: new window.google.maps.Point(0, 0)
    };
  };

  const handleMarkerClick = (journey: Journey) => {
    setSelectedMarker(journey);
    if (onJourneySelect) {
      onJourneySelect(journey);
    }
  };

  // ✅ DÜZELTME: Null check ekle
  const getCurrentStop = (journey: Journey) => {
    if (!journey.route?.stops || journey.currentStopIndex === undefined) {
      return null;
    }
    return journey.route.stops[journey.currentStopIndex] || null;
  };

  // ✅ DÜZELTME: Null check ekle
  const getCompletionPercentage = (journey: Journey) => {
    if (!journey.route?.stops || journey.route.stops.length === 0) {
      return 0;
    }
    const completed = journey.route.stops.filter(s => s.status === 'completed').length;
    return Math.round((completed / journey.route.stops.length) * 100);
  };

  // Manuel olarak haritayı seçili araca ortala
  const centerOnSelectedVehicle = () => {
    if (!map || !selectedJourneyId) return;
    
    const selectedJourney = journeys.find(j => j.id === selectedJourneyId);
    if (selectedJourney && selectedJourney.liveLocation) {
      map.panTo({
        lat: selectedJourney.liveLocation.latitude,
        lng: selectedJourney.liveLocation.longitude
      });
      map.setZoom(14);
      setUserInteracted(false); // Manuel kontrolü sıfırla
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Harita yüklenemedi</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Direction Renderer - Sadece bir kere yüklenir, güncellenmez */}
        {directions && selectedJourneyId && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // Kendi marker'larımızı kullan
              suppressInfoWindows: true,
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeOpacity: 0.8,
                strokeWeight: 4
              }
            }}
          />
        )}

        {/* Vehicle Markers - Sürekli güncellenir */}
        {journeys.map(journey => {
          // ✅ DÜZELTME: Null check ekle
          if (!journey.route) {
            console.warn(`Journey ${journey.id} has no route, skipping map markers`);
            return null;
          }
          
          return (
            <React.Fragment key={journey.id}>
              {journey.liveLocation && (
                <Marker
                  position={{
                    lat: journey.liveLocation.latitude,
                    lng: journey.liveLocation.longitude
                  }}
                  icon={getVehicleIcon(journey)}
                  title={`${journey.route.driver?.name || 'Sürücü'} - ${journey.route.vehicle?.plateNumber || 'Araç'}`}
                  onClick={() => handleMarkerClick(journey)}
                  zIndex={selectedJourneyId === journey.id ? 1000 : 100}
                />
              )}

              {/* Stop Markers for selected journey */}
              {selectedJourneyId === journey.id && journey.route.stops?.map((stop, index) => {
                if (!stop.customer) return null;
                const isNext = index === journey.currentStopIndex;
                
                return (
                  <Marker
                    key={`${journey.id}-stop-${index}`}
                    position={{
                      lat: stop.customer.latitude,
                      lng: stop.customer.longitude
                    }}
                    icon={getStopIcon(stop.status, isNext)}
                    label={{
                      text: String(stop.order),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                    title={`${stop.customer.name} - ${stop.status === 'completed' ? 'Tamamlandı' : 
                            stop.status === 'arrived' ? 'Varıldı' : 'Bekliyor'}`}
                    zIndex={isNext ? 90 : 50}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Info Window */}
        {selectedMarker && selectedMarker.liveLocation && (
          <InfoWindow
            position={{
              lat: selectedMarker.liveLocation.latitude,
              lng: selectedMarker.liveLocation.longitude
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">
                  {selectedMarker.route?.vehicle?.plateNumber || 'Araç Bilgisi Yok'}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedMarker.status === 'in_progress' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedMarker.status === 'in_progress' ? 'Aktif' : 'Başladı'}
                </span>
              </div>
              
              <div className="space-y-1 text-sm">
                {selectedMarker.route?.driver && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedMarker.route.driver.name}</span>
                  </div>
                )}
                
                {selectedMarker.liveLocation?.speed !== undefined && (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{Math.round(selectedMarker.liveLocation.speed)} km/h</span>
                  </div>
                )}
                
                {selectedMarker.route && (
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-gray-400 mr-2" />
                    <span>
                      {selectedMarker.route.completedDeliveries || 0} / {selectedMarker.route.totalDeliveries || 0} teslimat
                    </span>
                  </div>
                )}
                
                {getCurrentStop(selectedMarker) && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="truncate">
                      Hedef: {getCurrentStop(selectedMarker)?.customer?.name || 'Bilinmiyor'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">İlerleme</span>
                  <span className="text-xs font-semibold">
                    %{getCompletionPercentage(selectedMarker)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${getCompletionPercentage(selectedMarker)}%` }}
                  />
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Kontrol Butonları */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Kullanıcı Etkileşim Göstergesi */}
        {userInteracted && (
          <div className="bg-yellow-100 text-yellow-800 rounded-lg shadow-lg px-3 py-2 text-sm">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Manuel kontrol (30sn)</span>
            </div>
          </div>
        )}
        
        {/* Merkeze Dön Butonu */}
        {selectedJourneyId && (
          <button
            onClick={centerOnSelectedVehicle}
            className="bg-white hover:bg-gray-100 rounded-lg shadow-lg p-2 transition-colors"
            title="Aracı Merkeze Al"
          >
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Gösterim</h4>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Aktif Araç</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Seçili Araç</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Sonraki Durak</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600">Bekleyen Durak</span>
          </div>
        </div>
      </div>

      {/* Active Vehicles Counter */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm font-semibold text-gray-700">
            {journeys.filter(j => j.status === 'in_progress' || j.status === 'started').length} Aktif Araç
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;