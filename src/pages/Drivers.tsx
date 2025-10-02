import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  User,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Car,
  Grid,
  List,
  UserCheck,
  UserX,
  Loader2,
  Award,
  Package,
  CreditCard,
  ChevronUp,
  ChevronDown,
  X,
  FileDown,
  FileUp,
  HelpCircle
} from 'lucide-react';
import { Driver } from '@/types';
import { driverService } from '@/services/driver.service';

type SortField = 'name' | 'rating' | 'totalDeliveries' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load drivers
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await driverService.getAll();
      setDrivers(data);
    } catch (error: any) {
      console.error('Error loading drivers:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Sürücüler yüklenirken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Quick filters
  const applyQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    setSearchQuery('');
    setSelectedStatus('all');

    switch(filter) {
      case 'available':
        setSelectedStatus('available');
        break;
      case 'busy':
        setSelectedStatus('busy');
        break;
      case 'offline':
        setSelectedStatus('offline');
        break;
      case 'high_rated':
        // Filtre fonksiyonunda kontrol edilecek
        break;
      case 'all':
      default:
        break;
    }
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (driver.email && driver.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || driver.status === selectedStatus;

    // Quick filter: high rated (4.0+)
    const matchesHighRated = quickFilter !== 'high_rated' || (driver.rating && driver.rating >= 4.0);

    return matchesSearch && matchesStatus && matchesHighRated;
  });

  // Sorting
  const sortedDrivers = [...filteredDrivers].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'tr');
        break;
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'totalDeliveries':
        comparison = (a.totalDeliveries || 0) - (b.totalDeliveries || 0);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Bulk selection
  const toggleDriverSelection = (driverId: string) => {
    const newSelected = new Set(selectedDrivers);
    if (newSelected.has(driverId)) {
      newSelected.delete(driverId);
    } else {
      newSelected.add(driverId);
    }
    setSelectedDrivers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedDrivers.size === sortedDrivers.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(sortedDrivers.map(d => d.id)));
    }
  };

  // Delete driver
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu sürücüyü silmek istediğinizden emin misiniz?')) {
      setIsDeleting(id);
      try {
        await driverService.delete(id);
        loadDrivers();
        alert('Sürücü başarıyla silindi');
      } catch (error: any) {
        console.error('Delete failed:', error);
        const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Sürücü silinirken bir hata oluştu!';
        alert(errorMessage);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedDrivers.size === 0) return;

    if (window.confirm(`${selectedDrivers.size} sürücüyü silmek istediğinizden emin misiniz?`)) {
      try {
        await Promise.all(
          Array.from(selectedDrivers).map(id => driverService.delete(id))
        );
        setSelectedDrivers(new Set());
        loadDrivers();
        alert('Seçili sürücüler başarıyla silindi');
      } catch (error) {
        console.error('Toplu silme hatası:', error);
        alert('Bazı sürücüler silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // Update driver status
  const handleStatusChange = async (id: string, status: 'available' | 'busy' | 'offline') => {
    setIsStatusChanging(id);
    try {
      await driverService.updateStatus(id, status);
      loadDrivers();
      alert('Sürücü durumu başarıyla güncellendi');
    } catch (error: any) {
      console.error('Status update failed:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Durum güncellenirken bir hata oluştu!';
      alert(errorMessage);
    } finally {
      setIsStatusChanging(null);
    }
  };

  // Export drivers to CSV
  const handleExport = () => {
    const dataToExport = selectedDrivers.size > 0
      ? sortedDrivers.filter(d => selectedDrivers.has(d.id))
      : sortedDrivers;

    const csvContent = driverService.exportToCsv(dataToExport);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = selectedDrivers.size > 0
      ? `secili_suruculer_${new Date().toISOString().split('T')[0]}.csv`
      : `tum_suruculer_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = [
      'İsim,Telefon,Email,Ehliyet No,Durum,Puan,Teslimat Sayısı',
      'Ahmet Yılmaz,0532 111 2233,ahmet@example.com,ABC123456,available,4.5,120',
      'Mehmet Demir,0533 222 3344,mehmet@example.com,DEF789012,busy,4.8,200',
      'Ali Kaya,0534 333 4455,,GHI345678,offline,4.2,85'
    ].join('\n');

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'surucu_sablonu.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Import drivers from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target?.result as string;
      const driversToImport = driverService.parseCsvForImport(csv);

      if (driversToImport.length > 0) {
        setIsImporting(true);
        try {
          const result = await driverService.bulkImport(driversToImport);

          if (result.successCount > 0) {
            loadDrivers();
            alert(`${result.successCount} sürücü başarıyla eklendi.${result.failureCount > 0 ? ` ${result.failureCount} başarısız.` : ''}`);
          }

          if (result.errors.length > 0) {
            console.error('Import errors:', result.errors);
            if (result.failureCount > 0) {
              const errorMessage = result.errors.slice(0, 5).join('\n');
              alert(`Bazı kayıtlar eklenemedi:\n${errorMessage}`);
            }
          }
        } catch (error: any) {
          console.error('Import failed:', error);
          const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'İçe aktarma sırasında bir hata oluştu!';
          alert(errorMessage);
        } finally {
          setIsImporting(false);
        }
      } else {
        alert('CSV dosyasında geçerli sürücü verisi bulunamadı!');
      }
    };

    reader.readAsText(file, 'UTF-8');

    // Input'u temizle
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ YENİ: Dropdown pozisyonunu hesapla
  const getDropdownPosition = (index: number, totalItems: number) => {
    const shouldOpenUpward = totalItems <= 2 || index >= totalItems - 2;
    return shouldOpenUpward ? 'bottom-full mb-2' : 'top-full mt-2';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'busy':
        return 'text-orange-600 bg-orange-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Müsait';
      case 'busy':
        return 'Meşgul';
      case 'offline':
        return 'Çevrimdışı';
      default:
        return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <UserCheck className="w-3 h-3 mr-1" />;
      case 'busy':
        return <Car className="w-3 h-3 mr-1" />;
      case 'offline':
        return <UserX className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 text-blue-600" /> :
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sürücüler</h1>
          <p className="text-gray-600 mt-1">Tüm sürücüleri yönetin ve takip edin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Import Button with Help */}
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4 mr-2" />
              )}
              {isImporting ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
            </button>
            <button
              onClick={() => setShowImportHelp(!showImportHelp)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-yellow-600 transition-colors"
              title="Yardım"
            >
              ?
            </button>

            {/* Import Help Modal */}
            {showImportHelp && (
              <>
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                  onClick={() => setShowImportHelp(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <HelpCircle className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Excel İçe Aktarma</h3>
                    </div>
                    <button
                      onClick={() => setShowImportHelp(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📋 Adımlar:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Şablon dosyasını indirin</li>
                        <li>Excel'de açıp sürücü bilgilerini doldurun</li>
                        <li>CSV formatında kaydedin</li>
                        <li>"İçe Aktar" butonuna tıklayın</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📝 Sütun Açıklamaları:</h4>
                      <ul className="space-y-1 text-gray-600 text-xs">
                        <li><strong>İsim:</strong> Sürücü adı soyadı (zorunlu)</li>
                        <li><strong>Telefon:</strong> İletişim numarası (zorunlu)</li>
                        <li><strong>Email:</strong> E-posta adresi (opsiyonel)</li>
                        <li><strong>Ehliyet No:</strong> Ehliyet numarası (zorunlu)</li>
                        <li><strong>Durum:</strong> available/busy/offline</li>
                        <li><strong>Puan:</strong> 0-5 arası (opsiyonel)</li>
                        <li><strong>Teslimat Sayısı:</strong> Sayı (opsiyonel)</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        downloadTemplate();
                        setShowImportHelp(false);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Şablon Dosyasını İndir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 border border-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {selectedDrivers.size > 0 ? `Seçilenleri Dışa Aktar (${selectedDrivers.size})` : 'Dışa Aktar'}
          </button>

          <Link
            to="/drivers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Sürücü
          </Link>
        </div>
      </div>

      {/* Stats Cards - Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Sürücü</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{drivers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Müsait</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {drivers.filter(d => d.status === 'available').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Meşgul</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {drivers.filter(d => d.status === 'busy').length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Car className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Puan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {drivers.length > 0
                  ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1)
                  : '0.0'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Hızlı Filtre:</span>
          <button
            onClick={() => applyQuickFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({drivers.length})
          </button>
          <button
            onClick={() => applyQuickFilter('available')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'available'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Müsait ({drivers.filter(d => d.status === 'available').length})
          </button>
          <button
            onClick={() => applyQuickFilter('busy')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'busy'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Meşgul ({drivers.filter(d => d.status === 'busy').length})
          </button>
          <button
            onClick={() => applyQuickFilter('offline')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'offline'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Çevrimdışı ({drivers.filter(d => d.status === 'offline').length})
          </button>
          <button
            onClick={() => applyQuickFilter('high_rated')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'high_rated'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yüksek Puanlı ({drivers.filter(d => d.rating && d.rating >= 4.0).length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sürücü ara (isim, telefon, ehliyet no)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedStatus !== 'all' || quickFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setQuickFilter('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Results Counter and Bulk Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{sortedDrivers.length}</span> sürücü gösteriliyor
          {sortedDrivers.length !== drivers.length && (
            <span className="text-gray-500"> ({drivers.length} toplam)</span>
          )}
        </p>

        {selectedDrivers.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{selectedDrivers.size}</span> sürücü seçildi
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Seçilenleri Sil
            </button>
            <button
              onClick={() => setSelectedDrivers(new Set())}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDrivers.size === sortedDrivers.length && sortedDrivers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Sürücü
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ehliyet No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center">
                      Performans
                      <SortIcon field="rating" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Kayıt Tarihi
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Sürücü bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  sortedDrivers.map((driver, index) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDrivers.has(driver.id)}
                          onChange={() => toggleDriverSelection(driver.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                            <p className="text-xs text-gray-500">ID: #{driver.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />
                            {driver.phone}
                          </div>
                          {driver.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-1" />
                              {driver.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <CreditCard className="w-4 h-4 mr-1" />
                          {driver.licenseNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                            {getStatusIcon(driver.status)}
                            {getStatusLabel(driver.status)}
                          </span>
                          <select
                            value={driver.status}
                            onChange={(e) => handleStatusChange(driver.id, e.target.value as any)}
                            disabled={isStatusChanging === driver.id}
                            className="text-xs border border-gray-200 rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="available">Müsait</option>
                            <option value="busy">Meşgul</option>
                            <option value="offline">Çevrimdışı</option>
                          </select>
                          {isStatusChanging === driver.id && (
                            <Loader2 className="w-3 h-3 ml-1 animate-spin text-blue-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{driver.rating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-500 ml-1">/ 5.0</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Package className="w-3 h-3 mr-1" />
                            {driver.totalDeliveries || 0} teslimat
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{formatDate(driver.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === driver.id ? null : driver.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {dropdownOpen === driver.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border py-1 z-20 ${getDropdownPosition(index, sortedDrivers.length)}`}>
                                <Link
                                  to={`/drivers/${driver.id}`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                                <Link
                                  to={`/drivers/${driver.id}/edit`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Düzenle
                                </Link>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(driver.id);
                                    setDropdownOpen(null);
                                  }}
                                  disabled={isDeleting === driver.id}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left disabled:opacity-50"
                                >
                                  {isDeleting === driver.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  {isDeleting === driver.id ? 'Siliniyor...' : 'Sil'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedDrivers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sürücü bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            sortedDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative">
                {/* Checkbox for selection */}
                <input
                  type="checkbox"
                  checked={selectedDrivers.has(driver.id)}
                  onChange={() => toggleDriverSelection(driver.id)}
                  className="absolute top-3 left-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 z-10"
                />

                <div className="flex items-start justify-between mb-3 ml-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{driver.name}</h3>
                      <p className="text-xs text-gray-500">ID: #{driver.id}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === driver.id ? null : driver.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {dropdownOpen === driver.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-20">
                          <Link
                            to={`/drivers/${driver.id}`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            Görüntüle
                          </Link>
                          <Link
                            to={`/drivers/${driver.id}/edit`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Düzenle
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(driver.id);
                              setDropdownOpen(null);
                            }}
                            disabled={isDeleting === driver.id}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-red-600 w-full text-left text-sm disabled:opacity-50"
                          >
                            {isDeleting === driver.id ? (
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-2" />
                            )}
                            {isDeleting === driver.id ? 'Siliniyor...' : 'Sil'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {driver.phone}
                  </div>
                  {driver.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {driver.licenseNumber}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                      {getStatusIcon(driver.status)}
                      {getStatusLabel(driver.status)}
                    </span>
                    <div className="flex items-center text-sm">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{driver.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Package className="w-3 h-3 mr-1" />
                      {driver.totalDeliveries || 0} teslimat
                    </span>
                    <span>{formatDate(driver.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Drivers;
