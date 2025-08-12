import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus,
  Search,
  Filter,
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
  Activity
} from 'lucide-react';
import { Vehicle } from '@/types';
import { vehicleService } from '@/services/mockData';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Load vehicles
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || vehicle.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Delete vehicle
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      await vehicleService.delete(id);
      loadVehicles();
    }
  };

  // Update vehicle status
  const handleStatusChange = async (id: string, status: 'active' | 'maintenance' | 'inactive') => {
    await vehicleService.updateStatus(id, status);
    loadVehicles();
  };

  // Export vehicles to CSV
  const handleExport = () => {
    const csvContent = [
      ['ID', 'Plaka', 'Tip', 'Marka', 'Model', 'Yıl', 'Kapasite (kg)', 'Durum', 'Yakıt Tipi'],
      ...filteredVehicles.map(vehicle => [
        vehicle.id,
        vehicle.plateNumber,
        vehicle.type,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.capacity,
        vehicle.status,
        vehicle.fuelType
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `araclar-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import vehicles from CSV
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
        const lines = csv.split('\n');
        
        // Skip header row and process data
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length > 1) {
            await vehicleService.create({
              plateNumber: values[1]?.trim(),
              type: values[2]?.trim() as Vehicle['type'] || 'car',
              brand: values[3]?.trim(),
              model: values[4]?.trim(),
              year: parseInt(values[5]) || new Date().getFullYear(),
              capacity: parseInt(values[6]) || 1000,
              status: 'active',
              fuelType: values[8]?.trim() as Vehicle['fuelType'] || 'diesel'
            });
          }
        }
        
        loadVehicles();
        alert('Araçlar başarıyla içe aktarıldı!');
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Get vehicle type icon
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

  // Get vehicle type label
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

  // Get status color
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

  // Get status label
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

  // Get status icon
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

  // Get fuel type label
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

  // Get fuel type color
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Araçlar</h1>
          <p className="text-gray-600 mt-1">Tüm araçları yönetin ve takip edin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button 
            onClick={handleImport}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ort. Kapasite</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {vehicles.length > 0 
                  ? Math.round(vehicles.reduce((sum, v) => sum + v.capacity, 0) / vehicles.length)
                  : 0} kg
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
          {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedStatus('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Araç
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapasite
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
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Araç bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
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
                        <p className="text-sm font-medium text-gray-900">{vehicle.plateNumber}</p>
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
                          <select
                            value={vehicle.status}
                            onChange={(e) => handleStatusChange(vehicle.id, e.target.value as any)}
                            className="text-xs border border-gray-200 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="active">Aktif</option>
                            <option value="maintenance">Bakımda</option>
                            <option value="inactive">Pasif</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === vehicle.id ? null : vehicle.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          {dropdownOpen === vehicle.id && (
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
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(vehicle.id);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Sil
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
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Araç bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
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
                      onClick={() => setDropdownOpen(dropdownOpen === vehicle.id ? null : vehicle.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {dropdownOpen === vehicle.id && (
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
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(vehicle.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-red-600 w-full text-left text-sm"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Sil
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
    </div>
  );
};

export default Vehicles;