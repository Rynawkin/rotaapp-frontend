// frontend/src/pages/Journeys.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package,
  Navigation,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Truck,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  Activity,
  Loader2,
  Archive,
  Trash2,
  Ban,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { Route } from '@/types';
import { journeyService, JourneySummary, BulkOperationResult } from '@/services/journey.service';
import { routeService } from '@/services/route.service';
import { useAuth } from '@/contexts/AuthContext';

const Journeys: React.FC = () => {
  const [journeys, setJourneys] = useState<JourneySummary[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  // ✅ YENİ: Sefer ismi modal state'leri
  const [showNameModal, setShowNameModal] = useState(false);
  const [journeyName, setJourneyName] = useState('');
  const [startKm, setStartKm] = useState<number | undefined>(undefined);
  
  // Toplu işlem state'leri
  const [selectedJourneyIds, setSelectedJourneyIds] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'cancel' | 'archive' | 'delete' | null>(null);
  
  const navigate = useNavigate();
  const { user, canAccessDispatcherFeatures } = useAuth();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadJourneys();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowBulkActions(selectedJourneyIds.size > 0);
  }, [selectedJourneyIds]);

  const loadData = async () => {
    setLoading(true);
    try {
      await loadJourneys();
      await loadAvailableRoutes();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJourneys = async () => {
    try {
      const data = await journeyService.getAllSummary();
      
      if (user?.isDriver && !canAccessDispatcherFeatures()) {
        const myJourneys = data.filter(j => j.driverId === user.id);
        setJourneys(myJourneys);
      } else {
        setJourneys(data);
      }
    } catch (error) {
      console.error('Error loading journeys:', error);
    }
  };

  const loadAvailableRoutes = async () => {
    try {
      if (user?.isDriver && !canAccessDispatcherFeatures()) {
        try {
          const response = await fetch('/api/workspace/routes', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const routes = await response.json();
            const myAvailableRoutes = routes.filter((r: Route) => 
              (r.status === 'planned' || r.status === 'draft') && 
              r.driverId === user.id &&
              r.vehicleId
            );
            setAvailableRoutes(myAvailableRoutes);
          } else {
            console.log('Route verileri yüklenemedi');
            setAvailableRoutes([]);
          }
        } catch (error) {
          console.log('Route API hatası:', error);
          setAvailableRoutes([]);
        }
      } else {
        const routes = await routeService.getAll();
        const available = routes.filter(r => 
          (r.status === 'planned' || r.status === 'draft') && 
          r.driverId && 
          r.vehicleId
        );
        setAvailableRoutes(available);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      setAvailableRoutes([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedJourneyIds.size === filteredJourneys.length) {
      setSelectedJourneyIds(new Set());
    } else {
      const allIds = new Set(filteredJourneys.map(j => j.id));
      setSelectedJourneyIds(allIds);
    }
  };

  const handleSelectJourney = (journeyId: number) => {
    const newSelection = new Set(selectedJourneyIds);
    if (newSelection.has(journeyId)) {
      newSelection.delete(journeyId);
    } else {
      newSelection.add(journeyId);
    }
    setSelectedJourneyIds(newSelection);
  };

  const isJourneySelected = (journeyId: number) => {
    return selectedJourneyIds.has(journeyId);
  };

  const handleBulkAction = (action: 'cancel' | 'archive' | 'delete') => {
    setBulkActionType(action);
    
    if (action === 'delete') {
      setShowDeleteConfirmDialog(true);
    } else {
      const confirmMessage = action === 'cancel' 
        ? `${selectedJourneyIds.size} seferi iptal etmek istediğinizden emin misiniz?`
        : `${selectedJourneyIds.size} seferi arşivlemek istediğinizden emin misiniz?`;
      
      if (window.confirm(confirmMessage)) {
        executeBulkAction(action);
      }
    }
  };

  const executeBulkAction = async (action: 'cancel' | 'archive' | 'delete') => {
    setBulkActionLoading(true);
    const selectedIds = Array.from(selectedJourneyIds);
    
    try {
      let result: BulkOperationResult;
      
      switch (action) {
        case 'cancel':
          result = await journeyService.bulkCancel(selectedIds, 'Toplu iptal');
          break;
        case 'archive':
          result = await journeyService.bulkArchive(selectedIds);
          break;
        case 'delete':
          result = await journeyService.bulkDelete(selectedIds, false);
          break;
        default:
          throw new Error('Geçersiz işlem');
      }
      
      if (result.failedCount > 0) {
        const failedDetails = result.failedItems
          .map(item => `${item.name || `ID: ${item.id}`}: ${item.reason}`)
          .join('\n');
        alert(`${result.message}\n\nBaşarısız olanlar:\n${failedDetails}`);
      } else {
        alert(result.message);
      }
      
      await loadJourneys();
      setSelectedJourneyIds(new Set());
      setShowDeleteConfirmDialog(false);
      
    } catch (error: any) {
      alert(error.message || 'İşlem başarısız oldu');
    } finally {
      setBulkActionLoading(false);
      setBulkActionType(null);
    }
  };

  // ✅ YENİ: Rota seçimi sonrası isim modal'ını aç
  const handleSelectRoute = (route: Route) => {
    setSelectedRoute(route);
    // İsim önerisi oluştur
    const dateStr = new Date().toLocaleDateString('tr-TR');
    setJourneyName(`${route.name} - ${dateStr}`);
    // Kilometre önerisi - route'daki currentKm veya vehicle'ın currentKm'si
    setStartKm(route.currentKm || route.vehicle?.currentKm || undefined);
    setShowStartModal(false);
    setShowNameModal(true);
  };

  // ✅ YENİ: İsimle ve kilometre ile birlikte sefer başlat
  const handleStartJourneyWithName = async () => {
    if (!selectedRoute || !journeyName.trim()) return;

    // Kilometre validasyonu
    if (!startKm || startKm < 0) {
      alert('❌ Geçerli bir kilometre değeri girmelisiniz!');
      return;
    }

    const vehicleCurrentKm = selectedRoute.vehicle?.currentKm;
    if (vehicleCurrentKm && startKm < vehicleCurrentKm) {
      alert(`❌ Başlangıç kilometresi (${startKm.toLocaleString('tr-TR')} km) aracın mevcut kilometresinden (${vehicleCurrentKm.toLocaleString('tr-TR')} km) küçük olamaz!`);
      return;
    }

    try {
      const journey = await journeyService.startFromRoute(
        selectedRoute.id,
        selectedRoute.driverId,
        journeyName,
        startKm
      );
      await loadData();
      setShowNameModal(false);
      setSelectedRoute(null);
      setJourneyName('');
      setStartKm(undefined);
      navigate(`/journeys/${journey.id}`);
    } catch (error: any) {
      alert(error.message || 'Sefer başlatılamadı');
    }
  };

  const handlePauseJourney = async (journeyId: number) => {
    try {
      await journeyService.updateStatus(journeyId, 'preparing');
      await loadJourneys();
    } catch (error) {
      console.error('Error pausing journey:', error);
      alert('Sefer duraklatılamadı');
    }
  };

  const handleResumeJourney = async (journeyId: number) => {
    try {
      await journeyService.updateStatus(journeyId, 'in_progress');
      await loadJourneys();
    } catch (error) {
      console.error('Error resuming journey:', error);
      alert('Sefer devam ettirilemedi');
    }
  };

  const handleCancelJourney = async (journeyId: number) => {
    if (window.confirm('Bu seferi iptal etmek istediğinizden emin misiniz?')) {
      try {
        await journeyService.cancel(journeyId);
        await loadData();
      } catch (error) {
        console.error('Error cancelling journey:', error);
        alert('Sefer iptal edilemedi');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'preparing':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Hazırlanıyor
          </span>
        );
      case 'started':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Play className="w-3 h-3 mr-1" />
            Başladı
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
      case 'archived':
        return (
          <span className="flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            <Archive className="w-3 h-3 mr-1" />
            Arşivlendi
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const calculateProgress = (journey: JourneySummary) => {
    if (journey.totalStops === 0) return 0;
    
    if (journey.status === 'completed') return 100;
    
    const failedStops = journey.failedStops || 0;
    const processedStops = journey.completedStops + failedStops;
    
    return Math.min(100, Math.round((processedStops / journey.totalStops) * 100));
  };

  const getFailedStops = (journey: JourneySummary) => {
    if (journey.status === 'completed' && !journey.failedStops) {
      return Math.max(0, journey.totalStops - journey.completedStops);
    }
    return journey.failedStops || 0;
  };

  const filteredJourneys = journeys.filter(journey => {
    if (journey.status === 'archived' && selectedStatus !== 'archived') {
      return false;
    }
    
    if (selectedStatus === 'all') {
      return journey.status !== 'archived';
    }
    if (selectedStatus === 'active') {
      return ['preparing', 'started', 'in_progress'].includes(journey.status);
    }
    if (selectedStatus === 'completed') {
      return journey.status === 'completed';
    }
    if (selectedStatus === 'cancelled') {
      return journey.status === 'cancelled';
    }
    if (selectedStatus === 'archived') {
      return journey.status === 'archived';
    }
    return journey.status === selectedStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Seferler</h1>
          <p className="text-gray-600 mt-1">
            {user?.isDriver && !canAccessDispatcherFeatures() 
              ? 'Seferlerinizi takip edin ve yönetin'
              : 'Aktif seferleri takip edin ve yönetin'}
          </p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Play className="w-4 h-4 mr-2" />
          Yeni Sefer Başlat
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && canAccessDispatcherFeatures() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {selectedJourneyIds.size} sefer seçildi
              </span>
              <button
                onClick={() => setSelectedJourneyIds(new Set())}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Seçimi Temizle
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('cancel')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center text-sm disabled:opacity-50"
              >
                {bulkActionLoading && bulkActionType === 'cancel' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4 mr-1" />
                )}
                Toplu İptal
              </button>
              
              <button
                onClick={() => handleBulkAction('archive')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm disabled:opacity-50"
              >
                {bulkActionLoading && bulkActionType === 'archive' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4 mr-1" />
                )}
                Toplu Arşivle
              </button>
              
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm disabled:opacity-50"
              >
                {bulkActionLoading && bulkActionType === 'delete' ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Toplu Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Seferler</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.filter(j => ['preparing', 'started', 'in_progress'].includes(j.status)).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.filter(j => j.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {user?.isDriver && !canAccessDispatcherFeatures() ? 'Toplam Mesafem' : 'Toplam Mesafe'}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.reduce((sum, j) => sum + j.totalDistance, 0).toFixed(1)} km
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Süre</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {journeys.length > 0 
                  ? formatDuration(
                      Math.round(journeys.reduce((sum, j) => sum + j.totalDuration, 0) / journeys.length)
                    )
                  : '0dk'
                }
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-1 border border-gray-100 inline-flex">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tümü ({journeys.filter(j => j.status !== 'archived').length})
        </button>
        <button
          onClick={() => setSelectedStatus('active')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'active' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Aktif ({journeys.filter(j => ['preparing', 'started', 'in_progress'].includes(j.status)).length})
        </button>
        <button
          onClick={() => setSelectedStatus('completed')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'completed' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tamamlanan ({journeys.filter(j => j.status === 'completed').length})
        </button>
        <button
          onClick={() => setSelectedStatus('cancelled')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'cancelled' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          İptal ({journeys.filter(j => j.status === 'cancelled').length})
        </button>
        <button
          onClick={() => setSelectedStatus('archived')}
          className={`px-4 py-2 rounded-md transition-colors ${
            selectedStatus === 'archived' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Arşiv ({journeys.filter(j => j.status === 'archived').length})
        </button>
      </div>

      {/* Select All Checkbox */}
      {filteredJourneys.length > 0 && canAccessDispatcherFeatures() && (
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 flex items-center">
          <button
            onClick={handleSelectAll}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {selectedJourneyIds.size === filteredJourneys.length ? (
              <CheckSquare className="w-5 h-5 mr-2 text-blue-600" />
            ) : selectedJourneyIds.size > 0 && selectedJourneyIds.size < filteredJourneys.length ? (
              <div className="w-5 h-5 mr-2 border-2 border-blue-600 rounded">
                <div className="w-2 h-2 bg-blue-600 m-0.5" />
              </div>
            ) : (
              <Square className="w-5 h-5 mr-2" />
            )}
            Tümünü Seç
          </button>
        </div>
      )}

      {/* Journeys List */}
      <div className="space-y-4">
        {filteredJourneys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {user?.isDriver && !canAccessDispatcherFeatures() 
                ? 'Size ait sefer bulunamadı'
                : 'Sefer bulunamadı'}
            </p>
            {selectedStatus === 'active' && (
              <p className="text-sm text-gray-400 mt-1">
                Yeni bir sefer başlatmak için yukarıdaki butonu kullanın
              </p>
            )}
          </div>
        ) : (
          filteredJourneys.map((journey) => {
            const failedStops = getFailedStops(journey);
            const displayedCompletedStops = journey.status === 'completed' 
              ? journey.totalStops - failedStops
              : journey.completedStops;

            return (
              <div key={journey.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-start">
                  {/* Checkbox */}
                  {canAccessDispatcherFeatures() && (
                    <div className="mr-4 pt-1">
                      <button
                        onClick={() => handleSelectJourney(journey.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isJourneySelected(journey.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {journey.name || journey.routeName || 'İsimsiz Sefer'}
                      </h3>
                      {getStatusBadge(journey.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {journey.driverName || user?.fullName || 'Sürücü'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Truck className="w-4 h-4 mr-2 text-gray-400" />
                        {journey.vehiclePlateNumber}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(journey.startedAt || journey.createdAt).toLocaleDateString('tr-TR')}
                        {' • '}
                        {formatTime(journey.startedAt || journey.createdAt)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>İlerleme</span>
                        <span>
                          {journey.status === 'completed' 
                            ? `${journey.totalStops} / ${journey.totalStops} durak`
                            : failedStops > 0
                              ? `${displayedCompletedStops} başarılı, ${failedStops} başarısız / ${journey.totalStops} durak`
                              : `${displayedCompletedStops} / ${journey.totalStops} durak`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        {displayedCompletedStops > 0 && (
                          <div 
                            className="absolute h-full bg-green-500 transition-all"
                            style={{ 
                              width: `${(displayedCompletedStops / journey.totalStops) * 100}%`,
                              left: 0
                            }}
                          />
                        )}
                        {failedStops > 0 && (
                          <div 
                            className="absolute h-full bg-red-500 transition-all"
                            style={{ 
                              width: `${(failedStops / journey.totalStops) * 100}%`,
                              left: `${(displayedCompletedStops / journey.totalStops) * 100}%`
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {journey.totalDistance.toFixed(1)} km
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDuration(journey.totalDuration)}
                      </div>
                      {journey.liveLocation && (
                        <div className="flex items-center text-green-600">
                          <Activity className="w-4 h-4 mr-1 animate-pulse" />
                          {journey.liveLocation.speed?.toFixed(0)} km/h
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative ml-4">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === journey.id.toString() ? null : journey.id.toString())}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    {dropdownOpen === journey.id.toString() && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                          <Link
                            to={`/journeys/${journey.id}`}
                            className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Detayları Görüntüle
                          </Link>
                          
                          {journey.status === 'preparing' && (
                            <button
                              onClick={() => {
                                handleResumeJourney(journey.id);
                                setDropdownOpen(null);
                              }}
                              className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Devam Et
                            </button>
                          )}
                          
                          {journey.status === 'in_progress' && (
                            <button
                              onClick={() => {
                                handlePauseJourney(journey.id);
                                setDropdownOpen(null);
                              }}
                              className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700 w-full text-left"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Duraklat
                            </button>
                          )}
                          
                          {['preparing', 'started', 'in_progress'].includes(journey.status) && 
                           (canAccessDispatcherFeatures() || journey.driverId === user?.id) && (
                            <>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  handleCancelJourney(journey.id);
                                  setDropdownOpen(null);
                                }}
                                className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                İptal Et
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start Journey Modal - Rota Seçimi */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Rota Seçin</h2>
            
            {availableRoutes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
                <p className="text-gray-600">
                  {user?.isDriver && !canAccessDispatcherFeatures()
                    ? 'Size atanmış başlatılabilecek rota bulunamadı.'
                    : 'Başlatılabilecek rota bulunamadı.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {user?.isDriver && !canAccessDispatcherFeatures()
                    ? 'Yöneticinizin size rota atamasını bekleyin.'
                    : 'Sefer başlatmak için rotaya sürücü ve araç atamanız gerekiyor.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableRoutes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoute?.id === route.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{route.name}</h3>
                      <span className="text-xs text-gray-500">
                        {route.stops?.length || 0} durak
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {route.driver?.name || user?.fullName}
                      </div>
                      <div className="flex items-center">
                        <Truck className="w-3 h-3 mr-1" />
                        {route.vehicle?.plateNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStartModal(false);
                  setSelectedRoute(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              {selectedRoute && (
                <button
                  onClick={() => handleSelectRoute(selectedRoute)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  İleri
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ YENİ: Sefer İsmi Modal'ı */}
      {showNameModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Sefer Oluştur</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                <strong>{selectedRoute.name}</strong> rotasından sefer oluşturulacak
              </p>

              {/* Araç ve Sürücü Bilgisi */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Sürücü:</span>
                  <span className="ml-2 font-medium">{selectedRoute.driver?.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Truck className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">Araç:</span>
                  <span className="ml-2 font-medium">{selectedRoute.vehicle?.plateNumber}</span>
                </div>
                {selectedRoute.vehicle?.currentKm && (
                  <div className="flex items-center text-sm">
                    <Activity className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600">Mevcut Km:</span>
                    <span className="ml-2 font-medium">{selectedRoute.vehicle.currentKm.toLocaleString('tr-TR')} km</span>
                  </div>
                )}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sefer Adı
              </label>
              <input
                type="text"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                placeholder="Örn: Sabah Teslimatı - 04.09.2025"
                autoFocus
              />

              {/* Kilometre Girişi */}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Kilometresi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={startKm || ''}
                onChange={(e) => setStartKm(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={selectedRoute.vehicle?.currentKm ? selectedRoute.vehicle.currentKm.toString() : 'Örn: 50000'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sefer başlatılırken aracın kilometre bilgisi
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setSelectedRoute(null);
                  setJourneyName('');
                  setStartKm(undefined);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleStartJourneyWithName}
                disabled={!journeyName.trim() || !startKm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seferi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Kalıcı Silme Uyarısı</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                <strong>{selectedJourneyIds.size} sefer</strong> kalıcı olarak silinecek.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>DİKKAT:</strong> Bu işlem geri alınamaz! Silinecek seferler ve tüm ilişkili veriler 
                  (durak bilgileri, teslimat kayıtları, imzalar, fotoğraflar) kalıcı olarak veritabanından kaldırılacaktır.
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Eğer seferleri saklamak ama görünmez yapmak istiyorsanız, bunun yerine <strong>Arşivleme</strong> seçeneğini kullanın.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => executeBulkAction('delete')}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Evet, Kalıcı Olarak Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journeys;