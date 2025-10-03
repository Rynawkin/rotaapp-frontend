import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  InfoWindow
} from '@react-google-maps/api';
import { MapPin, Navigation, Home, Loader2, Package, Clock, Phone, Star, ExternalLink } from 'lucide-react';
import { LatLng, MarkerData } from '@/types/maps';
import { Customer } from '@/types';

// TÜM UYGULAMADA AYNI libraries KULLAN
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

export type MarkerStyle = 'pin' | 'bubble' | 'shield' | 'emoji';

interface MapComponentProps {
  center?: LatLng;
  zoom?: number;
  height?: string;
  markers?: MarkerData[];
  directions?: google.maps.DirectionsResult | null;
  customers?: Customer[];
  depot?: LatLng;
  showTraffic?: boolean;
  optimizedOrder?: number[];
  onMapClick?: (latLng: LatLng) => void;
  onMarkerClick?: (marker: MarkerData) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  selectedCustomerId?: string;
  onCustomerSelect?: (customerId: string) => void;
  markerStyle?: MarkerStyle;
}

// Ultra modern harita stili
const modernMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f8f9fa" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6c757d" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e8f5e9" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#66bb6a" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#e8eaf6" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#c5cae9", "weight": 1 }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c5cae9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "poi.business",
    "stylers": [{ "visibility": "off" }]
  }
];

