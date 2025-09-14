import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  Star,
  Tag,
  Calendar,
  Navigation,
  ExternalLink,
  Copy,
  Package,
  TrendingUp,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Plus,
  Camera,
  X
} from 'lucide-react';
import { Customer, CustomerContact } from '@/types';
import { customerService } from '@/services/customer.service';
import { customerContactService } from '@/services/customer-contact.service';
import { journeyService } from '@/services/journey.service';
import { routeService } from '@/services/route.service';
import MapComponent from '@/components/maps/MapComponent';
import CustomerContactsForm from '@/components/customers/CustomerContactsForm';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerJourneys, setCustomerJourneys] = useState<any[]>([]);
  const [customerRoutes, setCustomerRoutes] = useState<any[]>([]);
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [contactsLoading, setContactsLoading] = useState(false);
  const [deliveryProofs, setDeliveryProofs] = useState<any[]>([]);
  const [proofsLoading, setProofsLoading] = useState(false);
  const [filteredProofs, setFilteredProofs] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    driver: '',
    receiver: ''
  });
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (customer && activeTab === 'contacts') {
      loadCustomerContacts();
    }
  }, [customer, activeTab]);

  useEffect(() => {
    if (customer && activeTab === 'proofs') {
      loadDeliveryProofs();
    }
  }, [customer, activeTab]);

  // Contact count'u göstermek için customer yüklendiğinde contact'ları yükle
  useEffect(() => {
    if (customer) {
      loadCustomerContacts();
    }
  }, [customer]);

  const loadCustomer = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const customerId = parseInt(id);
      
      // Customer verilerini yükle
      const customerData = await customerService.getById(customerId);
      
      if (customerData) {
        setCustomer(customerData);
        
        // Journeys ve Routes'u ayrı ayrı yükle
        try {
          // Journeys yükle - getAll kullan çünkü stops bilgisine ihtiyaç var
          console.log('Loading all journeys to find customer journeys...');
          const journeysData = await journeyService.getAll();
          console.log('All journeys data:', journeysData);
          
          // Bu müşteriyi içeren journey'leri filtrele
          const relatedJourneys = journeysData.filter((journey: any) => {
            return journey.stops && journey.stops.some((stop: any) => {
              // RouteStop içindeki customerId'yi kontrol et
              const stopCustomerId = stop.routeStop?.customerId;
              return stopCustomerId === customerId || stopCustomerId === parseInt(id!);
            });
          });
          
          console.log('Related journeys for customer:', relatedJourneys);
          setCustomerJourneys(relatedJourneys);
        } catch (error) {
          console.error('Error loading journeys:', error);
          setCustomerJourneys([]);
        }

        try {
          // Routes yükle
          const routesData = await routeService.getAll();
          // Bu müşteriyi içeren route'ları filtrele
          const relatedRoutes = routesData.filter((route: any) => 
            route.stops && route.stops.some((stop: any) => 
              stop.customerId === customerId || stop.customerId === id
            )
          );
          setCustomerRoutes(relatedRoutes);
        } catch (error) {
          console.error('Error loading routes:', error);
          setCustomerRoutes([]);
        }
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerContacts = async () => {
    if (!customer) return;
    
    setContactsLoading(true);
    try {
      const contacts = await customerContactService.getByCustomerId(customer.id);
      setCustomerContacts(contacts);
    } catch (error) {
      console.error('Error loading customer contacts:', error);
      setCustomerContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadDeliveryProofs = async () => {
    if (!customer) return;
    
    setProofsLoading(true);
    try {
      console.log('Loading delivery proofs for customer:', customer.id);
      console.log('Available journeys:', customerJourneys);
      
      const allProofs: any[] = [];

      // Journey'lerin tam detaylarını yükle ve teslimat kanıtlarını çıkar
      for (const journey of customerJourneys) {
        try {
          // Journey detaylarını yükle (tam detay için getById kullan)
          const journeyDetail = await journeyService.getById(journey.id);
          console.log('Journey detail for proofs:', journey.id, journeyDetail);
          
          if (!journeyDetail.stops) continue;

          // Bu müşteriye ait durakları filtrele
          const customerStops = journeyDetail.stops.filter((stop: any) => {
            const stopCustomerId = stop.routeStop?.customerId;
            return stopCustomerId === customer.id || stopCustomerId === parseInt(id!);
          });

          console.log('Customer stops for journey', journey.id, ':', customerStops);

          for (const stop of customerStops) {
            // Journey statuses'dan bu stop için completed status'u bul
            if (journeyDetail.statuses) {
              const completedStatuses = journeyDetail.statuses.filter((status: any) => 
                status.stopId === stop.id && status.status === 'Completed'
              );

              console.log('Completed statuses for stop', stop.id, ':', completedStatuses);

              for (const status of completedStatuses) {
                // Şoför bilgisini düzelt - journey detayından al
                console.log('🚗 Journey detail driver info for journey', journey.id, ':', {
                  'journeyDetail.driverName': journeyDetail.driverName,
                  'journeyDetail.driver': journeyDetail.driver,
                  'journey.driverName': journey.driverName,
                  'Full journeyDetail keys': Object.keys(journeyDetail)
                });
                
                let driverName = 'Bilinmeyen';
                if (journeyDetail.driverName) {
                  console.log('✅ Using journeyDetail.driverName:', journeyDetail.driverName);
                  driverName = journeyDetail.driverName;
                } else if (journeyDetail.driver?.fullName) {
                  console.log('✅ Using journeyDetail.driver.fullName:', journeyDetail.driver.fullName);
                  driverName = journeyDetail.driver.fullName;
                } else if (journeyDetail.driver?.name) {
                  console.log('✅ Using journeyDetail.driver.name:', journeyDetail.driver.name);
                  driverName = journeyDetail.driver.name;
                } else if (journeyDetail.driver?.firstName && journeyDetail.driver?.lastName) {
                  console.log('✅ Using journeyDetail.driver firstName + lastName:', journeyDetail.driver.firstName, journeyDetail.driver.lastName);
                  driverName = `${journeyDetail.driver.firstName} ${journeyDetail.driver.lastName}`;
                } else if (journeyDetail.driver?.firstName) {
                  console.log('✅ Using journeyDetail.driver.firstName:', journeyDetail.driver.firstName);
                  driverName = journeyDetail.driver.firstName;
                } else if (journey.driverName) {
                  console.log('✅ Using journey.driverName:', journey.driverName);
                  driverName = journey.driverName;
                } else {
                  console.log('❌ No driver name found, using default "Bilinmeyen"');
                }
                
                console.log('🎯 Final driver name:', driverName);

                // Fotoğraf varsa ekle
                if (status.photoUrl) {
                  // URL'i normalize et
                  const normalizedPhotoUrl = journeyService.normalizeImageUrl(status.photoUrl);
                  allProofs.push({
                    id: `${journey.id}-${stop.id}-photo-${status.id}`,
                    type: 'photo',
                    url: normalizedPhotoUrl,
                    date: status.createdAt || journey.date,
                    driverName: driverName,
                    receiverName: status.receiverName || 'Belirtilmemiş',
                    journeyId: journey.id,
                    journeyName: journey.name || journey.routeName,
                    notes: status.notes
                  });
                }

                // İmza varsa ekle
                if (status.signatureUrl) {
                  // URL'i normalize et
                  const normalizedSignatureUrl = journeyService.normalizeImageUrl(status.signatureUrl);
                  allProofs.push({
                    id: `${journey.id}-${stop.id}-signature-${status.id}`,
                    type: 'signature',
                    url: normalizedSignatureUrl,
                    date: status.createdAt || journey.date,
                    driverName: driverName,
                    receiverName: status.receiverName || 'Belirtilmemiş',
                    journeyId: journey.id,
                    journeyName: journey.name || journey.routeName,
                    notes: status.notes
                  });
                }
              }
            }

            // Şoför bilgisini journey detayından al (Stop Details için)
            console.log('🚛 Driver info for stop details journey', journey.id, ':', {
              'journeyDetail.driverName': journeyDetail.driverName,
              'journeyDetail.driver': journeyDetail.driver,
              'journey.driverName': journey.driverName
            });
            
            let driverName = 'Bilinmeyen';
            if (journeyDetail.driverName) {
              console.log('✅ Stop details using journeyDetail.driverName:', journeyDetail.driverName);
              driverName = journeyDetail.driverName;
            } else if (journeyDetail.driver?.fullName) {
              console.log('✅ Stop details using journeyDetail.driver.fullName:', journeyDetail.driver.fullName);
              driverName = journeyDetail.driver.fullName;
            } else if (journeyDetail.driver?.name) {
              console.log('✅ Stop details using journeyDetail.driver.name:', journeyDetail.driver.name);
              driverName = journeyDetail.driver.name;
            } else if (journeyDetail.driver?.firstName && journeyDetail.driver?.lastName) {
              console.log('✅ Stop details using firstName + lastName:', journeyDetail.driver.firstName, journeyDetail.driver.lastName);
              driverName = `${journeyDetail.driver.firstName} ${journeyDetail.driver.lastName}`;
            } else if (journeyDetail.driver?.firstName) {
              console.log('✅ Stop details using firstName:', journeyDetail.driver.firstName);
              driverName = journeyDetail.driver.firstName;
            } else if (journey.driverName) {
              console.log('✅ Stop details using journey.driverName:', journey.driverName);
              driverName = journey.driverName;
            } else {
              console.log('❌ Stop details no driver name found, using "Bilinmeyen"');
            }
            
            console.log('🎯 Stop details final driver name:', driverName);

            // Stop details'dan da kontrol et
            try {
              const stopDetails = await journeyService.getStopDetails(journey.id, stop.id);
              console.log('Stop details for', stop.id, ':', stopDetails);
              
              if (stopDetails) {
                if (stopDetails.photoUrl) {
                  const normalizedPhotoUrl = journeyService.normalizeImageUrl(stopDetails.photoUrl);
                  allProofs.push({
                    id: `${journey.id}-${stop.id}-photo-details`,
                    type: 'photo',
                    url: normalizedPhotoUrl,
                    date: stopDetails.createdAt || journey.date,
                    driverName: driverName,
                    receiverName: stopDetails.receiverName || 'Belirtilmemiş',
                    journeyId: journey.id,
                    journeyName: journey.name || journey.routeName,
                    notes: stopDetails.notes
                  });
                }

                if (stopDetails.signatureUrl) {
                  const normalizedSignatureUrl = journeyService.normalizeImageUrl(stopDetails.signatureUrl);
                  allProofs.push({
                    id: `${journey.id}-${stop.id}-signature-details`,
                    type: 'signature',
                    url: normalizedSignatureUrl,
                    date: stopDetails.createdAt || journey.date,
                    driverName: driverName,
                    receiverName: stopDetails.receiverName || 'Belirtilmemiş',
                    journeyId: journey.id,
                    journeyName: journey.name || journey.routeName,
                    notes: stopDetails.notes
                  });
                }
              }
            } catch (stopError) {
              console.log('Stop details not found for stop', stop.id, ':', stopError);
            }

            // Stop photos da kontrol et
            try {
              const stopPhotos = await journeyService.getStopPhotosForStatus(journey.id, stop.id);
              console.log('Stop photos for', stop.id, ':', stopPhotos);
              
              for (const photo of stopPhotos) {
                const normalizedPhotoUrl = journeyService.normalizeImageUrl(photo.photoUrl);
                allProofs.push({
                  id: `${journey.id}-${stop.id}-photo-${photo.id}`,
                  type: 'photo',
                  url: normalizedPhotoUrl,
                  date: photo.createdAt || journey.date,
                  driverName: driverName,
                  receiverName: 'Belirtilmemiş',
                  journeyId: journey.id,
                  journeyName: journey.name || journey.routeName,
                  notes: photo.caption
                });
              }
            } catch (photosError) {
              console.log('Stop photos not found for stop', stop.id, ':', photosError);
            }
          }
        } catch (journeyError) {
          console.error('Error loading journey details for', journey.id, ':', journeyError);
        }
      }

      console.log('All delivery proofs found:', allProofs);

      // Duplicate'ları temizle (aynı URL'ye sahip olanları)
      const uniqueProofs = allProofs.filter((proof, index, self) =>
        index === self.findIndex(p => p.url === proof.url && p.type === proof.type)
      );

      // Tarihe göre sırala (en yeniden eskiye)
      uniqueProofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Final unique proofs:', uniqueProofs);
      setDeliveryProofs(uniqueProofs);
      setFilteredProofs(uniqueProofs);
      
      // Available drivers listesini oluştur
      const drivers = [...new Set(uniqueProofs.map(proof => proof.driverName))].filter(name => name !== 'Bilinmeyen');
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error loading delivery proofs:', error);
      setDeliveryProofs([]);
      setFilteredProofs([]);
    } finally {
      setProofsLoading(false);
    }
  };

  const handleContactsChange = (newContacts: CustomerContact[]) => {
    setCustomerContacts(newContacts);
  };

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filtered = deliveryProofs;

    // Tarih aralığı filtresi
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(proof => new Date(proof.date) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Günün sonuna kadar
      filtered = filtered.filter(proof => new Date(proof.date) <= toDate);
    }

    // Şoför filtresi
    if (filters.driver) {
      filtered = filtered.filter(proof => 
        proof.driverName.toLowerCase().includes(filters.driver.toLowerCase())
      );
    }

    // Teslim alan kişi filtresi
    if (filters.receiver) {
      filtered = filtered.filter(proof => 
        proof.receiverName.toLowerCase().includes(filters.receiver.toLowerCase())
      );
    }

    setFilteredProofs(filtered);
  };

  // Filtreleri uygula
  useEffect(() => {
    applyFilters();
  }, [filters, deliveryProofs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDelete = async () => {
    if (!id || !customer) return;
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    setDeleting(true);
    try {
      await customerService.delete(customer.id);
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      setDeleting(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleOpenInMaps = () => {
    if (customer) {
      const url = `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`;
      window.open(url, '_blank');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Bulunamadı</h2>
        <p className="text-gray-600 mb-4">İstediğiniz müşteri bulunamadı veya silinmiş olabilir.</p>
        <Link
          to="/customers"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Müşterilere Dön
        </Link>
      </div>
    );
  }

  // Tüm route ve journey'leri birleştir
  const allRouteData = [...customerJourneys, ...customerRoutes];
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/customers"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(customer.priority)}`}>
                  {customer.priority === 'high' && <Star className="w-4 h-4 mr-1" />}
                  {getPriorityLabel(customer.priority)} Öncelik
                </span>
                {customer.tags?.includes('vip') && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                    <Star className="w-4 h-4 mr-1" />
                    VIP
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">Müşteri Kodu: {customer.code}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to={`/customers/${customer.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Sil
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Genel Bakış
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              İletişim Kişileri ({customerContacts.length})
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'routes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Navigation className="w-4 h-4 inline mr-2" />
              Seferler
            </button>
            <button
              onClick={() => setActiveTab('proofs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'proofs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Teslimat Kanıtları
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Teslimat</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allRouteData.reduce((sum, route) => 
                      sum + (route.stops?.filter((s: any) => 
                        (s.customerId === customer.id || s.customerId === id) && s.status === 'completed'
                      ).length || 0), 0
                    )}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktif Rota</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerJourneys.filter(j => j.status === 'in_progress').length}
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planlı Rota</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customerRoutes.filter(r => r.status === 'planned' || !r.status).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Başarı Oranı</p>
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>

          {/* Contact & Address Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                İletişim ve Adres Bilgileri
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Phone */}
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Telefon</p>
                  <p className="font-medium text-gray-900">{customer.phone}</p>
                </div>
                <button
                  onClick={() => handleCopyToClipboard(customer.phone)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Kopyala"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Email */}
              {customer.email && (
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{customer.email}</p>
                  </div>
                  <button
                    onClick={() => handleCopyToClipboard(customer.email!)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Kopyala"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Adres</p>
                  <p className="font-medium text-gray-900">{customer.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Koordinatlar: {customer.latitude}, {customer.longitude}
                  </p>
                </div>
                <button
                  onClick={handleOpenInMaps}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Haritada Göster"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Time Window */}
              {customer.timeWindow && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Zaman Penceresi</p>
                    <p className="font-medium text-gray-900">
                      {customer.timeWindow.start} - {customer.timeWindow.end}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Map */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Konum Haritası
                </h2>
                <button
                  onClick={handleOpenInMaps}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Google Maps'te Aç
                </button>
              </div>
            </div>
            <div className="p-4">
              <MapComponent
                center={{ lat: customer.latitude, lng: customer.longitude }}
                zoom={16}
                height="300px"
                markers={[{
                  position: { lat: customer.latitude, lng: customer.longitude },
                  title: customer.name,
                  customerId: customer.id.toString(),
                  label: "1"
                }]}
                customers={[customer]}
              />
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Enlem:</span>
                    <span className="ml-2 font-mono text-gray-900">{customer.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Boylam:</span>
                    <span className="ml-2 font-mono text-gray-900">{customer.longitude.toFixed(6)}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-600">Tam Adres:</span>
                  <span className="ml-2 text-gray-900">{customer.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Routes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Son Rotalar ve Seferler
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allRouteData.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Henüz rota veya sefer bulunmuyor</p>
                </div>
              ) : (
                allRouteData.slice(0, 5).map((route, index) => (
                  <Link
                    key={`route-${route.id}-${index}`}
                    to={customerJourneys.includes(route) ? `/journeys/${route.id}` : `/routes/${route.id}`}
                    state={{ from: `/customers/${id}?tab=overview` }}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {route.name || route.routeName || `Rota #${route.id}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {route.date ? formatDate(route.date) : 'Tarih belirtilmemiş'} • {route.stops?.length || 0} durak
                        </p>
                        <span className="text-xs text-purple-600 mt-1">Sefer</span>
                      </div>
                      <div className="flex items-center">
                        {route.status === 'completed' && (
                          <span className="text-green-600 text-sm">Tamamlandı</span>
                        )}
                        {route.status === 'in_progress' && (
                          <span className="text-blue-600 text-sm">Devam Ediyor</span>
                        )}
                        {(route.status === 'planned' || !route.status) && (
                          <span className="text-gray-600 text-sm">Planlandı</span>
                        )}
                        <ArrowLeft className="w-4 h-4 ml-2 text-gray-400 rotate-180" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="space-y-6">
          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Etiketler
              </h3>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag, tagIndex) => (
                  <span
                    key={`tag-${tag}-${tagIndex}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notlar
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap break-words">{customer.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sistem Bilgileri</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Oluşturulma Tarihi</p>
                <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Son Güncelleme</p>
                <p className="font-medium text-gray-900">{formatDate(customer.updatedAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Müşteri ID</p>
                <p className="font-mono text-xs text-gray-500">{customer.id}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <Link
                to="/routes/new"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bu Müşteriyi Rotaya Ekle
              </Link>
              <button
                onClick={() => {
                  handleCopyToClipboard(`${customer.name}\n${customer.address}\n${customer.phone}`);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Bilgileri Kopyala
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-2">
              <Link
                to="/routes/new"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bu Müşteriyi Rotaya Ekle
              </Link>
              <button
                onClick={() => {
                  handleCopyToClipboard(`${customer.name}\n${customer.address}\n${customer.phone}`);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Bilgileri Kopyala
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  İletişim Kişileri
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Bu müşteri için kayıtlı iletişim kişilerini yönetin. Her kişi için rol bazlı bildirim ayarları yapabilirsiniz.
                </p>
              </div>
            </div>

            {contactsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">İletişim kişileri yükleniyor...</span>
              </div>
            ) : (
              <CustomerContactsForm
                contacts={customerContacts}
                onChange={handleContactsChange}
                customerId={customer?.id}
                viewMode={true}
                onContactSaved={loadCustomerContacts}
              />
            )}
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Geçmiş Seferler
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {customerJourneys.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Henüz sefer bulunmuyor</p>
                </div>
              ) : (
                customerJourneys.map((route, index) => (
                  <Link
                    key={`journey-${route.id}-${index}`}
                    to={`/journeys/${route.id}`}
                    state={{ from: `/customers/${id}?tab=routes` }}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {route.name || route.routeName || `Rota #${route.id}`}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {route.date ? formatDate(route.date) : 'Tarih belirtilmemiş'} • {route.stops?.length || 0} durak
                        </p>
                        <span className="text-xs text-purple-600 mt-1">Sefer</span>
                      </div>
                      <div className="flex items-center">
                        {route.status === 'completed' && (
                          <span className="text-green-600 text-sm">Tamamlandı</span>
                        )}
                        {route.status === 'in_progress' && (
                          <span className="text-blue-600 text-sm">Devam Ediyor</span>
                        )}
                        {(route.status === 'planned' || !route.status) && (
                          <span className="text-gray-600 text-sm">Planlandı</span>
                        )}
                        <ArrowLeft className="w-4 h-4 ml-2 text-gray-400 rotate-180" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Proofs Tab */}
      {activeTab === 'proofs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Teslimat Kanıtları
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Bu müşterinin geçmiş seferlerinden çekilen fotoğraflar ve imzalar
              </p>
            </div>

            {proofsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Teslimat kanıtları yükleniyor...</span>
              </div>
            ) : (
              <div className="p-6">
                {/* Filters - Always show */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Başlangıç Tarihi
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şoför
                    </label>
                    <select 
                      value={filters.driver}
                      onChange={(e) => handleFilterChange('driver', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Tüm Şoförler</option>
                      {availableDrivers.map(driver => (
                        <option key={driver} value={driver}>{driver}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teslim Alan
                    </label>
                    <input
                      type="text"
                      placeholder="Teslim alan kişi adı"
                      value={filters.receiver}
                      onChange={(e) => handleFilterChange('receiver', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Results Counter */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {filteredProofs.length} teslimat kanıtı bulundu
                    {deliveryProofs.length !== filteredProofs.length && ` (${deliveryProofs.length} toplam)`}
                  </p>
                </div>

                {/* Delivery Proofs Grid or Empty State */}
                {filteredProofs.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {deliveryProofs.length === 0 
                        ? "Henüz teslimat kanıtı yok" 
                        : "Aradığınız kriterlere uygun teslimat kanıtı bulunamadı"
                      }
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {deliveryProofs.length === 0
                        ? "Bu müşteri için henüz hiç teslimat fotoğrafı veya imzası çekilmemiş."
                        : "Filtreleri değiştirerek tekrar deneyebilirsiniz."
                      }
                    </p>
                    {deliveryProofs.length > 0 && (
                      <button
                        onClick={() => {
                          setFilters({
                            dateFrom: '',
                            dateTo: '',
                            driver: '',
                            receiver: ''
                          });
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProofs.map((proof, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {/* Photo/Signature Display */}
                        <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {proof.type === 'photo' ? (
                            <img
                              src={proof.url}
                              alt="Teslimat Fotoğrafı"
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                console.error('Photo failed to load:', proof.url);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <img
                              src={proof.url}
                              alt="Teslimat İmzası"
                              className="w-full h-full object-contain rounded-lg bg-white p-2"
                              onError={(e) => {
                                console.error('Signature failed to load:', proof.url);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling!.style.display = 'flex';
                              }}
                            />
                          )}
                          <div className="text-center hidden flex-col">
                            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              {proof.type === 'photo' ? 'Fotoğraf Yüklenemedi' : 'İmza Yüklenemedi'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">Tarih:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {formatDate(proof.date)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Şoför:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {proof.driverName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Teslim Alan:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {proof.receiverName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Sefer:</span>
                            <Link
                              to={`/journeys/${proof.journeyId}`}
                              className="ml-2 text-blue-600 hover:text-blue-800 underline"
                            >
                              {proof.journeyName || `Sefer #${proof.journeyId}`}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          Kopyalandı!
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;