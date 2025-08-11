// src/pages/JourneyDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Navigation,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Truck,
  Package,
  Camera,
  Edit3,
  AlertCircle,
  Play,
  Pause,
  Activity,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Journey, RouteStop } from '@/types';
import { journeyService } from '@/services/mockData';

const JourneyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    if (id) {
      loadJourney();
      // Her 3 saniyede bir güncelle
      const interval = setInterval(loadJourney, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

  // Simülasyon için
  useEffect(() => {
    if (simulationActive && journey) {
      const interval = setInterval(() => {
        journeyService.simulateMovement(journey.id);
        loadJourney();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [simulationActive, journey]);

  const loadJourney = async () => {
    if (!id) return;
    
    try {
      const data = await journeyService.getById(id);
      if (data) {
        setJourney(data);
      } else {
        navigate('/journeys');
      }
    } catch (error) {
      console.error('Error loading journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!journey || !selectedStop) return;
    
    await journeyService.checkInStop(journey.id, selectedStop.id);
    await loadJourney();
    setShowCheckInModal(false);
    setSelectedStop(null);
  };

  const handleComplete = async () => {
    if (!journey || !selectedStop) return;
    
    await journeyService.completeStop(journey.id, selectedStop.id, {
      notes: deliveryNotes
    });
    await loadJourney();
    setShowCompleteModal(false);
    setSelectedStop(null);
    setDeliveryNotes('');
  };

  const handleFail = async () => {
    if (!journey || !selectedStop || !failureReason) return;
    
    await journeyService.failStop(journey.id, selectedStop.id, failureReason);
    await loadJourney();
    setShowFailModal(false);
    setSelectedStop(null);
    setFailureReason('');
  };

  const handlePause = async () => {
    if (!journey) return;
    await journeyService.updateStatus(journey.id, 'preparing');
    await loadJourney();
  };

  const handleResume = async () => {
    if (!journey) return;
    await journeyService.updateStatus(journey.id, 'in_progress');
    await loadJourney();
  };

  const handleCompleteJourney = async () => {
    if (!journey) return;
    if (window.confirm('Seferi tamamlamak istediğinizden emin misiniz?')) {
      await journeyService.updateStatus(journey.id, 'completed');
      navigate('/journeys');
    }
  };

  const getStopStatusIcon = (status: RouteStop['status']) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'arrived':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
        <p className="text-gray-600">Sefer bulunamadı</p>
      </div>
    );
  }

  const currentStop = journey.route.stops[journey.currentStopIndex];
  const progress = (journey.route.stops.filter(s => s.status === 'completed').length / journey.route.stops.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/journeys')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{journey.route.name}</h1>
            <p className="text-gray-600">Sefer Detayları</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Simülasyon Toggle */}
          <button
            onClick={() => setSimulationActive(!simulationActive)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              simulationActive 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" />
            {simulationActive ? 'Simülasyon Aktif' : 'Simülasyonu Başlat'}
          </button>
          
          {journey.status === 'preparing' && (
            <button
              onClick={handleResume}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Devam Et
            </button>
          )}
          
          {journey.status === 'in_progress' && (
            <button
              onClick={handlePause}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
            >
              <Pause className="w-4 h-4 mr-2" />
              Duraklat
            </button>
          )}
          
          {journey.status === 'in_progress' && progress === 100 && (
            <button
              onClick={handleCompleteJourney}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Seferi Tamamla
            </button>
          )}
        </div>
      </div>

      {/* Journey Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Sürücü</span>
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">{journey.route.driver?.name || 'Atanmadı'}</p>
          {journey.route.driver?.phone && (
            <a href={`tel:${journey.route.driver.phone}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-1">
              <Phone className="w-3 h-3 mr-1" />
              {journey.route.driver.phone}
            </a>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Araç</span>
            <Truck className="w-4 h-4 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">{journey.route.vehicle?.plateNumber || 'Atanmadı'}</p>
          <p className="text-sm text-gray-500">
            {journey.route.vehicle?.brand} {journey.route.vehicle?.model}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Durum</span>
            <Navigation className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            {journey.status === 'in_progress' && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <p className="font-semibold text-gray-900">
              {journey.status === 'preparing' && 'Hazırlanıyor'}
              {journey.status === 'in_progress' && 'Devam Ediyor'}
              {journey.status === 'completed' && 'Tamamlandı'}
              {journey.status === 'cancelled' && 'İptal Edildi'}
            </p>
          </div>
          {journey.liveLocation && (
            <p className="text-sm text-gray-500 mt-1">
              Hız: {journey.liveLocation.speed?.toFixed(0)} km/h
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">İlerleme Durumu</h3>
          <span className="text-sm text-gray-600">
            {journey.route.stops.filter(s => s.status === 'completed').length} / {journey.route.stops.length} durak tamamlandı
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{journey.totalDistance.toFixed(1)}</p>
            <p className="text-sm text-gray-600">km</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{Math.round(journey.totalDuration)}</p>
            <p className="text-sm text-gray-600">dakika</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{formatTime(journey.startedAt)}</p>
            <p className="text-sm text-gray-600">Başlangıç</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {currentStop ? currentStop.order : '-'}
            </p>
            <p className="text-sm text-gray-600">Mevcut Durak</p>
          </div>
        </div>
      </div>

      {/* Stops List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">Duraklar</h3>
        </div>
        <div className="divide-y">
          {journey.route.stops.map((stop, index) => (
            <div 
              key={stop.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index === journey.currentStopIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    {getStopStatusIcon(stop.status)}
                    {index < journey.route.stops.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">#{stop.order}</span>
                      <h4 className="font-medium text-gray-900">{stop.customer?.name}</h4>
                      {index === journey.currentStopIndex && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Mevcut
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{stop.customer?.address}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {stop.customer?.phone && (
                        <a href={`tel:${stop.customer.phone}`} className="flex items-center hover:text-blue-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {stop.customer.phone}
                        </a>
                      )}
                      {stop.estimatedArrival && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Tahmini: {formatTime(stop.estimatedArrival)}
                        </span>
                      )}
                      {stop.actualArrival && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Varış: {formatTime(stop.actualArrival)}
                        </span>
                      )}
                      {stop.completedAt && (
                        <span className="flex items-center text-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Tamamlandı: {formatTime(stop.completedAt)}
                        </span>
                      )}
                      {stop.failureReason && (
                        <span className="flex items-center text-red-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          {stop.failureReason}
                        </span>
                      )}
                    </div>
                    
                    {stop.stopNotes && (
                      <p className="text-sm text-gray-500 mt-2 italic">{stop.stopNotes}</p>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                {journey.status === 'in_progress' && stop.status === 'pending' && index === journey.currentStopIndex && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStop(stop);
                        setShowCheckInModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Check-in
                    </button>
                  </div>
                )}
                
                {journey.status === 'in_progress' && stop.status === 'arrived' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStop(stop);
                        setShowCompleteModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Tamamla
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStop(stop);
                        setShowFailModal(true);
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Başarısız
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Durağa Varış</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.customer?.name}</strong> adresine vardınız mı?
            </p>
            <p className="text-sm text-gray-500 mb-6">{selectedStop.customer?.address}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCheckIn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Evet, Vardım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Delivery Modal */}
      {showCompleteModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Teslimatı Tamamla</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.customer?.name}</strong> teslimatı tamamlandı mı?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teslimat Notu (Opsiyonel)
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Teslimat ile ilgili notlar..."
              />
            </div>
            
            <div className="flex justify-center space-x-4 mb-4">
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Fotoğraf</span>
              </button>
              <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                <Edit3 className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">İmza</span>
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setDeliveryNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Delivery Modal */}
      {showFailModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Teslimat Başarısız</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.customer?.name}</strong> teslimatı neden başarısız?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başarısızlık Nedeni
              </label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seçiniz...</option>
                <option value="Müşteri adreste yok">Müşteri adreste yok</option>
                <option value="Adres bulunamadı">Adres bulunamadı</option>
                <option value="Müşteri teslimatı reddetti">Müşteri teslimatı reddetti</option>
                <option value="Ödeme alınamadı">Ödeme alınamadı</option>
                <option value="Ürün hasarlı">Ürün hasarlı</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFailModal(false);
                  setFailureReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleFail}
                disabled={!failureReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Başarısız Olarak İşaretle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyDetail;