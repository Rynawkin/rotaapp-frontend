import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Save, 
  X, 
  Plus, 
  Info,
  Star,
  Navigation,
  Search
} from 'lucide-react';
import { Depot } from '@/types';
import MapComponent from '@/components/maps/MapComponent';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

// TÜM UYGULAMADA AYNI libraries KULLAN
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

interface DepotFormProps {
  depot?: Depot;
  onSubmit: (data: Partial<Depot>) => Promise<void>;
  onCancel: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' }
];

const DEFAULT_HOURS = {
  monday: { open: '08:00', close: '18:00' },
  tuesday: { open: '08:00', close: '18:00' },
  wednesday: { open: '08:00', close: '18:00' },
  thursday: { open: '08:00', close: '18:00' },
  friday: { open: '08:00', close: '18:00' },
  saturday: { open: '09:00', close: '14:00' },
  sunday: { open: 'closed', close: 'closed' }
};

const DepotForm: React.FC<DepotFormProps> = ({ depot, onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  // Google Maps API - TÜM UYGULAMADA AYNI ID VE LIBRARIES KULLAN
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    id: 'google-map-script' // MapComponent ile aynı ID
  });

  const [formData, setFormData] = useState<Partial<Depot>>({
    name: depot?.name || '',
    address: depot?.address || '',
    latitude: depot?.latitude || 40.9869,
    longitude: depot?.longitude || 29.0252,
    isDefault: depot?.isDefault || false,
    workingHours: depot?.workingHours || DEFAULT_HOURS
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit modunda başlangıçta haritayı göster
  useEffect(() => {
    if (depot) {
      setShowMap(true);
    }
  }, [depot]);

  // Google Places Autocomplete handlers
  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
    // İstanbul ve Türkiye'ye odakla
    autocompleteInstance.setComponentRestrictions({ country: 'tr' });
    autocompleteInstance.setOptions({
      bounds: new google.maps.LatLngBounds(
        new google.maps.LatLng(40.8, 28.6), // İstanbul güneybatı
        new google.maps.LatLng(41.3, 29.5)  // İstanbul kuzeydoğu
      ),
      strictBounds: false
    });
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        // Depo adını güncelle (eğer boşsa)
        if (!formData.name && place.name) {
          setFormData(prev => ({ ...prev, name: place.name }));
        }

        // Adresi ve koordinatları güncelle
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || '',
          latitude: place.geometry!.location!.lat(),
          longitude: place.geometry!.location!.lng()
        }));

        // Haritayı göster
        setShowMap(true);
      }
    }
  };

  const handleMapClick = (latLng: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      latitude: latLng.lat,
      longitude: latLng.lng
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Depo adı zorunludur';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Adres zorunludur';
    }

    // Çalışma saatleri validasyonu
    if (formData.workingHours) {
      Object.entries(formData.workingHours).forEach(([day, hours]) => {
        if (hours.open !== 'closed' && hours.close !== 'closed') {
          if (hours.open >= hours.close) {
            newErrors[`hours_${day}`] = 'Kapanış saati açılış saatinden sonra olmalıdır';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      navigate('/depots');
    } catch (error) {
      console.error('Depo kaydetme hatası:', error);
      setErrors({ submit: 'Depo kaydedilirken bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours![day],
          [field]: value
        }
      }
    }));
  };

  const toggleDayOff = (day: string) => {
    const current = formData.workingHours![day];
    const isClosed = current.open === 'closed';
    
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: isClosed 
          ? { open: '08:00', close: '18:00' }
          : { open: 'closed', close: 'closed' }
      }
    }));
  };

  const applyToAll = (day: string) => {
    const hours = formData.workingHours![day];
    
    setFormData(prev => ({
      ...prev,
      workingHours: Object.keys(prev.workingHours!).reduce((acc, d) => ({
        ...acc,
        [d]: { ...hours }
      }), {})
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setShowMap(true);
        },
        (error) => {
          console.error('Konum alınamadı:', error);
          alert('Konum alınamadı. Lütfen haritadan manuel olarak seçin.');
        }
      );
    } else {
      alert('Tarayıcınız konum özelliğini desteklemiyor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Temel Bilgiler */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Temel Bilgiler
        </h3>

        {/* Google Search Toggle */}
        {isLoaded && (
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useGoogleSearch}
                onChange={(e) => setUseGoogleSearch(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Google Adres Araması Kullan
              </span>
              <Search className="w-4 h-4 text-gray-400" />
            </label>
            {useGoogleSearch && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Adres yazarak Google'dan otomatik konum bilgisi alabilirsiniz
              </p>
            )}
          </div>
        )}

        {/* Google Places Search Box */}
        {isLoaded && useGoogleSearch && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Adres Ara (Google)
            </label>
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ['establishment'],  
                componentRestrictions: { country: 'tr' }
              }}
            >
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adres veya yer adı yazın (örn: Kadıköy İskelesi, Atatürk Havalimanı)"
              />
            </Autocomplete>
            <p className="text-xs text-blue-600 mt-2">
              💡 Adres seçtiğinizde konum bilgileri otomatik doldurulacak
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depo Adı *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Örn: Ana Depo - Kadıköy"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ana Depo
            </label>
            <div className="flex items-center h-10">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Bu depoyu ana depo olarak ayarla</span>
                {formData.isDefault && (
                  <Star className="w-4 h-4 ml-2 text-yellow-500 fill-yellow-500" />
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adres *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Örn: Kadıköy, Rıhtım Cad. No:1"
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Mevcut konumu kullan"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Koordinatlar
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enlem"
                step="0.000001"
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Boylam"
                step="0.000001"
              />
            </div>
          </div>
        </div>

        {/* Harita Göster/Gizle Butonu ve Harita */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center mb-4"
          >
            <MapPin className="w-4 h-4 mr-1" />
            {showMap ? 'Haritayı Gizle' : 'Haritada Göster'}
          </button>
          
          {showMap && isLoaded && (
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <MapComponent
                center={{ lat: formData.latitude || 40.9869, lng: formData.longitude || 29.0252 }}
                markers={[
                  {
                    position: { 
                      lat: formData.latitude || 40.9869, 
                      lng: formData.longitude || 29.0252 
                    },
                    title: formData.name || 'Depo Konumu'
                  }
                ]}
                onMapClick={handleMapClick}
                height="384px"
                zoom={14}
              />
            </div>
          )}
        </div>
      </div>

      {/* Çalışma Saatleri */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Çalışma Saatleri
        </h3>

        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const hours = formData.workingHours![key];
            const isClosed = hours.open === 'closed';
            
            return (
              <div key={key} className="flex items-center gap-4 pb-3 border-b last:border-0">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  {!isClosed ? (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleWorkingHoursChange(key, 'open', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleWorkingHoursChange(key, 'close', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Kapalı</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDayOff(key)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isClosed 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    {isClosed ? 'Aç' : 'Kapalı'}
                  </button>
                  
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() => applyToAll(key)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Bu saatleri tüm günlere uygula"
                    >
                      Tümüne Uygula
                    </button>
                  )}
                </div>

                {errors[`hours_${key}`] && (
                  <p className="text-sm text-red-600">{errors[`hours_${key}`]}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-1" />
            Çalışma saatleri, rotaların başlangıç ve bitiş zamanlarını belirler.
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <X className="w-4 h-4 mr-2" />
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Kaydediliyor...' : (depot ? 'Güncelle' : 'Kaydet')}
        </button>
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}
    </form>
  );
};

export default DepotForm;