// frontend/src/components/maps/MapPicker.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Loader2, Check, X, Navigation } from 'lucide-react';
import { googleMapsService } from '@/services/googleMapsService';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  onCancel: () => void;
}

const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 40.9869,
  initialLng = 29.0252,
  onLocationSelect,
  onCancel
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    id: 'google-map-script'
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLat,
    lng: initialLng
  });
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Harita yüklendiğinde
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    googleMapsService.initializeServices(map);
    
    // İstanbul'a odakla
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(40.8, 28.6), // İstanbul güneybatı
      new google.maps.LatLng(41.3, 29.5)  // İstanbul kuzeydoğu
    );
    map.fitBounds(bounds);
    
    // İlk konumun adresini al
    getAddressFromCoordinates(initialLat, initialLng);
  }, [initialLat, initialLng]);

  // Koordinatlardan adres al
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const address = await googleMapsService.reverseGeocode({ lat, lng });
      if (address) {
        setAddress(address);
      } else {
        setAddress('Adres bulunamadı');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress('Adres alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Haritaya tıklandığında
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && !isDragging) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      getAddressFromCoordinates(lat, lng);
    }
  };

  // Marker sürüklendiğinde
  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      getAddressFromCoordinates(lat, lng);
    }
    setIsDragging(false);
  };

  // Konumu onayla
  const handleConfirm = () => {
    if (address && address !== 'Adres bulunamadı' && address !== 'Adres alınamadı') {
      onLocationSelect({
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        address: address
      });
    } else {
      alert('Lütfen geçerli bir konum seçin');
    }
  };

  // Mevcut konuma git
  const goToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
          }
          getAddressFromCoordinates(lat, lng);
        },
        (error) => {
          console.error('Konum alınamadı:', error);
          alert('Konumunuz alınamadı. Lütfen konum izinlerini kontrol edin.');
        }
      );
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Harita */}
      <div className="relative h-[500px] rounded-lg overflow-hidden border border-gray-300">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={markerPosition}
          zoom={15}
          onLoad={onLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy'
          }}
        >
          <Marker
            position={markerPosition}
            draggable={true}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleMarkerDragEnd}
            animation={google.maps.Animation.DROP}
          />
        </GoogleMap>

        {/* Mevcut Konum Butonu */}
        <button
          type="button"
          onClick={goToCurrentLocation}
          className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
          title="Mevcut konumuma git"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>

        {/* Yükleniyor göstergesi */}
        {loading && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Adres alınıyor...</span>
          </div>
        )}
      </div>

      {/* Adres ve Koordinat Bilgileri */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Seçilen Adres
            </label>
            <div className="p-3 bg-white rounded border border-gray-200 min-h-[60px]">
              {loading ? (
                <div className="flex items-center text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adres alınıyor...
                </div>
              ) : (
                <p className="text-sm text-gray-800">{address || 'Haritada bir nokta seçin'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Koordinatlar
            </label>
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Enlem:</span> {markerPosition.lat.toFixed(6)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Boylam:</span> {markerPosition.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Talimatlar */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <strong>Kullanım:</strong> Haritada istediğiniz noktaya tıklayın veya işaretçiyi sürükleyin. 
            Adres otomatik olarak alınacaktır.
          </p>
        </div>
      </div>

      {/* Butonlar */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          İptal
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || !address || address === 'Adres bulunamadı'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          <Check className="w-4 h-4 mr-2" />
          Bu Konumu Seç
        </button>
      </div>
    </div>
  );
};

export default MapPicker;