import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  InfoWindow,
  Polyline
} from '@react-google-maps/api';
import { MapPin, Navigation, Home, Loader2, Package, Clock, Phone, Star, ChevronRight } from 'lucide-react';
import { LatLng, MarkerData } from '@/types/maps';
import { Customer } from '@/types';

const libraries: ("places" | "drawing" | "geometry")[] = ['places'];

interface MapComponentProps {
  center?: LatLng;
  zoom?: number;
  height?: string;
  markers?: MarkerData[];
  directions?: google.maps.DirectionsResult;
  customers?: Customer[];
  depot?: LatLng;
  showTraffic?: boolean;
  optimizedOrder?: number[];
  onMapClick?: (latLng: LatLng) => void;
  onMarkerClick?: (marker: MarkerData) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  selectedCustomerId?: string;
  onCustomerSelect?: (customerId: string) => void;
}

// Ultra modern harita stili - Circuit/Uber benzeri
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
    "stylers": [{ "color": "#c5cae9" }]
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
  onCustomerSelect
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const initialBoundsSet = useRef(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // useJsApiLoader hook'u ile Google Maps'i yükle
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    id: 'google-map-script'
  });

  const containerStyle = {
    width: '100%',
    height: height,
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    styles: modernMapStyle,
    gestureHandling: 'greedy', // CTRL tuşu olmadan zoom yapılabilir
    zoomControlOptions: {
      position: google.maps?.ControlPosition?.RIGHT_CENTER
    },
    fullscreenControlOptions: {
      position: google.maps?.ControlPosition?.TOP_RIGHT
    },
    scrollwheel: true, // Mouse wheel ile zoom
    disableDoubleClickZoom: false,
    minZoom: 8,
    maxZoom: 19
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Trafik katmanı
    if (showTraffic) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);
    }

    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [showTraffic, onMapLoad]);

  const onUnmount = useCallback(() => {
    setMap(null);
    initialBoundsSet.current = false;
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

  // Custom marker icon - SVG based
  const createCustomMarkerIcon = (number: string, isDepot: boolean = false, isSelected: boolean = false) => {
    if (!window.google || !window.google.maps) return undefined;

    if (isDepot) {
      // Depot için özel SVG icon
      const depotSvg = `
        <svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#shadow)">
            <circle cx="28" cy="28" r="24" fill="#3B82F6" stroke="white" stroke-width="3"/>
            <path d="M28 16 L36 24 L36 36 L20 36 L20 24 Z" fill="white"/>
            <rect x="24" y="28" width="8" height="8" fill="#3B82F6"/>
          </g>
          <defs>
            <filter id="shadow" x="0" y="0" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.25"/>
            </filter>
          </defs>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(depotSvg),
        scaledSize: new google.maps.Size(56, 56),
        anchor: new google.maps.Point(28, 28)
      };
    }

    // Normal marker için SVG
    const markerColor = isSelected ? '#EF4444' : '#10B981';
    const markerSvg = `
      <svg width="48" height="64" viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#shadow)">
          <path d="M24 0C10.745 0 0 10.745 0 24C0 42 24 64 24 64S48 42 48 24C48 10.745 37.255 0 24 0Z" 
                fill="${markerColor}" stroke="white" stroke-width="2.5"/>
          <circle cx="24" cy="24" r="16" fill="white"/>
          <text x="24" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="${markerColor}">${number}</text>
        </g>
        <defs>
          <filter id="shadow" x="-4" y="-4" width="56" height="72">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
      </svg>
    `;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
      scaledSize: new google.maps.Size(48, 64),
      anchor: new google.maps.Point(24, 64)
    };
  };

  // İlk yüklemede bounds ayarla
  useEffect(() => {
    if (map && !initialBoundsSet.current && (markers.length > 0 || depot)) {
      const bounds = new google.maps.LatLngBounds();
      
      // Depot'yu ekle
      if (depot) {
        bounds.extend(new google.maps.LatLng(depot.lat, depot.lng));
      }
      
      // Tüm marker'ları ekle
      markers.forEach(marker => {
        bounds.extend(new google.maps.LatLng(marker.position.lat, marker.position.lng));
      });
      
      // Bounds'a göre zoom ve center ayarla
      if (markers.length > 0 || depot) {
        map.fitBounds(bounds);
        
        // Padding ekle
        const padding = { top: 60, right: 60, bottom: 100, left: 60 };
        map.fitBounds(bounds, padding);
        
        // İlk bounds set edildi
        initialBoundsSet.current = true;
        
        // Çok yakın zoom'u engelle
        setTimeout(() => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 16) {
            map.setZoom(16);
          }
        }, 100);
      }
    }
  }, [map, markers.length, depot]);

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
        options={mapOptions}
      >
        {/* Depot Marker */}
        {depot && (
          <Marker
            position={depot}
            icon={createCustomMarkerIcon('', true)}
            title="Ana Depo - Başlangıç ve Bitiş Noktası"
            zIndex={1000}
            animation={google.maps.Animation.DROP}
          />
        )}

        {/* Customer Markers */}
        {markers && markers.length > 0 && markers.map((marker, index) => {
          const orderNumber = optimizedOrder && optimizedOrder.length > 0
            ? optimizedOrder.indexOf(index) + 1
            : index + 1;
          
          const isSelected = selectedCustomerId === marker.customerId;
          
          return (
            <Marker
              key={`customer-${marker.customerId || index}-${orderNumber}`}
              position={marker.position}
              title={marker.title}
              onClick={() => handleMarkerClick(marker)}
              onMouseOver={() => setHoveredMarker(marker.customerId || '')}
              onMouseOut={() => setHoveredMarker(null)}
              icon={createCustomMarkerIcon(String(orderNumber), false, isSelected)}
              zIndex={isSelected ? 2000 : 500 + orderNumber}
              animation={hoveredMarker === marker.customerId || isSelected ? google.maps.Animation.BOUNCE : undefined}
            />
          );
        })}

        {/* Directions - Optimize edilmiş rota */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 5,
                strokeOpacity: 0.85,
                geodesic: true
              },
              preserveViewport: true
            }}
          />
        )}

        {/* Alternatif: Basit polyline (directions yoksa) */}
        {!directions && depot && markers.length > 0 && (
          <Polyline
            path={[
              depot,
              ...markers.map(m => m.position),
              depot
            ]}
            options={{
              strokeColor: '#3B82F6',
              strokeWeight: 4,
              strokeOpacity: 0.8,
              geodesic: true,
              strokePattern: [{ repeat: '10px', icon: { path: google.maps.SymbolPath.CIRCLE, scale: 1 } }]
            }}
          />
        )}

        {/* Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -64)
            }}
          >
            <div className="p-3 min-w-[280px]">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{selectedMarker.title}</h3>
                {selectedMarker.customerId && customers.find(c => c.id === selectedMarker.customerId)?.priority === 'high' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Star className="w-3 h-3 mr-1" />
                    Yüksek
                  </span>
                )}
              </div>
              
              {selectedMarker.customerId && customers.length > 0 && (() => {
                const customer = customers.find(c => c.id === selectedMarker.customerId);
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
                  </div>
                );
              })()}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Modern Legend - Sol Alt */}
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
                <Home className="w-3 h-3 text-white" />
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
              <span className="text-sm font-medium text-gray-700">Duraklar</span>
            </div>
          )}
          {showTraffic && (
            <div className="flex items-center space-x-3">
              <div className="w-6 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Trafik</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Panel - Sol Alt (Legend'ın üstünde) */}
      {directions && (
        <div 
          className="absolute bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4"
          style={{ 
            bottom: showTraffic ? '160px' : '140px', 
            left: '20px', 
            zIndex: 10,
            minWidth: '200px'
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Toplam Mesafe</span>
              <span className="text-sm font-bold text-gray-900">
                {(() => {
                  const totalDistance = directions.routes[0]?.legs?.reduce((sum, leg) => 
                    sum + (leg.distance?.value || 0), 0) || 0;
                  return (totalDistance / 1000).toFixed(1);
                })()} km
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tahmini Süre</span>
              <span className="text-sm font-bold text-gray-900">
                {(() => {
                  const totalDuration = directions.routes[0]?.legs?.reduce((sum, leg) => 
                    sum + (leg.duration?.value || 0), 0) || 0;
                  return Math.round(totalDuration / 60);
                })()} dk
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Durak Sayısı</span>
              <span className="text-sm font-bold text-gray-900">
                {markers.length}
              </span>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default MapComponent;