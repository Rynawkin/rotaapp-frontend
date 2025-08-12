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
  Plus  // ← BU SATIR EKLENDİ
} from 'lucide-react';
import { Customer } from '@/types';
import { customerService, routeService } from '@/services/mockData';

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerRoutes, setCustomerRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [customerData, routesData] = await Promise.all([
        customerService.getById(id),
        routeService.getAll()
      ]);
      
      if (customerData) {
        setCustomer(customerData);
        // Find routes that include this customer
        const relatedRoutes = routesData.filter(route => 
          route.stops.some(stop => stop.customerId === id)
        );
        setCustomerRoutes(relatedRoutes);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;

    setDeleting(true);
    try {
      await customerService.delete(id);
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

  const formatDate = (date: Date) => {
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
                    {customerRoutes.reduce((sum, route) => 
                      sum + route.stops.filter((s: any) => s.customerId === id && s.status === 'completed').length, 0
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
                    {customerRoutes.filter(r => r.status === 'in_progress').length}
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
                    {customerRoutes.filter(r => r.status === 'planned').length}
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

          {/* Recent Routes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Navigation className="w-5 h-5 mr-2" />
                Son Rotalar
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {customerRoutes.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Henüz rota bulunmuyor</p>
                </div>
              ) : (
                customerRoutes.slice(0, 5).map(route => (
                  <Link
                    key={route.id}
                    to={`/routes/${route.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{route.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(route.date)} • {route.totalDeliveries} durak
                        </p>
                      </div>
                      <div className="flex items-center">
                        {route.status === 'completed' && (
                          <span className="text-green-600 text-sm">Tamamlandı</span>
                        )}
                        {route.status === 'in_progress' && (
                          <span className="text-blue-600 text-sm">Devam Ediyor</span>
                        )}
                        {route.status === 'planned' && (
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
                {customer.tags.map(tag => (
                  <span
                    key={tag}
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
              <p className="text-gray-600">{customer.notes}</p>
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

          {/* Copy Success Toast */}
          {copySuccess && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
              Kopyalandı!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;