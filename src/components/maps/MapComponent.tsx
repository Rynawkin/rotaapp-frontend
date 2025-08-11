import React, { useState, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  InfoWindow,
  Polyline
} from '@react-google-maps/api';
import { MapPin, Navigation, Home, Loader2 } from 'lucide-react';
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
}

// Modern harita stili - Circuit benzeri
const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8f8f8f" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#fefefe" }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9c9c9" }]
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }]
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
  onMapLoad
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // useJsApiLoader hook'u ile Google Maps'i yükle
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    // ID kullanarak birden fazla yüklemeyi engelle
    id: 'google-map-script'
  });

  const containerStyle = {
    width: '100%',
    height: height
  };

  const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    styles: mapStyles,
    gestureHandling: 'cooperative'
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
  };

  // Modern marker icon oluştur
  const createMarkerIcon = (label: string, color: string, isDepot: boolean = false) => {
    if (!window.google || !window.google.maps) return undefined;
    
    if (isDepot) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        labelOrigin: new google.maps.Point(0, 0)
      };
    }
    
    return {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      scale: 1.5,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      anchor: new google.maps.Point(12, 24),
      labelOrigin: new google.maps.Point(12, 10)
    };
  };

  // Map bounds'ları ayarla
  useEffect(() => {
    if (map && (markers.length > 0 || depot)) {
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
        
        // Çok yakın zoom'u engelle
        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 16) {
            map.setZoom(16);
          }
        });
      }
    }
  }, [map, markers, depot]);

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
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Harita render
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={mapOptions}
    >
      {/* Depot Marker - Başlangıç ve Bitiş Noktası */}
      {depot && (
        <Marker
          position={depot}
          icon={createMarkerIcon('D', '#3B82F6', true)}
          label={{
            text: 'DEPO',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}
          title="Ana Depo - Başlangıç ve Bitiş Noktası"
          zIndex={1000}
        />
      )}

      {/* Customer Markers - Optimize edilmiş sıraya göre numaralandır */}
      {markers.map((marker, index) => {
        // Optimize edilmiş sıra numarasını al
        const orderNumber = optimizedOrder && optimizedOrder.length > 0
          ? optimizedOrder.indexOf(index) + 1
          : (parseInt(marker.label || '0') || index + 1);
        
        return (
          <Marker
            key={`marker-${index}-${orderNumber}`}
            position={marker.position}
            title={marker.title}
            onClick={() => handleMarkerClick(marker)}
            icon={createMarkerIcon(String(orderNumber), '#10B981', false)}
            label={{
              text: String(orderNumber),
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            zIndex={500 + orderNumber}
          />
        );
      })}

      {/* Directions - Optimize edilmiş rota */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true, // Varsayılan marker'ları gizle
            polylineOptions: {
              strokeColor: '#3B82F6',
              strokeWeight: 4,
              strokeOpacity: 0.8,
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
            strokeWeight: 3,
            strokeOpacity: 0.7,
            geodesic: true
          }}
        />
      )}

      {/* Info Window */}
      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-gray-900 mb-1">{selectedMarker.title}</h3>
            {selectedMarker.customerId && customers.length > 0 && (
              <>
                {customers.find(c => c.id === selectedMarker.customerId)?.address && (
                  <p className="text-sm text-gray-600 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {customers.find(c => c.id === selectedMarker.customerId)?.address}
                  </p>
                )}
                {customers.find(c => c.id === selectedMarker.customerId)?.phone && (
                  <p className="text-sm text-gray-600">
                    📞 {customers.find(c => c.id === selectedMarker.customerId)?.phone}
                  </p>
                )}
                {customers.find(c => c.id === selectedMarker.customerId)?.timeWindow && (
                  <p className="text-sm text-gray-600">
                    🕐 {customers.find(c => c.id === selectedMarker.customerId)?.timeWindow?.start} - 
                    {customers.find(c => c.id === selectedMarker.customerId)?.timeWindow?.end}
                  </p>
                )}
              </>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default MapComponent;