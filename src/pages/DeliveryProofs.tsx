import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Camera,
  Filter,
  Search,
  Grid,
  List,
  Download,
  Eye,
  Calendar,
  User,
  Truck,
  Building,
  X,
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  Clock,
  Package
} from 'lucide-react';
import { Customer } from '@/types';
import { customerService } from '@/services/customer.service';
import { journeyService } from '@/services/journey.service';

interface DeliveryProof {
  id: string;
  type: 'photo' | 'signature';
  url: string;
  date: string;
  driverName: string;
  receiverName: string;
  customerName: string;
  customerId: number;
  journeyId: number;
  journeyName: string;
  notes?: string;
  address?: string;
}

const DeliveryProofs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
  const [filteredProofs, setFilteredProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<DeliveryProof | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    driver: searchParams.get('driver') || '',
    customer: searchParams.get('customer') || '',
    type: searchParams.get('type') || 'all', // all, photo, signature
  });

  // Available filter options
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    loadAllDeliveryProofs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, deliveryProofs]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const loadAllDeliveryProofs = async () => {
    setLoading(true);
    try {
      // Get all customers first
      const customers = await customerService.getAll();
      setAvailableCustomers(customers.map(c => ({id: c.id, name: c.name})));
      
      const allProofs: DeliveryProof[] = [];
      const driversSet = new Set<string>();

      // Get all journeys first
      console.log('Loading all journeys to find customer journeys...');
      const allJourneys = await journeyService.getAll();
      console.log('All journeys loaded:', allJourneys);

      // For each customer, find their journeys and delivery proofs
      for (const customer of customers) {
        try {
          // Bu müşteriyi içeren journey'leri filtrele
          const customerJourneys = allJourneys.filter((journey: any) => {
            return journey.stops && journey.stops.some((stop: any) => {
              // RouteStop içindeki customerId'yi kontrol et
              const stopCustomerId = stop.routeStop?.customerId;
              return stopCustomerId === customer.id;
            });
          });
          
          console.log(`Found ${customerJourneys.length} journeys for customer ${customer.name}:`, customerJourneys);
          
          for (const journey of customerJourneys) {
            try {
              const journeyDetail = await journeyService.getById(journey.id);
              
              // Extract driver name
              let driverName = 'Bilinmeyen';
              if (journeyDetail.driverName) {
                driverName = journeyDetail.driverName;
              } else if (journeyDetail.driver?.fullName) {
                driverName = journeyDetail.driver.fullName;
              } else if (journeyDetail.driver?.name) {
                driverName = journeyDetail.driver.name;
              } else if (journeyDetail.driver?.firstName && journeyDetail.driver?.lastName) {
                driverName = `${journeyDetail.driver.firstName} ${journeyDetail.driver.lastName}`;
              } else if (journeyDetail.driver?.firstName) {
                driverName = journeyDetail.driver.firstName;
              } else if (journey.driverName) {
                driverName = journey.driverName;
              }
              
              if (driverName !== 'Bilinmeyen') {
                driversSet.add(driverName);
              }

              if (!journeyDetail.stops) continue;

              for (const stop of journeyDetail.stops) {
                // Journey statuses'dan kontrol et
                if (journeyDetail.statuses) {
                  const completedStatuses = journeyDetail.statuses.filter((status: any) => 
                    status.stopId === stop.id && status.status === 'Completed'
                  );

                  for (const status of completedStatuses) {
                    // Photo varsa ekle
                    if (status.photoUrl) {
                      const normalizedPhotoUrl = journeyService.normalizeImageUrl(status.photoUrl);
                      allProofs.push({
                        id: `${journey.id}-${stop.id}-photo-${status.id}`,
                        type: 'photo',
                        url: normalizedPhotoUrl,
                        date: status.createdAt || journey.date,
                        driverName: driverName,
                        receiverName: status.receiverName || 'Belirtilmemiş',
                        customerName: customer.name,
                        customerId: customer.id,
                        journeyId: journey.id,
                        journeyName: journey.name || journey.routeName,
                        notes: status.notes,
                        address: stop.address
                      });
                    }

                    // Signature varsa ekle
                    if (status.signatureUrl) {
                      const normalizedSignatureUrl = journeyService.normalizeImageUrl(status.signatureUrl);
                      allProofs.push({
                        id: `${journey.id}-${stop.id}-signature-${status.id}`,
                        type: 'signature',
                        url: normalizedSignatureUrl,
                        date: status.createdAt || journey.date,
                        driverName: driverName,
                        receiverName: status.receiverName || 'Belirtilmemiş',
                        customerName: customer.name,
                        customerId: customer.id,
                        journeyId: journey.id,
                        journeyName: journey.name || journey.routeName,
                        notes: status.notes,
                        address: stop.address
                      });
                    }
                  }
                }

                // Stop details'dan da kontrol et
                try {
                  const stopDetails = await journeyService.getStopDetails(journey.id, stop.id);
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
                        customerName: customer.name,
                        customerId: customer.id,
                        journeyId: journey.id,
                        journeyName: journey.name || journey.routeName,
                        notes: stopDetails.notes,
                        address: stop.address
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
                        customerName: customer.name,
                        customerId: customer.id,
                        journeyId: journey.id,
                        journeyName: journey.name || journey.routeName,
                        notes: stopDetails.notes,
                        address: stop.address
                      });
                    }
                  }
                } catch (stopError) {
                  // Stop details bulunamadı, devam et
                }

                // Stop photos'dan da kontrol et
                try {
                  const stopPhotos = await journeyService.getStopPhotosForStatus(journey.id, stop.id);
                  for (const photo of stopPhotos) {
                    const normalizedPhotoUrl = journeyService.normalizeImageUrl(photo.photoUrl);
                    allProofs.push({
                      id: `${journey.id}-${stop.id}-photo-${photo.id}`,
                      type: 'photo',
                      url: normalizedPhotoUrl,
                      date: photo.createdAt || journey.date,
                      driverName: driverName,
                      receiverName: 'Belirtilmemiş',
                      customerName: customer.name,
                      customerId: customer.id,
                      journeyId: journey.id,
                      journeyName: journey.name || journey.routeName,
                      notes: photo.caption,
                      address: stop.address
                    });
                  }
                } catch (photosError) {
                  // Stop photos bulunamadı, devam et
                }
              }
            } catch (journeyError) {
              console.error('Error loading journey details:', journeyError);
            }
          }
        } catch (customerJourneyError) {
          console.error('Error loading customer journeys:', customerJourneyError);
        }
      }

      // Duplicate'ları temizle
      const uniqueProofs = allProofs.filter((proof, index, self) =>
        index === self.findIndex(p => p.url === proof.url && p.type === proof.type)
      );

      // Tarihe göre sırala (en yeniden eskiye)
      uniqueProofs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setDeliveryProofs(uniqueProofs);
      setAvailableDrivers(Array.from(driversSet).sort());

      console.log(`Loaded ${uniqueProofs.length} delivery proofs from ${customers.length} customers`);
    } catch (error) {
      console.error('Error loading delivery proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = deliveryProofs;

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(proof => 
        proof.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
        proof.driverName.toLowerCase().includes(filters.search.toLowerCase()) ||
        proof.receiverName.toLowerCase().includes(filters.search.toLowerCase()) ||
        proof.journeyName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(proof => 
        new Date(proof.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(proof => 
        new Date(proof.date) <= new Date(filters.dateTo)
      );
    }

    // Driver filter
    if (filters.driver) {
      filtered = filtered.filter(proof => proof.driverName === filters.driver);
    }

    // Customer filter
    if (filters.customer) {
      filtered = filtered.filter(proof => proof.customerId === parseInt(filters.customer));
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(proof => proof.type === filters.type);
    }

    setFilteredProofs(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      dateFrom: '',
      dateTo: '',
      driver: '',
      customer: '',
      type: 'all'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openImageModal = (proof: DeliveryProof) => {
    setSelectedImage(proof);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Teslimat kanıtları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Camera className="w-7 h-7 mr-3 text-blue-600" />
            Teslimat Kanıtları
          </h1>
          <p className="text-gray-600 mt-1">
            Tüm teslimat fotoğrafları ve imzaları ({filteredProofs.length} adet)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtreler
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arama
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Müşteri, şoför, teslim alan..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date From */}
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

            {/* Date To */}
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

            {/* Driver */}
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

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri
              </label>
              <select
                value={filters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Müşteriler</option>
                {availableCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tip
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tümü</option>
                <option value="photo">Fotoğraflar</option>
                <option value="signature">İmzalar</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredProofs.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {deliveryProofs.length === 0 
              ? "Henüz teslimat kanıtı yok" 
              : "Aradığınız kriterlere uygun teslimat kanıtı bulunamadı"
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {deliveryProofs.length === 0
              ? "Henüz hiç teslimat fotoğrafı veya imzası çekilmemiş."
              : "Filtreleri değiştirerek tekrar deneyebilirsiniz."
            }
          </p>
          {deliveryProofs.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProofs.map((proof) => (
                <div key={proof.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Image */}
                  <div 
                    className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                    onClick={() => openImageModal(proof)}
                  >
                    {proof.type === 'photo' ? (
                      <img
                        src={proof.url}
                        alt="Teslimat Fotoğrafı"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <img
                        src={proof.url}
                        alt="Teslimat İmzası"
                        className="w-full h-full object-contain bg-white p-4 transition-transform group-hover:scale-105"
                        onError={(e) => {
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
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        proof.type === 'photo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {proof.type === 'photo' ? 'Fotoğraf' : 'İmza'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <Link
                          to={`/customers/${proof.customerId}`}
                          className="font-medium text-blue-600 hover:text-blue-800 truncate"
                        >
                          {proof.customerName}
                        </Link>
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900 truncate">{proof.driverName}</span>
                      </div>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600 truncate">{proof.receiverName}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{formatDate(proof.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                        <Link
                          to={`/journeys/${proof.journeyId}`}
                          className="text-blue-600 hover:text-blue-800 truncate"
                        >
                          {proof.journeyName || `Sefer #${proof.journeyId}`}
                        </Link>
                      </div>
                      {proof.address && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600 text-xs truncate">{proof.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Görsel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Müşteri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Şoför
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teslim Alan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sefer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProofs.map((proof) => (
                      <tr key={proof.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
                              onClick={() => openImageModal(proof)}
                            >
                              {proof.type === 'photo' ? (
                                <img
                                  src={proof.url}
                                  alt="Teslimat"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <img
                                  src={proof.url}
                                  alt="İmza"
                                  className="w-full h-full object-contain bg-white"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                                  }}
                                />
                              )}
                              <div className="text-center hidden flex-col">
                                <FileText className="w-6 h-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                proof.type === 'photo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {proof.type === 'photo' ? 'Fotoğraf' : 'İmza'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/customers/${proof.customerId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {proof.customerName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {proof.driverName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {proof.receiverName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {formatDate(proof.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/journeys/${proof.journeyId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {proof.journeyName || `Sefer #${proof.journeyId}`}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openImageModal(proof)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedImage.type === 'photo' ? 'Teslimat Fotoğrafı' : 'Teslimat İmzası'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedImage.customerName} - {formatDate(selectedImage.date)}
                </p>
              </div>
              <button
                onClick={closeImageModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="max-w-3xl max-h-96 mx-auto mb-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.type === 'photo' ? 'Teslimat Fotoğrafı' : 'Teslimat İmzası'}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Müşteri:</span>
                  <span className="ml-2 font-medium">{selectedImage.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Şoför:</span>
                  <span className="ml-2 font-medium">{selectedImage.driverName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teslim Alan:</span>
                  <span className="ml-2 font-medium">{selectedImage.receiverName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tarih:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedImage.date)}</span>
                </div>
                {selectedImage.address && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Adres:</span>
                    <span className="ml-2 font-medium">{selectedImage.address}</span>
                  </div>
                )}
                {selectedImage.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notlar:</span>
                    <span className="ml-2 font-medium">{selectedImage.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProofs;