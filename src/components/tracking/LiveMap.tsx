// src/components/tracking/LiveMap.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline
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
  Home
} from 'lucide-react';
import { Journey } from '@/types';

const libraries: ("places" | "drawing" | "geometry")[] = ['places'];

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
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
    id: 'google-map-script' // Aynı ID'yi kullan
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
    fitBounds(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const fitBounds = (mapInstance?: google.maps.Map) => {
    const currentMap = mapInstance || map;
    if (!currentMap || journeys.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    // Add vehicle positions
    journeys.forEach(journey => {
      if (journey.liveLocation) {
        bounds.extend(
          new window.google.maps.LatLng(
            journey.liveLocation.latitude,
            journey.liveLocation.longitude
          )
        );
      }
      
      // Add depot position
      const depot = journey.route.stops[0]?.customer;
      if (depot) {
        bounds.extend(
          new window.google.maps.LatLng(depot.latitude, depot.longitude)
        );
      }
      
      // Add destination positions
      journey.route.stops.forEach(stop => {
        if (stop.customer) {
          bounds.extend(
            new window.google.maps.LatLng(
              stop.customer.latitude,
              stop.customer.longitude
            )
          );
        }
      });
    });

    currentMap.fitBounds(bounds);
    
    // Don't zoom in too much
    setTimeout(() => {
      const zoom = currentMap.getZoom();
      if (zoom && zoom > 14) {
        currentMap.setZoom(14);
      }
    }, 100);
  };

  // Update bounds when journeys change
  useEffect(() => {
    if (map && journeys.length > 0) {
      fitBounds();
    }
  }, [journeys, map]);

  const getVehicleIcon = (journey: Journey) => {
    const isSelected = selectedJourneyId === journey.id;
    const color = isSelected ? '#EF4444' : '#10B981';
    
    if (!window.google || !window.google.maps) return undefined;
    
    return {
      path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 12),
      rotation: journey.liveLocation?.heading || 0
    };
  };

  const getStopIcon = (status: string, order: number) => {
    if (!window.google || !window.google.maps) return undefined;
    
    const colors = {
      pending: '#9CA3AF',
      arrived: '#3B82F6',
      completed: '#10B981',
      failed: '#EF4444'
    };
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: colors[status as keyof typeof colors] || '#9CA3AF',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      labelOrigin: new window.google.maps.Point(0, 0)
    };
  };

  const getDepotIcon = () => {
    if (!window.google || !window.google.maps) return undefined;
    
    return {
      path: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
      fillColor: '#3B82F6',
      fillOpacity: 1,
      strokeColor: 'white',
      strokeWeight: 2,
      scale: 1.5,
      anchor: new window.google.maps.Point(12, 12)
    };
  };

  const handleMarkerClick = (journey: Journey) => {
    setSelectedMarker(journey);
    if (onJourneySelect) {
      onJourneySelect(journey);
    }
  };

  const getCurrentStop = (journey: Journey) => {
    return journey.route.stops[journey.currentStopIndex];
  };

  const getCompletionPercentage = (journey: Journey) => {
    const completed = journey.route.stops.filter(s => s.status === 'completed').length;
    return Math.round((completed / journey.route.stops.length) * 100);
  };

  const getRouteColor = (journey: Journey) => {
    if (selectedJourneyId === journey.id) return '#EF4444';
    if (journey.status === 'completed') return '#10B981';
    if (journey.status === 'in_progress') return '#3B82F6';
    return '#9CA3AF';
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
        {journeys.map(journey => (
          <React.Fragment key={journey.id}>
            {/* Vehicle Marker */}
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

            {/* Route Path */}
            {journey.route.stops.length > 1 && (
              <Polyline
                path={[
                  // Start from current location
                  journey.liveLocation ? {
                    lat: journey.liveLocation.latitude,
                    lng: journey.liveLocation.longitude
                  } : {
                    lat: journey.route.stops[0].customer?.latitude || 0,
                    lng: journey.route.stops[0].customer?.longitude || 0
                  },
                  // Add remaining stops
                  ...journey.route.stops
                    .slice(journey.currentStopIndex)
                    .filter(stop => stop.customer)
                    .map(stop => ({
                      lat: stop.customer!.latitude,
                      lng: stop.customer!.longitude
                    }))
                ]}
                options={{
                  strokeColor: getRouteColor(journey),
                  strokeOpacity: selectedJourneyId === journey.id ? 1 : 0.6,
                  strokeWeight: selectedJourneyId === journey.id ? 4 : 3,
                  geodesic: true
                }}
              />
            )}

            {/* Stop Markers */}
            {journey.route.stops.map((stop, index) => {
              if (!stop.customer) return null;
              
              return (
                <Marker
                  key={`${journey.id}-stop-${index}`}
                  position={{
                    lat: stop.customer.latitude,
                    lng: stop.customer.longitude
                  }}
                  icon={getStopIcon(stop.status, stop.order)}
                  label={{
                    text: String(stop.order),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  title={stop.customer.name}
                  zIndex={50}
                />
              );
            })}
          </React.Fragment>
        ))}

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
                  {selectedMarker.route.vehicle?.plateNumber}
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
                {selectedMarker.route.driver && (
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
                
                <div className="flex items-center">
                  <Package className="w-4 h-4 text-gray-400 mr-2" />
                  <span>
                    {selectedMarker.route.completedDeliveries} / {selectedMarker.route.totalDeliveries} teslimat
                  </span>
                </div>
                
                {getCurrentStop(selectedMarker) && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="truncate">
                      Hedef: {getCurrentStop(selectedMarker)?.customer?.name}
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
            <span className="text-xs text-gray-600">Depo</span>
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
            {journeys.length} Aktif Araç
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;