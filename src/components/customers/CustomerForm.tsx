import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Tag,
  AlertCircle,
  Save,
  Loader2,
  User,
  FileText,
  Navigation,
  Timer,
  Search
} from 'lucide-react';
import { Customer } from '@/types';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { settingsService } from '@/services/settings.service';

// TÜM COMPONENT'LERDE AYNI LIBRARIES KULLANILMALI
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Partial<Customer>) => void;
  loading?: boolean;
  isEdit?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  isEdit = false
}) => {
  // Google Maps API - TÜM COMPONENT'LERDE AYNI ID KULLANILMALI
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    id: 'google-map-script' // AYNI ID - script-loader DEĞİL!
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [defaultServiceTime, setDefaultServiceTime] = useState<number>(15);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    latitude: initialData?.latitude || 40.9869,
    longitude: initialData?.longitude || 29.0252,
    priority: initialData?.priority || 'normal',
    estimatedServiceTime: initialData?.estimatedServiceTime || defaultServiceTime,
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    timeWindow: initialData?.timeWindow || undefined
  });

  // Time window state
  const [hasTimeWindow, setHasTimeWindow] = useState(!!initialData?.timeWindow);
  const [timeWindowStart, setTimeWindowStart] = useState(initialData?.timeWindow?.start || '09:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState(initialData?.timeWindow?.end || '17:00');

  // Tags state
  const [tagInput, setTagInput] = useState('');
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Common tags
  const commonTags = ['vip', 'market', 'bakkal', 'şarküteri', 'büfe', 'restoran', 'kafe', 'eczane'];

  // Load default service time from workspace settings
  useEffect(() => {
    if (!isEdit) {
      loadDefaultServiceTime();
    }
  }, [isEdit]);

  const loadDefaultServiceTime = async () => {
    try {
      const deliverySettings = await settingsService.getDeliverySettings();
      if (deliverySettings && deliverySettings.defaultServiceTime) {
        setDefaultServiceTime(deliverySettings.defaultServiceTime);
        // Eğer form data'da service time yoksa veya edit modda değilsek, varsayılanı kullan
        if (!initialData?.estimatedServiceTime) {
          setFormData(prev => ({
            ...prev,
            estimatedServiceTime: deliverySettings.defaultServiceTime
          }));
        }
      }
    } catch (error) {
      console.error('Error loading default service time:', error);
      // Hata durumunda varsayılan 15 dakika kullan
      if (!initialData?.estimatedServiceTime) {
        setFormData(prev => ({
          ...prev,
          estimatedServiceTime: 15
        }));
      }
    }
  };

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
        // Müşteri adını güncelle
        if (!formData.name && place.name) {
          setFormData(prev => ({ ...prev, name: place.name }));
        }

        // Adresi güncelle
        setFormData(prev => ({
          ...prev,
          address: place.formatted_address || '',
          latitude: place.geometry!.location!.lat(),
          longitude: place.geometry!.location!.lng()
        }));

        // Telefon numarasını güncelle (varsa)
        if (place.formatted_phone_number) {
          setFormData(prev => ({ ...prev, phone: place.formatted_phone_number || '' }));
        }

        // Website'den email çıkarmaya çalış (varsa)
        if (place.website && !formData.email) {
          // Website'i not olarak ekle
          setFormData(prev => ({ 
            ...prev, 
            notes: prev.notes ? `${prev.notes}\nWebsite: ${place.website}` : `Website: ${place.website}`
          }));
        }

        // İşletme türüne göre otomatik tag ekle
        if (place.types) {
          const typeMapping: Record<string, string> = {
            'restaurant': 'restoran',
            'cafe': 'kafe',
            'pharmacy': 'eczane',
            'grocery_or_supermarket': 'market',
            'supermarket': 'market',
            'store': 'mağaza',
            'bakery': 'fırın',
            'hospital': 'hastane',
            'school': 'okul'
          };

          const newTags = place.types
            .map(type => typeMapping[type])
            .filter(tag => tag && !formData.tags?.includes(tag));

          if (newTags.length > 0) {
            setFormData(prev => ({
              ...prev,
              tags: [...(prev.tags || []), ...newTags]
            }));
          }
        }
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Müşteri adı zorunludur';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Adres zorunludur';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telefon numarası zorunludur';
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    if (!formData.estimatedServiceTime || formData.estimatedServiceTime < 1) {
      newErrors.serviceTime = 'Servis süresi en az 1 dakika olmalıdır';
    }

    if (hasTimeWindow) {
      if (!timeWindowStart || !timeWindowEnd) {
        newErrors.timeWindow = 'Zaman penceresi başlangıç ve bitiş saatleri zorunludur';
      } else if (timeWindowStart >= timeWindowEnd) {
        newErrors.timeWindow = 'Bitiş saati başlangıç saatinden sonra olmalıdır';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<Customer> = {
      ...formData,
      timeWindow: hasTimeWindow ? { start: timeWindowStart, end: timeWindowEnd } : undefined
    };

    onSubmit(submitData);
  };

  // Add tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags?.includes(trimmedTag)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), trimmedTag]
      });
    }
    setTagInput('');
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    });
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Temel Bilgiler
        </h2>

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
                Google İşletme Araması Kullan
              </span>
              <Search className="w-4 h-4 text-gray-400" />
            </label>
            {useGoogleSearch && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                İşletme adı yazarak Google'dan otomatik bilgi alabilirsiniz
              </p>
            )}
          </div>
        )}

        {/* Google Places Search Box */}
        {isLoaded && useGoogleSearch && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              İşletme Ara (Google)
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
                placeholder="İşletme adı yazın (örn: Migros, Starbucks, vb.)"
              />
            </Autocomplete>
            <p className="text-xs text-blue-600 mt-2">
              💡 İşletme seçtiğinizde adres, telefon ve konum bilgileri otomatik doldurulacak
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Müşteri Kodu
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: MUS001 (Otomatik oluşturulur)"
            />
            {!isEdit && (
              <p className="text-xs text-gray-500 mt-1">Boş bırakırsanız otomatik oluşturulur</p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Müşteri Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Örn: Bakkal Mehmet"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: 0532 111 2233"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Örn: mehmet@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öncelik
            </label>
            <div className="relative">
              <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'high' | 'normal' | 'low' })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Adres Bilgileri
        </h2>
        
        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adres <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={2}
              placeholder="Örn: Kadıköy, Moda Cad. No:45"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.address}
              </p>
            )}
          </div>

          {/* Coordinates Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowCoordinateInput(!showCoordinateInput)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Navigation className="w-4 h-4 mr-1" />
              {showCoordinateInput ? 'Koordinatları Gizle' : 'Koordinatları Düzenle'}
            </button>
          </div>

          {/* Coordinates */}
          {showCoordinateInput && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlem (Latitude)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="40.9869"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boylam (Longitude)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="29.0252"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Window & Service Time */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Zaman Ayarları
        </h2>

        <div className="space-y-4">
          {/* Service Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ortalama Servis Süresi (dakika) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="1"
                max="180"
                value={formData.estimatedServiceTime || defaultServiceTime}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedServiceTime: parseInt(e.target.value) || defaultServiceTime 
                })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.serviceTime ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={defaultServiceTime.toString()}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bu müşteride ortalama ne kadar süre harcanacağını belirtin (yükleme, boşaltma, evrak işlemleri dahil)
              {!isEdit && ` • Varsayılan: ${defaultServiceTime} dakika`}
            </p>
            {errors.serviceTime && (
              <p className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.serviceTime}
              </p>
            )}
          </div>

          {/* Time Window */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={hasTimeWindow}
                onChange={(e) => setHasTimeWindow(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Bu müşteri için zaman penceresi tanımla
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Teslimatın yapılması gereken saat aralığını belirleyin
            </p>
          </div>

          {hasTimeWindow && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç Saati
                </label>
                <input
                  type="time"
                  value={timeWindowStart}
                  onChange={(e) => setTimeWindowStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bitiş Saati
                </label>
                <input
                  type="time"
                  value={timeWindowEnd}
                  onChange={(e) => setTimeWindowEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.timeWindow && (
                <div className="col-span-2">
                  <p className="text-xs text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.timeWindow}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags & Notes - Kısaltılmış, geri kalanı aynı */}
      {/* ... rest of the form ... */}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Güncelle' : 'Kaydet'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;