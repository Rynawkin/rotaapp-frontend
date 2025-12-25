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
  Search,
  Map,
  X
} from 'lucide-react';
import { Customer, CustomerContact } from '@/types';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { settingsService } from '@/services/settings.service';
import MapPicker from '@/components/maps/MapPicker';
import CustomerContactsForm from './CustomerContactsForm';
import { customerContactService } from '@/services/customer-contact.service';

// TÜM COMPONENT'LERDE AYNI LIBRARIES KULLANILMALI
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

// Telefon numarasını WhatsApp formatına çevir
const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';

  // Tüm boşluk, parantez, tire gibi karakterleri temizle
  let cleaned = phone.replace(/[\s\(\)\-\+]/g, '');

  // Başındaki sıfırı kaldır
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // +90 ile başlıyorsa kaldır
  if (cleaned.startsWith('90') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }

  return cleaned;
};

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Partial<Customer>, contacts?: CustomerContact[]) => void;
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
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form State - WhatsApp alanları eklendi
  const [formData, setFormData] = useState<Partial<Customer>>({
    code: initialData?.code || '',
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',

    // WhatsApp Alanları - Format düzeltmesi
    whatsApp: initialData?.whatsApp || formatPhoneForWhatsApp(initialData?.phone || ''),
    whatsAppOptIn: initialData?.whatsAppOptIn || false,
    whatsAppVerified: initialData?.whatsAppVerified || false,
    whatsAppOptInDate: initialData?.whatsAppOptInDate,

    latitude: initialData?.latitude || undefined,
    longitude: initialData?.longitude || undefined,
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
  const [searchQuery, setSearchQuery] = useState('');

  // Contacts state
  const [contacts, setContacts] = useState<CustomerContact[]>([]);

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

  // Load contacts when editing customer
  useEffect(() => {
    if (isEdit && initialData?.id) {
      loadCustomerContacts();
    }
  }, [isEdit, initialData?.id]);

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
    } catch (error: any) {
      console.error('Error loading default service time:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Varsayılan servis süresi yüklenirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
      // Hata durumunda varsayılan 15 dakika kullan
      if (!initialData?.estimatedServiceTime) {
        setFormData(prev => ({
          ...prev,
          estimatedServiceTime: 15
        }));
      }
    }
  };

  const loadCustomerContacts = async () => {
    if (!initialData?.id) return;
    
    try {
      const contacts = await customerContactService.getByCustomerId(initialData.id.toString());
      setContacts(contacts || []);
    } catch (error: any) {
      console.error('Error loading customer contacts:', error);
      setContacts([]);
    }
  };

  // Map Picker'dan konum seçildiğinde
  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      address: location.address,
      latitude: location.lat,
      longitude: location.lng
    }));
    setShowMapPicker(false);
    setShowCoordinateInput(true); // Koordinatları göster
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
        // Müşteri adını her zaman güncelle
        if (place.name) {
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
          setFormData(prev => ({
            ...prev,
            phone: place.formatted_phone_number || '',
            whatsApp: formatPhoneForWhatsApp(place.formatted_phone_number || '')
          }));
        }

        // Website'den email çıkarmaya çalış (varsa)
        if (place.website) {
          // Eğer email boşsa veya website değişmişse notu güncelle
          const websiteNote = `Website: ${place.website}`;
          setFormData(prev => {
            // Eski website notunu temizle
            let newNotes = prev.notes || '';
            newNotes = newNotes.replace(/Website: .+(\n|$)/g, '');

            // Yeni website notunu ekle
            if (newNotes.trim()) {
              newNotes = `${newNotes.trim()}\n${websiteNote}`;
            } else {
              newNotes = websiteNote;
            }

            return { ...prev, notes: newNotes };
          });
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

        // Search input'u temizle
        setSearchQuery('');
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

    // Email validation - zorunlu değil ama format kontrolü yap
    const emailValue = formData.email?.trim();
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    const latitudeValue = formData.latitude;
    const longitudeValue = formData.longitude;
    const hasLatitude = typeof latitudeValue === 'number' && Number.isFinite(latitudeValue) && latitudeValue !== 0;
    const hasLongitude = typeof longitudeValue === 'number' && Number.isFinite(longitudeValue) && longitudeValue !== 0;

    if (!hasLatitude) {
      newErrors.latitude = 'Enlem zorunludur';
    }

    if (!hasLongitude) {
      newErrors.longitude = 'Boylam zorunludur';
    }

    if (!hasLatitude || !hasLongitude) {
      setShowCoordinateInput(true);
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
    
    // İlk hataya scroll yap
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Reset form (modal için)
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      whatsApp: '', // Boş bırak, otomatik doldurma
      whatsAppOptIn: false,
      whatsAppVerified: false,
      latitude: undefined,
      longitude: undefined,
      estimatedServiceTime: defaultServiceTime,
      notes: '',
      tags: []
    });
    setHasTimeWindow(false);
    setTimeWindowStart('09:00');
    setTimeWindowEnd('17:00');
    setTagInput('');
    setSearchQuery('');
    setErrors({});
    setShowCoordinateInput(false);
    setContacts([]);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // WhatsApp numarasını temizle ve formatla
    let whatsAppNumber = formData.whatsApp;
    if (!whatsAppNumber && formData.phone) {
      whatsAppNumber = formatPhoneForWhatsApp(formData.phone);
    }

    const submitData: Partial<Customer> = {
      ...formData,
      whatsApp: whatsAppNumber,
      timeWindow: hasTimeWindow ? { start: timeWindowStart, end: timeWindowEnd } : undefined
    };

    onSubmit(submitData, contacts);

    // Modal'da kullanıldığında form'u resetle
    if (!isEdit) {
      resetForm();
    }
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
    <>
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="İşletme adı yazın (örn: Migros, Starbucks, vb.)"
                />
              </Autocomplete>
              <p className="text-xs text-blue-600 mt-2">
                İşletme seçtiğinizde adres, telefon ve konum bilgileri otomatik doldurulacak
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
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                  }`}
                placeholder="Örn: Bakkal Mehmet"
              />
              {errors.name && (
                <div className="flex items-center mt-2 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">{errors.name}</span>
                </div>
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
                  onChange={(e) => {
                    const phone = e.target.value;
                    setFormData({
                      ...formData,
                      phone: phone,
                      // ✅ Telefon her değiştiğinde WhatsApp'ı da otomatik güncelle
                      whatsApp: formatPhoneForWhatsApp(phone)
                    });
                  }}
                  name="phone"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0532 111 2233"
                />
              </div>
              {errors.phone && (
                <div className="flex items-center mt-2 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">{errors.phone}</span>
                </div>
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
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Örn: mehmet@example.com (opsiyonel)"
                />
              </div>
              {errors.email && (
                <div className="flex items-center mt-2 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">{errors.email}</span>
                </div>
              )}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-300' : 'border-gray-300'
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

            {/* Haritadan Seç ve Koordinatları Düzenle Butonları */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Map className="w-4 h-4 mr-1" />
                Haritadan Konum Seç
              </button>

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
                    name="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.latitude ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="40.9869"
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.latitude}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Boylam (Longitude)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    name="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.longitude ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="29.0252"
                  />
                  {errors.longitude && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.longitude}
                    </p>
                  )}
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
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.serviceTime ? 'border-red-300' : 'border-gray-300'
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

        {/* Customer Contacts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            İletişim Kişileri
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Bu müşteri için birden fazla kişi ekleyebilir ve rollerine göre hangi bildirimleri alacaklarını belirleyebilirsiniz.
          </p>

          <CustomerContactsForm
            contacts={contacts}
            onChange={setContacts}
            customerId={isEdit ? initialData?.id : undefined}
            viewMode={isEdit}
            onContactSaved={loadCustomerContacts}
          />
        </div>

        {/* WhatsApp Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-green-600" />
            WhatsApp Bildirimleri
          </h2>

          <div className="space-y-4">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
                <input
                  type="tel"
                  value={formData.whatsApp || ''}
                  onChange={(e) => {
                    // Sadece rakam girişine izin ver
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setFormData({ ...formData, whatsApp: value });
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5321112233"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Başında 0 olmadan, sadece rakamlardan oluşan 10 haneli numara girin
              </p>
            </div>

            {/* WhatsApp Opt-in */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <input
                  type="checkbox"
                  checked={formData.whatsAppOptIn || false}
                  onChange={(e) => {
                    const optIn = e.target.checked;
                    setFormData({
                      ...formData,
                      whatsAppOptIn: optIn,
                      whatsAppOptInDate: optIn ? new Date() : undefined
                    });
                  }}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    WhatsApp bildirimleri gönder
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    Müşteri teslimat bildirimleri için WhatsApp mesajı almayı kabul ediyor
                  </p>
                </div>
              </label>

              {formData.whatsAppOptIn && (
                <>
                  {/* WhatsApp Verification Status */}
                  <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      checked={formData.whatsAppVerified || false}
                      onChange={(e) => setFormData({ ...formData, whatsAppVerified: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        Numara doğrulandı
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        WhatsApp numarası müşteri tarafından doğrulandı
                      </p>
                    </div>
                  </label>

                  {/* Opt-in Date Display */}
                  {formData.whatsAppOptInDate && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Onay tarihi:</span>{' '}
                        {new Date(formData.whatsAppOptInDate).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* WhatsApp Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">WhatsApp bildirimleri hakkında</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Müşteriye sefer başladığında bildirim gönderilir</li>
                  <li>Teslimat yaklaştığında (30 dk önce) bildirim gönderilir</li>
                  <li>Teslimat tamamlandığında veya başarısız olduğunda bildirim gönderilir</li>
                  <li>Tüm bildirimler email'e ek olarak gönderilir</li>
                  <li>Plan limitinize göre ücretlendirilir</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tags & Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Ek Bilgiler
          </h2>

          <div className="space-y-4">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Etiketler
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Etiket ekle..."
                />
                <button
                  type="button"
                  onClick={() => tagInput.trim() && addTag(tagInput)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonTags.filter(tag => !formData.tags?.includes(tag)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Müşteri hakkında önemli notlar..."
              />
            </div>
          </div>
        </div>

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

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Haritadan Konum Seçin
                </h2>
                <button
                  onClick={() => setShowMapPicker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <MapPicker
                initialLat={formData.latitude || 40.9869}
                initialLng={formData.longitude || 29.0252}
                onLocationSelect={handleMapLocationSelect}
                onCancel={() => setShowMapPicker(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerForm;
