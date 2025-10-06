import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Upload,
  Car,
  Truck,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Fuel,
  Package,
  Grid,
  List,
  AlertCircle,
  Loader2,
  Wrench,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  X,
  FileDown,
  Gauge
} from 'lucide-react';
import { Vehicle } from '@/types';
import { vehicleService } from '@/services/vehicle.service';
import MaintenanceList from '@/components/vehicles/MaintenanceList';

type SortField = 'plateNumber' | 'brand' | 'capacity' | 'year' | 'createdAt' | 'currentKm';
type SortDirection = 'asc' | 'desc';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<number>>(new Set());
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedVehicleForMaintenance, setSelectedVehicleForMaintenance] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'maintenance'>('list');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (error: any) {
      console.error('Error loading vehicles:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Araçlar yüklenirken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Quick filters
  const applyQuickFilter = (vehicles: Vehicle[]) => {
    switch (quickFilter) {
      case 'active':
        return vehicles.filter(v => v.status === 'active');
      case 'maintenance':
        return vehicles.filter(v => v.status === 'maintenance');
      case 'inactive':
        return vehicles.filter(v => v.status === 'inactive');
      case 'electric':
        return vehicles.filter(v => v.fuelType === 'electric');
      default:
        return vehicles;
    }
  };

  // Filter vehicles
  const filteredVehicles = applyQuickFilter(vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || vehicle.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  }));

  // Sort vehicles
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'plateNumber':
        comparison = a.plateNumber.localeCompare(b.plateNumber, 'tr');
        break;
      case 'brand':
        comparison = `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'tr');
        break;
      case 'capacity':
        comparison = a.capacity - b.capacity;
        break;
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      case 'currentKm':
        comparison = (a.currentKm || 0) - (b.currentKm || 0);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  // Bulk selection
  const toggleVehicleSelection = (id: number) => {
    const newSelection = new Set(selectedVehicles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedVehicles(newSelection);
  };

  const toggleAllVehicles = () => {
    if (selectedVehicles.size === sortedVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(sortedVehicles.map(v => v.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.size === 0) return;

    if (!confirm(`Seçili ${selectedVehicles.size} aracı silmek istediğinize emin misiniz?`)) return;

    try {
      await Promise.all(Array.from(selectedVehicles).map(id => vehicleService.delete(id)));
      await loadVehicles();
      setSelectedVehicles(new Set());
      alert(`${selectedVehicles.size} araç başarıyla silindi`);
    } catch (error: any) {
      console.error('Error deleting vehicles:', error);
      alert('Araçlar silinirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      setIsDeleting(id);
      try {
        await vehicleService.delete(id);
        await loadVehicles();
        alert('Araç başarıyla silindi');
      } catch (error: any) {
        console.error('Error deleting vehicle:', error);
        const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Araç silinirken bir hata oluştu';
        alert(errorMessage);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleStatusChange = async (id: number, status: 'active' | 'maintenance' | 'inactive') => {
    setIsStatusChanging(id);
    try {
      await vehicleService.updateStatus(id, status);
      await loadVehicles();
      alert('Araç durumu başarıyla güncellendi');
    } catch (error: any) {
      console.error('Error updating vehicle status:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Durum güncellenirken bir hata oluştu';
      alert(errorMessage);
    } finally {
      setIsStatusChanging(null);
    }
  };

  // Export to Excel/CSV
  const handleExport = () => {
    const vehiclesToExport = selectedVehicles.size > 0
      ? sortedVehicles.filter(v => selectedVehicles.has(v.id))
      : sortedVehicles;

    const csvContent = vehicleService.exportToCSV(vehiclesToExport);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `araclar-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download template
  const handleDownloadTemplate = () => {
    const template = vehicleService.exportToCSV([]);
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'arac-sablonu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const csv = event.target?.result as string;
        const vehiclesToImport = vehicleService.parseCSV(csv);

        if (vehiclesToImport.length === 0) {
          alert('CSV dosyasında geçerli araç bulunamadı');
          return;
        }

        try {
          setIsImporting(true);
          await vehicleService.bulkImport(vehiclesToImport);
          await loadVehicles();
          alert(`${vehiclesToImport.length} araç başarıyla içe aktarıldı!`);
        } catch (error: any) {
          console.error('Error importing vehicles:', error);
          const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Araçlar içe aktarılırken bir hata oluştu';
          alert(errorMessage);
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="w-5 h-5" />;
      case 'van':
        return <Car className="w-5 h-5" />;
      case 'motorcycle':
        return <Activity className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'car':
        return 'Otomobil';
      case 'van':
        return 'Panelvan';
      case 'truck':
        return 'Kamyon';
      case 'motorcycle':
        return 'Motosiklet';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'maintenance':
        return 'text-orange-600 bg-orange-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'maintenance':
        return 'Bakımda';
      case 'inactive':
        return 'Pasif';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'maintenance':
        return <Wrench className="w-3 h-3 mr-1" />;
      case 'inactive':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline':
        return 'Benzin';
      case 'diesel':
        return 'Dizel';
      case 'electric':
        return 'Elektrik';
      case 'hybrid':
        return 'Hibrit';
      default:
        return fuelType;
    }
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline':
        return 'text-blue-600 bg-blue-50';
      case 'diesel':
        return 'text-gray-600 bg-gray-50';
      case 'electric':
        return 'text-green-600 bg-green-50';
      case 'hybrid':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If maintenance tab is selected
  if (activeTab === 'maintenance') {
    return (
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Araçlar</h1>
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              >
                Araç Listesi
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              >
                Bakım Yönetimi
              </button>
            </nav>
          </div>
        </div>

        {/* Vehicle Selection for Maintenance */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bakım Kaydı Görmek İstediğiniz Aracı Seçin
          </label>
          <select
            value={selectedVehicleForMaintenance?.id || ''}
            onChange={(e) => {
              const vehicle = vehicles.find(v => v.id === parseInt(e.target.value));
              setSelectedVehicleForMaintenance(vehicle || null);
            }}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Araç seçin...</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        {/* Maintenance List */}
        {selectedVehicleForMaintenance && (
          <MaintenanceList
            vehicle={selectedVehicleForMaintenance}
            onUpdate={loadVehicles}
          />
        )}

        {!selectedVehicleForMaintenance && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Araç Seçin</h3>
            <p className="text-gray-600">
              Bakım kayıtlarını görüntülemek için yukarıdan bir araç seçin
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Araçlar</h1>
          <p className="text-gray-600 mt-1">Tüm araçları yönetin ve takip edin</p>

          {/* Tabs */}
          <div className="mt-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              >
                Araç Listesi
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
              >
                <Wrench className="w-4 h-4 inline mr-1" />
                Bakım Yönetimi
              </button>
            </nav>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {selectedVehicles.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Seçilileri Sil ({selectedVehicles.size})
            </button>
          )}
          <button
            onClick={() => setShowImportHelp(true)}
            disabled={isImporting}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isImporting ? 'İçe Aktarılıyor...' : 'Import'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
            {selectedVehicles.size > 0 && ` (${selectedVehicles.size})`}
          </button>
          <Link
            to="/vehicles/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Araç
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          onClick={() => setQuickFilter('all')}
          className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
            quickFilter === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Araç</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{vehicles.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setQuickFilter('active')}
          className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
            quickFilter === 'active' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vehicles.filter(v => v.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setQuickFilter('maintenance')}
          className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
            quickFilter === 'maintenance' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bakımda</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vehicles.filter(v => v.status === 'maintenance').length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setQuickFilter('inactive')}
          className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
            quickFilter === 'inactive' ? 'ring-2 ring-gray-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pasif</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vehicles.filter(v => v.status === 'inactive').length}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setQuickFilter('electric')}
          className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer ${
            quickFilter === 'electric' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Elektrikli</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vehicles.filter(v => v.fuelType === 'electric').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Fuel className="w-6 h-6 text-green-600" />
            </div>
          </div>
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
                placeholder="Araç ara (plaka, marka, model)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Tipler</option>
              <option value="car">Otomobil</option>
              <option value="van">Panelvan</option>
              <option value="truck">Kamyon</option>
              <option value="motorcycle">Motosiklet</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="maintenance">Bakımda</option>
              <option value="inactive">Pasif</option>
            </select>

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
          {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || quickFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
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

      {/* Results Counter */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {sortedVehicles.length} araç gösteriliyor {filteredVehicles.length !== vehicles.length && `(${vehicles.length} toplam)`}
        </span>
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
                      checked={selectedVehicles.size === sortedVehicles.length && sortedVehicles.length > 0}
                      onChange={toggleAllVehicles}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('plateNumber')}
                  >
                    <div className="flex items-center">
                      Plaka
                      {getSortIcon('plateNumber')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center">
                      Araç
                      {getSortIcon('brand')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('capacity')}
                  >
                    <div className="flex items-center">
                      Kapasite
                      {getSortIcon('capacity')}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('currentKm')}
                  >
                    <div className="flex items-center">
                      Kilometre
                      {getSortIcon('currentKm')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Yakıt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Araç bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  sortedVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(vehicle.id)}
                          onChange={() => toggleVehicleSelection(vehicle.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            {getVehicleIcon(vehicle.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-xs text-gray-500">{vehicle.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {getVehicleTypeLabel(vehicle.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="w-4 h-4 mr-1" />
                          {vehicle.capacity} kg
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Gauge className="w-4 h-4 mr-1" />
                          {vehicle.currentKm ? vehicle.currentKm.toLocaleString('tr-TR') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFuelTypeColor(vehicle.fuelType)}`}>
                          <Fuel className="w-3 h-3 mr-1" />
                          {getFuelTypeLabel(vehicle.fuelType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                            {getStatusIcon(vehicle.status)}
                            {getStatusLabel(vehicle.status)}
                          </span>
                          {isStatusChanging === vehicle.id && (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === vehicle.id.toString() ? null : vehicle.id.toString())}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {dropdownOpen === vehicle.id.toString() && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                                <Link
                                  to={`/vehicles/${vehicle.id}`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                                <Link
                                  to={`/vehicles/${vehicle.id}/edit`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Düzenle
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedVehicleForMaintenance(vehicle);
                                    setActiveTab('maintenance');
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                                >
                                  <Wrench className="w-4 h-4 mr-2" />
                                  Bakım Geçmişi
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(vehicle.id);
                                    setDropdownOpen(null);
                                  }}
                                  disabled={isDeleting === vehicle.id}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left disabled:opacity-50"
                                >
                                  {isDeleting === vehicle.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  {isDeleting === vehicle.id ? 'Siliniyor...' : 'Sil'}
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
          {sortedVehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Araç bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            sortedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={() => toggleVehicleSelection(vehicle.id)}
                      className="rounded border-gray-300 mr-3"
                    />
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      {getVehicleIcon(vehicle.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-xs text-gray-500">{vehicle.year}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === vehicle.id.toString() ? null : vehicle.id.toString())}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {dropdownOpen === vehicle.id.toString() && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-20">
                          <Link
                            to={`/vehicles/${vehicle.id}`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            Görüntüle
                          </Link>
                          <Link
                            to={`/vehicles/${vehicle.id}/edit`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Düzenle
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedVehicleForMaintenance(vehicle);
                              setActiveTab('maintenance');
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm w-full text-left"
                          >
                            <Wrench className="w-3 h-3 mr-2" />
                            Bakım
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(vehicle.id);
                              setDropdownOpen(null);
                            }}
                            disabled={isDeleting === vehicle.id}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-red-600 w-full text-left text-sm disabled:opacity-50"
                          >
                            {isDeleting === vehicle.id ? (
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 mr-2" />
                            )}
                            {isDeleting === vehicle.id ? 'Siliniyor...' : 'Sil'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Plaka:</span>
                    <span className="font-medium text-gray-900">{vehicle.plateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tip:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {getVehicleTypeLabel(vehicle.type)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Kapasite:</span>
                    <span className="font-medium text-gray-900">{vehicle.capacity} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Kilometre:</span>
                    <span className="font-medium text-gray-900">
                      {vehicle.currentKm ? vehicle.currentKm.toLocaleString('tr-TR') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Yakıt:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFuelTypeColor(vehicle.fuelType)}`}>
                      {getFuelTypeLabel(vehicle.fuelType)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    {getStatusLabel(vehicle.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Import Help Modal */}
      {showImportHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                CSV Import Yardımı
              </h2>
              <button
                onClick={() => setShowImportHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📋 CSV Dosya Formatı</h3>
                <p className="text-sm text-gray-600 mb-3">
                  CSV dosyanız aşağıdaki sütunları içermelidir (başlık satırı olmalı):
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  plateNumber,type,brand,model,year,capacity,fuelType,status
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📝 Alan Açıklamaları</h3>
                <ul className="space-y-2 text-sm">
                  <li><strong>plateNumber:</strong> Plaka numarası (zorunlu)</li>
                  <li><strong>type:</strong> car, van, truck, motorcycle (zorunlu)</li>
                  <li><strong>brand:</strong> Marka (zorunlu)</li>
                  <li><strong>model:</strong> Model (zorunlu)</li>
                  <li><strong>year:</strong> Yıl (sayı, zorunlu)</li>
                  <li><strong>capacity:</strong> Kapasite kg (sayı, zorunlu)</li>
                  <li><strong>fuelType:</strong> gasoline, diesel, electric, hybrid (zorunlu)</li>
                  <li><strong>status:</strong> active, maintenance, inactive (opsiyonel, varsayılan: active)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">💡 Örnek CSV İçeriği</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  plateNumber,type,brand,model,year,capacity,fuelType,status<br />
                  34ABC123,car,Toyota,Corolla,2020,500,gasoline,active<br />
                  06XYZ456,van,Ford,Transit,2019,1500,diesel,active<br />
                  35DEF789,truck,Mercedes,Actros,2021,5000,diesel,maintenance
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Şablon İndir
                </button>
                <button
                  onClick={() => {
                    setShowImportHelp(false);
                    handleImport();
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Yükle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
