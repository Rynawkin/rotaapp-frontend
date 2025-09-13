import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Plus
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
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerJourneys, setCustomerJourneys] = useState<any[]>([]);
  const [customerRoutes, setCustomerRoutes] = useState<any[]>([]);
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [contactsLoading, setContactsLoading] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  useEffect(() => {
    if (customer && activeTab === 'contacts') {
      loadCustomerContacts();
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
            console.log(`Journey ${journey.id}:`, { 
              stops: journey.stops, 
              customerId, 
              hasStops: journey.stops?.length > 0 
            });
            return journey.stops && journey.stops.some((stop: any) => {
              const matches = stop.customerId === customerId || stop.customerId === parseInt(id!);
              if (matches) {
                console.log(`Found match in journey ${journey.id}:`, stop);
              }
              return matches;
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

  const handleContactsChange = (newContacts: CustomerContact[]) => {
    setCustomerContacts(newContacts);
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