const MapComponent: React.FC<MapComponentProps> = ({
  center = { lat: 40.9869, lng: 29.0252 },
  zoom = 11,
  height = '400px',
  markers = [],
  directions,
  customers = [],
  depot,
  showTraffic = false,
  optimizedOrder,
  onMapClick,
  onMarkerClick,
  onMapLoad,
  selectedCustomerId,
  onCustomerSelect,
  markerStyle = 'pin'
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const initialBoundsSet = useRef(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // useJsApiLoader hook'u ile Google Maps'i yükle - TÜM UYGULAMADA AYNI ID KULLAN
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    id: 'google-map-script' // TÜM MAP COMPONENTLERINDE AYNI ID
  });

  const containerStyle = {
    width: '100%',
    height: height,
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const getMapOptions = useCallback((): google.maps.MapOptions => {
    const baseOptions: any = {
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true, // Harita türü seçimi aktif
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      styles: modernMapStyle,
      gestureHandling: 'greedy',
      scrollwheel: true,
      disableDoubleClickZoom: false,
      minZoom: 8,
      maxZoom: 19
    };

    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      baseOptions.zoomControlOptions = {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      };
      baseOptions.fullscreenControlOptions = {
        position: window.google.maps.ControlPosition.TOP_RIGHT
      };
      baseOptions.mapTypeControlOptions = {
        position: window.google.maps.ControlPosition.TOP_LEFT,
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU, // Dropdown menü olarak göster
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'] // Tüm harita türleri
      };
    }

    return baseOptions;
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded successfully');
    setMap(map);
    
    // Props'tan zoom değeri verilmişse kullan
    if (zoom) {
      map.setZoom(zoom);
    }
    
    // Map'in gerçekten hazır olduğundan emin olmak için kısa bir gecikme
    setTimeout(() => {
      setMapReady(true);
      console.log('Map is ready for markers');
    }, 100);

    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad, zoom]);

  const onUnmount = useCallback(() => {
    console.log('Map unmounting');
    setMap(null);
    setMapReady(false);
    // Unmount olduğunda bounds'u reset etme, çünkü aynı component tekrar kullanılabilir
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      onMapClick({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [onMapClick]);

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
    if (onCustomerSelect && marker.customerId) {
      onCustomerSelect(marker.customerId);
    }
  };

  // Modern pin-style marker icon oluştur
  const createPinIcon = (color: string, label?: string) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) return undefined;

    // Modern pin SVG path (sharp, clean design)
    const pinPath = 'M12 0C7.589 0 4 3.589 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.411-3.589-8-8-8z';

    return {
      path: pinPath,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2.5,
      scale: 2.2,
      anchor: new window.google.maps.Point(12, 24),
      labelOrigin: new window.google.maps.Point(12, 8)
    };
  };

  // Bubble/Circle marker - yuvarlak baloncuk (sosyal medya için şık)
  const createBubbleIcon = (color: string) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) return undefined;

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.95,
      strokeColor: 'white',
      strokeWeight: 3,
      scale: 14,
      anchor: new window.google.maps.Point(0, 0)
    };
  };

  // Shield/Badge marker - kalkan şekli (premium görünüm)
  const createShieldIcon = (color: string) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) return undefined;

    // Shield SVG path
    const shieldPath = 'M12 0L2 4v6c0 6.5 4.5 12 10 14 5.5-2 10-7.5 10-14V4L12 0z';

    return {
      path: shieldPath,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 24),
      labelOrigin: new window.google.maps.Point(12, 10)
    };
  };

  // Ana marker icon oluşturucu - style'a göre
  const createMarkerIcon = (color: string, style: MarkerStyle = 'pin', label?: string) => {
    switch (style) {
      case 'bubble':
        return createBubbleIcon(color);
      case 'shield':
        return createShieldIcon(color);
      case 'pin':
      default:
        return createPinIcon(color, label);
    }
  };

  // Component mount/unmount'ta bounds kontrolünü reset et
  useEffect(() => {
    return () => {
      initialBoundsSet.current = false;
    };
  }, []);

  // Bounds ayarla - markers veya depot değiştiğinde
  useEffect(() => {
    if (map && mapReady) {
      const hasContent = (markers && markers.length > 0) || depot;

      if (hasContent) {
        console.log('Setting bounds with markers:', markers?.length, 'depot:', depot);
        const bounds = new window.google.maps.LatLngBounds();

        if (depot) {
          bounds.extend(new window.google.maps.LatLng(depot.lat, depot.lng));
        }

        if (markers && markers.length > 0) {
          markers.forEach(marker => {
            if (marker.position && marker.position.lat && marker.position.lng) {
              bounds.extend(new window.google.maps.LatLng(marker.position.lat, marker.position.lng));
            }
          });
        }

        map.fitBounds(bounds);

        // Eğer sadece tek bir nokta varsa, zoom level'ı ayarla
        if ((markers?.length === 1 && !depot) || (!markers?.length && depot)) {
          setTimeout(() => {
            map.setZoom(15);
          }, 100);
        } else {
          const padding = { top: 60, right: 60, bottom: 100, left: 60 };
          map.fitBounds(bounds, padding);

          setTimeout(() => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 16) {
              map.setZoom(16);
            }
          }, 100);
        }

        initialBoundsSet.current = true;
      }
    }
  }, [map, mapReady, markers, depot]);

  // Debug log
  useEffect(() => {
    console.log('MapComponent state:', {
      isLoaded,
      mapReady,
      markersCount: markers?.length,
      depotExists: !!depot,
      mapExists: !!map
    });
  }, [isLoaded, mapReady, markers, depot, map]);

  // Hata durumu
  if (loadError) {
    return (
      <div className="w-full bg-red-50 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">Google Maps yüklenemedi</p>
          <p className="text-sm text-red-500 mt-1">API key veya internet bağlantınızı kontrol edin</p>
        </div>
      </div>
    );
  }

  // API Key kontrolü
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Google Maps API Key eksik</p>
          <p className="text-sm text-gray-500 mt-1">.env dosyasını kontrol edin</p>
        </div>
      </div>
    );
  }

  // Yükleniyor durumu
  if (!isLoaded) {
    return (
      <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="text-gray-600 mt-4">Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Marker'ları render et - SADECE mapReady true ise
  const renderMarkers = () => {
    if (!mapReady) {
      console.log('Map not ready yet, skipping markers');
      return null;
    }

    const markerElements = [];

    // Depot marker
    if (depot) {
      console.log('Adding depot marker at:', depot);
      markerElements.push(
        <Marker
          key="depot-marker"
          position={depot}
          icon={markerStyle === 'emoji' ? undefined : createMarkerIcon('#2563EB', markerStyle)}
          title="Ana Depo"
          zIndex={1000}
          label={{
            text: markerStyle === 'emoji' ? '🏢' : '🏢',
            color: 'white',
            fontSize: markerStyle === 'emoji' ? '32px' : '16px',
            fontWeight: 'bold'
          }}
        />
      );
    }

    // Customer markers
    if (markers && markers.length > 0) {
      markers.forEach((marker, index) => {
        if (!marker.position || !marker.position.lat || !marker.position.lng) {
          console.warn(`Invalid marker position for index ${index}:`, marker);
          return;
        }

        const orderNumber = marker.label || String(marker.order || index + 1);
        const isSelected = selectedCustomerId === marker.customerId;

        // Eğer tek marker varsa ve depot yoksa (DepotDetail sayfası için)
        const isSingleMarker = markers.length === 1 && !depot;

        // Marker rengi - gradient renkler (sosyal medya için daha çekici)
        const markerColor = isSelected ? '#EF4444' : isSingleMarker ? '#2563EB' : '#10B981';

        markerElements.push(
          <Marker
            key={`marker-${marker.customerId || index}`}
            position={marker.position}
            icon={markerStyle === 'emoji' ? undefined : createMarkerIcon(markerColor, markerStyle)}
            title={marker.title || `Müşteri ${index + 1}`}
            zIndex={isSelected ? 2000 : 500 + index}
            label={markerStyle === 'emoji' ? {
              text: '📍',
              fontSize: '32px',
              fontWeight: 'bold'
            } : (marker.label ? {
              text: orderNumber,
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            } : undefined)}
            onClick={() => handleMarkerClick(marker)}
          />
        );
      });
    }

    console.log(`Rendering ${markerElements.length} markers total`);
    return markerElements;
  };

  // Harita render
  return (
    <div className="relative rounded-xl overflow-hidden shadow-xl bg-white">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={getMapOptions()}
      >
        {/* Marker'ları render et */}
        {renderMarkers()}

        {/* Directions */}
        {directions && mapReady && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 4,
                strokeOpacity: 0.9,
                geodesic: true
              },
              preserveViewport: true
            }}
          />
        )}

        {/* Info Window */}
        {selectedMarker && window.google && window.google.maps && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -40)
            }}
          >
            <div className="p-3 min-w-[280px]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{selectedMarker.title}</h3>
                {selectedMarker.customerId && customers.find(c => c.id.toString() === selectedMarker.customerId)?.priority === 'high' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Star className="w-3 h-3 mr-1" />
                    Yüksek
                  </span>
                )}
              </div>
              
              {selectedMarker.customerId && customers.length > 0 && (() => {
                const customer = customers.find(c => c.id.toString() === selectedMarker.customerId);
                if (!customer) return null;
                
                return (
                  <div className="space-y-2 text-sm">
                    {customer.address && (
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{customer.address}</span>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{customer.phone}</span>
                      </div>
                    )}
                    
                    {customer.timeWindow && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {customer.timeWindow.start} - {customer.timeWindow.end}
                        </span>
                      </div>
                    )}
                    
                    {customer.estimatedServiceTime && (
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Servis süresi: {customer.estimatedServiceTime} dk
                        </span>
                      </div>
                    )}

                    {/* Customer Detail Link */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Link
                        to={`/customers/${customer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                        onClick={(e) => {
                          // InfoWindow'u kapatmadan yeni sekmede aç
                          e.stopPropagation();
                        }}
                      >
                        <span className="text-sm font-medium">Detayları Görüntüle</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Modern Legend */}
      <div 
        className="absolute bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4"
        style={{ 
          bottom: '20px', 
          left: '20px', 
          zIndex: 10,
          minWidth: '150px'
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">D</span>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Depo</span>
          </div>
          {markers.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">Duraklar ({markers.length})</span>
            </div>
          )}
        </div>
      </div>


      {/* Top Right Badge */}
      <div 
        className="absolute bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg px-4 py-2"
        style={{ 
          top: '16px', 
          right: '120px', 
          zIndex: 10
        }}
      >
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">Google Maps</span>
        </div>
      </div>

      {/* Map Ready Indicator - DEBUG */}
      {!mapReady && (
        <div 
          className="absolute bg-yellow-100 text-yellow-800 rounded px-3 py-1 text-xs"
          style={{ 
            top: '60px', 
            right: '20px', 
            zIndex: 10
          }}
        >
          Harita hazırlanıyor...
        </div>
      )}
    </div>
  );
};

export default MapComponent;