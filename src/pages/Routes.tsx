import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Truck,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Play,
  Download,
  Grid3x3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  TrendingUp
} from 'lucide-react';
import { Route } from '@/types';
import { routeService } from '@/services/route.service';
import { journeyService } from '@/services/journey.service';

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'date' | 'distance' | 'progress' | 'stops';
type SortDirection = 'asc' | 'desc';

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  // Sefer ismi modal state'leri
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedRouteForJourney, setSelectedRouteForJourney] = useState<Route | null>(null);
  const [journeyName, setJourneyName] = useState('');

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rotalar yüklenirken bir hata oluştu';
      console.error('Error loading routes:', error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Hızlı filtreler
  const applyQuickFilter = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch(filter) {
      case 'today':
        setSelectedDate(today.toISOString().split('T')[0]);
        setSelectedStatus('all');
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
        setSelectedStatus('all');
        break;
      case 'week':
        setSelectedDate('');
        setSelectedStatus('all');
        break;
      case 'active':
        setSelectedDate('');
        setSelectedStatus('in_progress');
        break;
      case 'completed':
        setSelectedDate('');
        setSelectedStatus('completed');
        break;
      case 'all':
        setSelectedDate('');
        setSelectedStatus('all');
        setSearchQuery('');
        break;
    }
  };

  // Sıralama
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedRoutes = (routesToSort: Route[]) => {
    return [...routesToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch(sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'distance':
          aValue = a.totalDistance || 0;
          bValue = b.totalDistance || 0;
          break;
        case 'progress':
          aValue = a.totalDeliveries > 0 ? (a.completedDeliveries / a.totalDeliveries) : 0;
          bValue = b.totalDeliveries > 0 ? (b.completedDeliveries / b.totalDeliveries) : 0;
          break;
        case 'stops':
          aValue = a.stops?.length || 0;
          bValue = b.stops?.length || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filter routes
  const filteredRoutes = getSortedRoutes(routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          route.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          route.vehicle?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || route.status === selectedStatus;

    const matchesDate = !selectedDate ||
                       new Date(route.date).toISOString().split('T')[0] === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  }));

  // Toplu seçim
  const toggleSelectAll = () => {
    if (selectedRoutes.size === filteredRoutes.length) {
      setSelectedRoutes(new Set());
    } else {
      setSelectedRoutes(new Set(filteredRoutes.map(r => r.id)));
    }
  };

  const toggleSelectRoute = (id: string) => {
    const newSelected = new Set(selectedRoutes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRoutes(newSelected);
  };

  // Toplu silme
  const handleBulkDelete = async () => {
    if (selectedRoutes.size === 0) return;

    if (window.confirm(`${selectedRoutes.size} rotayı silmek istediğinizden emin misiniz?`)) {
      try {
        await Promise.all(
          Array.from(selectedRoutes).map(id => routeService.delete(id))
        );
        setSelectedRoutes(new Set());
        await loadRoutes();
      } catch (error: any) {
        const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rotalar silinemedi';
        alert(errorMessage);
      }
    }
  };

  // Excel export
  const handleExcelExport = () => {
    const dataToExport = selectedRoutes.size > 0
      ? filteredRoutes.filter(r => selectedRoutes.has(r.id))
      : filteredRoutes;

    const csvData = [
      ['Rota Adı', 'Tarih', 'Sürücü', 'Araç', 'Durum', 'Durak Sayısı', 'Mesafe (km)', 'Süre (dk)', 'İlerleme'],
      ...dataToExport.map(route => [
        route.name,
        new Date(route.date).toLocaleDateString('tr-TR'),
        route.driver?.name || 'Atanmadı',
        route.vehicle?.plateNumber || 'Atanmadı',
        getStatusText(route.status),
        route.stops?.length || 0,
        route.totalDistance || '-',
        route.totalDuration || '-',
        `${route.completedDeliveries}/${route.totalDeliveries}`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotalar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Delete route
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu rotayı silmek istediğinizden emin misiniz?')) {
      try {
        await routeService.delete(id);
        await loadRoutes();
      } catch (error: any) {
        const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rota silinemedi';
        alert(errorMessage);
      }
    }
  };

  // Duplicate route
  const handleDuplicate = async (route: Route) => {
    try {
      await routeService.duplicate(route);
      await loadRoutes();
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Rota kopyalanamadı';
      alert(errorMessage);
    }
  };

  // Start journey from route
  const handleStartJourney = async (route: Route) => {
    try {
      if (!route.driverId || !route.vehicleId) {
        alert('⚠️ Sefer başlatmak için rotaya sürücü ve araç atamanız gerekiyor.');
        navigate(`/routes/${route.id}/edit`);
        return;
      }

      if (!route.stops || route.stops.length === 0) {
        alert('⚠️ Sefer başlatmak için en az bir durak eklemelisiniz!');
        return;
      }

      setSelectedRouteForJourney(route);
      const dateStr = new Date().toLocaleDateString('tr-TR');
      setJourneyName(`${route.name} - ${dateStr}`);
      setShowNameModal(true);

    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.message || 'Sefer başlatılamadı';
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleConfirmStartJourney = async () => {
    if (!selectedRouteForJourney || !journeyName.trim()) return;

    try {
      const journey = await journeyService.startFromRoute(
        selectedRouteForJourney.id,
        selectedRouteForJourney.driverId,
        journeyName
      );

      setShowNameModal(false);
      setSelectedRouteForJourney(null);
      setJourneyName('');

      alert('✅ Sefer başarıyla oluşturuldu!');
      navigate(`/journeys/${journey.id}`);
    } catch (error: any) {
      const errorMessage = error.userFriendlyMessage || error.message || 'Sefer başlatılamadı';
      alert(`❌ ${errorMessage}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            <Edit className="w-3 h-3 mr-1" />
            Taslak
          </span>
        );
      case 'planned':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Calendar className="w-3 h-3 mr-1" />
            Planlandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <Navigation className="w-3 h-3 mr-1 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'Taslak',
      planned: 'Planlandı',
      in_progress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Rotalar</h1>
          <p className="text-gray-600 mt-1">Tüm rotalarınızı yönetin ve optimize edin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={handleExcelExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </button>
          <Link
            to="/routes/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Rota
          </Link>
        </div>
      </div>

      {/* Stats Cards - Dashboard tarzı */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Toplam
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{routes.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Toplam Rota</p>
            <p className="text-xs text-gray-500 mt-1">Tüm rotalar</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-green-100">
              <Navigation className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center text-sm font-medium text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-1 animate-pulse"></div>
              Aktif
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {routes.filter(r => r.status === 'in_progress').length}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Aktif Rotalar</p>
            <p className="text-xs text-gray-500 mt-1">Devam ediyor</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center text-sm font-medium text-gray-600">
              Bugün
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {routes.filter(r =>
                new Date(r.date).toDateString() === new Date().toDateString()
              ).length}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Bugünkü Rotalar</p>
            <p className="text-xs text-gray-500 mt-1">Planlanan</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-orange-100">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center text-sm font-medium text-orange-600">
              Optimize
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {routes.filter(r => r.optimized).length}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Optimize Edilmiş</p>
            <p className="text-xs text-gray-500 mt-1">AI ile optimize</p>
          </div>
        </div>
      </div>

      {/* Hızlı Filtreler */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => applyQuickFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedDate === '' && selectedStatus === 'all' && searchQuery === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => applyQuickFilter('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedDate === new Date().toISOString().split('T')[0]
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Bugün
        </button>
        <button
          onClick={() => applyQuickFilter('tomorrow')}
          className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          Yarın
        </button>
        <button
          onClick={() => applyQuickFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'in_progress'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Aktif
        </button>
        <button
          onClick={() => applyQuickFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedStatus === 'completed'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Tamamlananlar
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rota, sürücü veya araç ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="planned">Planlandı</option>
              <option value="in_progress">Devam Ediyor</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Delete */}
            {selectedRoutes.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Seçilileri Sil ({selectedRoutes.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Routes - List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRoutes.size === filteredRoutes.length && filteredRoutes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Rota
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Tarih
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sürücü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Araç
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('progress')}
                  >
                    <div className="flex items-center">
                      İlerleme
                      <SortIcon field="progress" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('distance')}
                  >
                    <div className="flex items-center">
                      Mesafe
                      <SortIcon field="distance" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Rota bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRoutes.has(route.id)}
                          onChange={() => toggleSelectRoute(route.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{route.name}</p>
                            <p className="text-xs text-gray-500">
                              {route.stops?.length || 0} durak
                              {route.optimized && (
                                <span className="ml-2 text-green-600">• Optimize</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(route.date)}</div>
                        {route.startedAt && (
                          <div className="text-xs text-gray-500">{formatTime(route.startedAt)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {route.driver ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-gray-600">
                                {route.driver.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900">{route.driver.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {route.vehicle ? (
                          <div className="flex items-center">
                            <Truck className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{route.vehicle.plateNumber}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmadı</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(route.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 mr-3 max-w-[100px]">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  route.status === 'completed' ? 'bg-green-500' :
                                  route.status === 'in_progress' ? 'bg-blue-500' :
                                  'bg-gray-300'
                                }`}
                                style={{
                                  width: `${route.totalDeliveries > 0 ? (route.completedDeliveries / route.totalDeliveries) * 100 : 0}%`
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {route.completedDeliveries}/{route.totalDeliveries}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1" />
                          {route.totalDistance ? `${route.totalDistance} km` : '-'}
                        </div>
                        {route.totalDuration && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {route.totalDuration} dk
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === route.id ? null : route.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {dropdownOpen === route.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                                <Link
                                  to={`/routes/${route.id}`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                                <Link
                                  to={`/routes/${route.id}/edit`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Düzenle
                                </Link>

                                {(route.status === 'planned' || route.status === 'draft') && route.stops && route.stops.length > 0 && (
                                  <button
                                    onClick={() => {
                                      handleStartJourney(route);
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2 hover:bg-gray-50 text-green-700 w-full text-left"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Sefer Oluştur
                                  </button>
                                )}

                                {route.status === 'in_progress' && (
                                  <button
                                    onClick={async () => {
                                      const journey = await journeyService.getByRouteId(route.id);
                                      if (journey) {
                                        navigate(`/journeys/${journey.id}`);
                                      }
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2 hover:bg-gray-50 text-blue-700 w-full text-left"
                                  >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Sefere Git
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    handleDuplicate(route);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Kopyala
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(route.id);
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
      )}

      {/* Routes - Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Rota bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            filteredRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 relative">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedRoutes.has(route.id)}
                  onChange={() => toggleSelectRoute(route.id)}
                  className="absolute top-4 left-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                {/* Menu */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setDropdownOpen(dropdownOpen === route.id ? null : route.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {dropdownOpen === route.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                        <Link
                          to={`/routes/${route.id}`}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setDropdownOpen(null)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Görüntüle
                        </Link>
                        <Link
                          to={`/routes/${route.id}/edit`}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                          onClick={() => setDropdownOpen(null)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Düzenle
                        </Link>
                        <button
                          onClick={() => {
                            handleDuplicate(route);
                            setDropdownOpen(null);
                          }}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Kopyala
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleDelete(route.id);
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

                {/* Icon */}
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mt-6">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{route.name}</h3>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(route.date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Package className="w-4 h-4 mr-2" />
                    {route.stops?.length || 0} durak
                    {route.optimized && <span className="ml-2 text-green-600">• Optimize</span>}
                  </div>
                  {route.driver && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Truck className="w-4 h-4 mr-2" />
                      {route.driver.name}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="mb-4">
                  {getStatusBadge(route.status)}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>İlerleme</span>
                    <span>{route.completedDeliveries}/{route.totalDeliveries}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        route.status === 'completed' ? 'bg-green-500' :
                        route.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}
                      style={{
                        width: `${route.totalDeliveries > 0 ? (route.completedDeliveries / route.totalDeliveries) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                {(route.status === 'planned' || route.status === 'draft') && route.stops && route.stops.length > 0 && (
                  <button
                    onClick={() => handleStartJourney(route)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Sefer Oluştur
                  </button>
                )}

                {route.status === 'in_progress' && (
                  <button
                    onClick={async () => {
                      const journey = await journeyService.getByRouteId(route.id);
                      if (journey) {
                        navigate(`/journeys/${journey.id}`);
                      }
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Sefere Git
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Sefer İsmi Modal'ı */}
      {showNameModal && selectedRouteForJourney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Sefer Oluştur</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                <strong>{selectedRouteForJourney.name}</strong> rotasından sefer oluşturulacak
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sefer Adı
              </label>
              <input
                type="text"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Sabah Teslimatı - 04.09.2025"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Seferi diğerlerinden ayırt edebilmek için açıklayıcı bir isim verin
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setSelectedRouteForJourney(null);
                  setJourneyName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmStartJourney}
                disabled={!journeyName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seferi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;
