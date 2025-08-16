// src/pages/JourneyDetail.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Activity,
  Loader2,
  X,
  Download,
  Eye
} from 'lucide-react';
import { Journey, JourneyStop, JourneyStatus } from '@/types';
import { journeyService } from '@/services/journey.service';

const JourneyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [failureNotes, setFailureNotes] = useState('');
  const [simulationActive, setSimulationActive] = useState(false);
  
  // ✅ YENİ STATE'LER - İmza ve Fotoğraf için
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [signatureBase64, setSignatureBase64] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  
  // ✅ YENİ - Görüntüleme için
  const [viewSignature, setViewSignature] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  
  // Canvas ve file input ref'leri
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadJourney();
      const interval = setInterval(loadJourney, 3000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    if (simulationActive && journey) {
      const interval = setInterval(() => {
        journeyService.simulateMovement(journey.id);
        loadJourney();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [simulationActive, journey]);

  // ✅ Canvas başlangıç ayarları
  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [showSignatureModal]);

  const loadJourney = async () => {
    if (!id) return;
    
    try {
      const data = await journeyService.getById(id);
      console.log('Journey detail loaded:', data);
      console.log('Journey stops:', data.stops);
      console.log('Journey stops count:', data.stops?.length);
      
      if (data) {
        setJourney(data);
      } else {
        navigate('/journeys');
      }
    } catch (error) {
      console.error('Error loading journey:', error);
      navigate('/journeys');
    } finally {
      setLoading(false);
    }
  };

  // ✅ İMZA FONKSİYONLARI
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const base64 = canvas.toDataURL('image/png');
    setSignatureBase64(base64);
    setShowSignatureModal(false);
  };

  // ✅ FOTOĞRAF FONKSİYONLARI
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
      setShowPhotoModal(false);
    };
    reader.readAsDataURL(file);
  };

  // ✅ GÜNCELLENMİŞ HANDLER'LAR
  const handleCheckIn = async () => {
    if (!journey || !selectedStop) return;
    
    try {
      await journeyService.checkInStop(journey.id, selectedStop.id);
      await loadJourney();
      setShowCheckInModal(false);
      setSelectedStop(null);
    } catch (error) {
      console.error('Error checking in stop:', error);
      alert('Check-in yapılamadı');
    }
  };

  const handleComplete = async () => {
    if (!journey || !selectedStop) return;
    
    try {
      // ✅ İmza, fotoğraf ve notları da gönder
      await journeyService.completeStop(journey.id, selectedStop.id, {
        notes: deliveryNotes,
        signatureBase64: signatureBase64,
        photoBase64: photoBase64
      });
      await loadJourney();
      
      // Modal'ı kapat ve state'leri temizle
      setShowCompleteModal(false);
      setSelectedStop(null);
      setDeliveryNotes('');
      setSignatureBase64('');
      setPhotoBase64('');
    } catch (error) {
      console.error('Error completing stop:', error);
      alert('Teslimat tamamlanamadı');
    }
  };

  const handleFail = async () => {
    if (!journey || !selectedStop || !failureReason) return;
    
    try {
      // ✅ Başarısızlık nedeni ve notları gönder
      await journeyService.failStop(journey.id, selectedStop.id, failureReason, failureNotes);
      await loadJourney();
      
      setShowFailModal(false);
      setSelectedStop(null);
      setFailureReason('');
      setFailureNotes('');
    } catch (error) {
      console.error('Error failing stop:', error);
      alert('İşlem başarısız');
    }
  };

  const handleCompleteJourney = async () => {
    if (!journey) return;
    if (window.confirm('Seferi tamamlamak istediğinizden emin misiniz?')) {
      try {
        await journeyService.finish(journey.id);
        navigate('/journeys');
      } catch (error: any) {
        console.error('Error completing journey:', error);
        // ✅ Backend'den gelen hata mesajını göster
        const errorMessage = error.response?.data?.message || 'Sefer tamamlanamadı';
        alert(errorMessage);
      }
    }
  };

  const getStopStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inprogress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'failed':
      case 'skipped':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeSpan = (timespan?: string) => {
    if (!timespan) return '-';
    const parts = timespan.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timespan;
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

  const stops = journey.stops || [];
  const currentStopIndex = journey.currentStopIndex || 0;
  const currentStop = stops[currentStopIndex];
  const completedStops = stops.filter((s: JourneyStop) => s.status === 'completed').length;
  const failedStops = stops.filter((s: JourneyStop) => s.status === 'failed').length;
  const progress = stops.length > 0 ? (completedStops / stops.length) * 100 : 0;
  
  // ✅ Sefer tamamlanabilir mi kontrolü - GÜNCELLEME
  const canCompleteJourney = journey.status === 'in_progress' && 
    stops.every((s: JourneyStop) => {
      const status = s.status?.toLowerCase();
      return status === 'completed' || status === 'failed' || status === 'skipped';
    });

  if (stops.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/journeys')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {journey.route?.name || `Sefer #${journey.id}`}
            </h1>
            <p className="text-gray-600">Sefer Detayları</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
          <p className="text-gray-700 font-medium">Bu sefer için durak bulunmuyor</p>
          <p className="text-sm text-gray-600 mt-2">
            Sefer oluşturulmuş ancak rota optimizasyonu yapılmamış olabilir.
          </p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">
              {journey.route?.name || `Sefer #${journey.id}`}
            </h1>
            <p className="text-gray-600">Sefer Detayları</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {journey.status === 'in_progress' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-xs text-yellow-700">
              ⚠️ Test Modu - Normal şartlarda şoför mobil app'ten yapar
            </div>
          )}
          
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
          
          {canCompleteJourney && (
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
          <p className="font-semibold text-gray-900">
            {journey.driver?.fullName || journey.route?.driver?.name || 'Atanmadı'}
          </p>
          {(journey.driver?.phoneNumber || journey.route?.driver?.phone) && (
            <a 
              href={`tel:${journey.driver?.phoneNumber || journey.route?.driver?.phone}`} 
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-1"
            >
              <Phone className="w-3 h-3 mr-1" />
              {journey.driver?.phoneNumber || journey.route?.driver?.phone}
            </a>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Araç</span>
            <Truck className="w-4 h-4 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">
            {journey.route?.vehicle?.plateNumber || 'Atanmadı'}
          </p>
          <p className="text-sm text-gray-500">
            {journey.route?.vehicle?.brand} {journey.route?.vehicle?.model}
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
            {completedStops} tamamlandı, {failedStops} başarısız / {stops.length} toplam durak
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
            <p className="text-2xl font-bold text-gray-900">
              {journey.totalDistance ? journey.totalDistance.toFixed(1) : '0.0'}
            </p>
            <p className="text-sm text-gray-600">km</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {journey.totalDuration ? Math.round(journey.totalDuration / 60) : 0}
            </p>
            <p className="text-sm text-gray-600">saat</p>
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

      {/* Status History - YENİ EKLENEN */}
      {journey.statuses && journey.statuses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900">İşlem Geçmişi</h3>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {journey.statuses
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((status: JourneyStatus) => (
                <div key={status.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          status.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          status.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          status.status === 'Arrived' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {status.status === 'Completed' && 'Tamamlandı'}
                          {status.status === 'Cancelled' && 'Başarısız'}
                          {status.status === 'Arrived' && 'Varış'}
                          {status.status === 'InTransit' && 'Yolda'}
                          {status.status === 'Processing' && 'İşleniyor'}
                          {status.status === 'Delayed' && 'Gecikme'}
                          {status.status === 'OnHold' && 'Beklemede'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(status.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      
                      {status.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Not:</strong> {status.notes}
                        </p>
                      )}
                      
                      {status.failureReason && (
                        <p className="text-sm text-red-600 mt-1">
                          <strong>Başarısızlık Nedeni:</strong> {status.failureReason}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2">
                        {status.signatureBase64 && (
                          <button
                            onClick={() => setViewSignature(status.signatureBase64)}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            İmza görüntüle
                          </button>
                        )}
                        {status.photoBase64 && (
                          <button
                            onClick={() => setViewPhoto(status.photoBase64)}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            Fotoğraf görüntüle
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stops List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">Duraklar ({stops.length})</h3>
        </div>
        <div className="divide-y">
          {stops.map((stop: JourneyStop, index: number) => (
            <div 
              key={stop.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                index === currentStopIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center">
                    {getStopStatusIcon(stop.status)}
                    {index < stops.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs text-gray-500">#{stop.order}</span>
                      <h4 className="font-medium text-gray-900">
                        {stop.routeStop?.customer?.name || 
                         stop.routeStop?.name || 
                         `Durak ${stop.order}`}
                      </h4>
                      {index === currentStopIndex && journey.status === 'in_progress' && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Mevcut
                        </span>
                      )}
                      {stop.status === 'completed' && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Tamamlandı
                        </span>
                      )}
                      {stop.status === 'failed' && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                          Başarısız
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {stop.endAddress || 
                       stop.routeStop?.address || 
                       stop.routeStop?.customer?.address ||
                       'Adres bilgisi yok'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {stop.routeStop?.customer?.phone && (
                        <a 
                          href={`tel:${stop.routeStop.customer.phone}`} 
                          className="flex items-center hover:text-blue-600"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          {stop.routeStop.customer.phone}
                        </a>
                      )}
                      {stop.estimatedArrivalTime && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Tahmini: {formatTimeSpan(stop.estimatedArrivalTime)}
                        </span>
                      )}
                      {stop.distance > 0 && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {stop.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    
                    {stop.routeStop?.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        Not: {stop.routeStop.notes}
                      </p>
                    )}
                    
                    {/* ✅ YENİ - Bu durak için son status notlarını göster */}
                    {(() => {
                      const stopStatuses = journey.statuses?.filter(
                        (s: JourneyStatus) => s.stopId === stop.stopId || s.stopId === stop.id
                      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      
                      const lastStatus = stopStatuses?.[0];
                      if (!lastStatus) return null;
                      
                      return (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          {lastStatus.notes && (
                            <p className="text-gray-600">
                              <strong>Teslimat Notu:</strong> {lastStatus.notes}
                            </p>
                          )}
                          {lastStatus.failureReason && (
                            <p className="text-red-600">
                              <strong>Başarısızlık:</strong> {lastStatus.failureReason}
                            </p>
                          )}
                          {(lastStatus.signatureBase64 || lastStatus.photoBase64) && (
                            <div className="flex items-center space-x-2 mt-1">
                              {lastStatus.signatureBase64 && (
                                <span className="text-green-600">✓ İmza</span>
                              )}
                              {lastStatus.photoBase64 && (
                                <span className="text-green-600">✓ Fotoğraf</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Actions */}
                {journey.status === 'in_progress' && (
                  <>
                    {stop.status === 'pending' && index === currentStopIndex && (
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
                    
                    {stop.status === 'inprogress' && (
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
                  </>
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
              <strong>{selectedStop.routeStop?.customer?.name || selectedStop.routeStop?.name || 'Durak'}</strong> adresine vardınız mı?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {selectedStop.endAddress || selectedStop.routeStop?.address || 'Adres bilgisi yok'}
            </p>
            
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

      {/* Complete Delivery Modal - ✅ GÜNCELLENDİ */}
      {showCompleteModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Teslimatı Tamamla</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.routeStop?.customer?.name || selectedStop.routeStop?.name || 'Durak'}</strong> teslimatı tamamlandı mı?
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
            
            {/* İmza ve Fotoğraf Bölümü */}
            <div className="flex justify-center space-x-4 mb-4">
              <button 
                onClick={() => setShowSignatureModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Edit3 className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">İmza</span>
                {signatureBase64 && (
                  <span className="text-xs text-green-600 mt-1">✓ Eklendi</span>
                )}
              </button>
              
              <button 
                onClick={() => setShowPhotoModal(true)}
                className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Fotoğraf</span>
                {photoBase64 && (
                  <span className="text-xs text-green-600 mt-1">✓ Eklendi</span>
                )}
              </button>
            </div>
            
            {/* Önizleme */}
            {(signatureBase64 || photoBase64) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Ekler:</p>
                <div className="flex space-x-2">
                  {signatureBase64 && (
                    <div className="relative">
                      <img src={signatureBase64} alt="İmza" className="h-16 border rounded" />
                      <button 
                        onClick={() => setSignatureBase64('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {photoBase64 && (
                    <div className="relative">
                      <img src={photoBase64} alt="Fotoğraf" className="h-16 border rounded" />
                      <button 
                        onClick={() => setPhotoBase64('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setDeliveryNotes('');
                  setSignatureBase64('');
                  setPhotoBase64('');
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

      {/* Fail Delivery Modal - ✅ GÜNCELLENDİ */}
      {showFailModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Teslimat Başarısız</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.routeStop?.customer?.name || selectedStop.routeStop?.name || 'Durak'}</strong> teslimatı neden başarısız?
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
            
            {/* ✅ YENİ - Ek not alanı */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ek Notlar (Opsiyonel)
              </label>
              <textarea
                value={failureNotes}
                onChange={(e) => setFailureNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Ek açıklamalar..."
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFailModal(false);
                  setFailureReason('');
                  setFailureNotes('');
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

      {/* ✅ YENİ - İmza Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">İmza Ekle</h2>
            
            <div className="border-2 border-gray-300 rounded-lg mb-4">
              <canvas
                ref={canvasRef}
                width={450}
                height={200}
                className="w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={clearSignature}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Temizle
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ YENİ - Fotoğraf Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Fotoğraf Ekle</h2>
            
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-gray-600">Fotoğraf Seç veya Çek</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG, max 5MB</span>
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ YENİ - İmza Görüntüleme Modal */}
      {viewSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">İmza</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={`data:image/png;base64,${viewSignature}`} 
                alt="İmza" 
                className="w-full"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setViewSignature(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ YENİ - Fotoğraf Görüntüleme Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Teslimat Fotoğrafı</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={`data:image/png;base64,${viewPhoto}`} 
                alt="Teslimat Fotoğrafı" 
                className="w-full"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setViewPhoto(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyDetail;