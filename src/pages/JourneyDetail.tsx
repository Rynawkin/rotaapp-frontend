// src/pages/JourneyDetail.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Eye,
  CheckSquare,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Home,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { Journey, JourneyStop, JourneyStatus } from '@/types';
import { journeyService, CompleteStopDto } from '@/services/journey.service';
import { toast } from 'react-hot-toast';
import signalRService from '@/services/signalr.service';
import { useSignalR, useJourneyTracking } from '@/hooks/useSignalR';
import { api } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Stop detayları için ayrı component
const StopDetailsSection: React.FC<{
  journeyId: number;
  stopId: number;
  stopStatus: string;
  onViewSignature: (url: string) => void;
  onViewPhotos: (photos: any[]) => void;
}> = ({ journeyId, stopId, stopStatus, onViewSignature, onViewPhotos }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [photosChecked, setPhotosChecked] = useState(false);
  
  // Helper function - URL'leri tam path'e çevir
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('data:')) {
      return url;
    }
    
    if (url.includes('cloudinary.com')) {
      return url;
    }
    
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5055';
    return `${baseUrl}${url}`;
  };
  
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await journeyService.getStopDetails(journeyId, stopId);
        setDetails(data);
        
        // Fotoğrafları kontrol et
        if (stopStatus === 'completed') {
          const photos = await journeyService.getStopPhotosForStatus(journeyId, stopId);
          setHasPhotos(photos && photos.length > 0);
        }
        setPhotosChecked(true);
      } catch (error) {
        console.error('Error loading stop details:', error);
        setPhotosChecked(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadDetails();
  }, [journeyId, stopId, stopStatus]);
  
  const handleViewPhotos = async () => {
    if (!hasPhotos) return;
    
    try {
      const photos = await journeyService.getStopPhotosForStatus(journeyId, stopId);
      if (photos && photos.length > 0) {
        const uniquePhotos = photos.filter((photo: any, index: number, self: any[]) =>
          index === self.findIndex((p) => 
            (p.photoUrl || p.PhotoUrl) === (photo.photoUrl || photo.PhotoUrl)
          )
        );
        onViewPhotos(uniquePhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Detaylar yükleniyor...</span>
      </div>
    );
  }
  
  if (!details) return null;
  
  return (
    <>
      {/* Teslim Alan Kişi ve Notlar */}
      <div className="space-y-2 mb-3">
        {details.receiverName && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Teslim Alan:</span>
            <span className="font-medium text-gray-900">{details.receiverName}</span>
          </div>
        )}
        
        {details.notes && (
          <div className="flex items-start gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-500 mt-0.5" />
            <span className="text-gray-600">Teslimat Notu:</span>
            <span className="text-gray-700">{details.notes}</span>
          </div>
        )}
        
        {stopStatus === 'failed' && details.failureReason && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
            <span className="text-red-600">Başarısızlık Nedeni:</span>
            <span className="text-red-700">{details.failureReason}</span>
          </div>
        )}
      </div>
      
      {/* İmza ve Fotoğraf Butonları */}
      <div className="flex items-center gap-3">
        {/* İmza butonu - Sadece imza varsa aktif */}
        <button
          onClick={() => {
            if (details.signatureUrl) {
              let url = getFullImageUrl(details.signatureUrl);
              if (url.includes('cloudinary.com') && !url.includes('/c_')) {
                url = url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
              }
              onViewSignature(url);
            }
          }}
          disabled={!details.signatureUrl}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
            details.signatureUrl 
              ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
              : 'bg-gray-50 opacity-50 cursor-not-allowed'
          }`}
        >
          <Edit3 className={`w-4 h-4 ${details.signatureUrl ? 'text-gray-600' : 'text-gray-400'}`} />
          <span className={details.signatureUrl ? 'text-gray-700' : 'text-gray-400'}>
            İmza {!details.signatureUrl && '(Yok)'}
          </span>
        </button>
        
        {/* Fotoğraf butonu - Sadece completed durumda ve fotoğraf varsa aktif */}
        {stopStatus === 'completed' && photosChecked && (
          <button
            onClick={handleViewPhotos}
            disabled={!hasPhotos}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${
              hasPhotos 
                ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer' 
                : 'bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
          >
            <Camera className={`w-4 h-4 ${hasPhotos ? 'text-gray-600' : 'text-gray-400'}`} />
            <span className={hasPhotos ? 'text-gray-700' : 'text-gray-400'}>
              Fotoğraflar {!hasPhotos && '(Yok)'}
            </span>
          </button>
        )}
      </div>
    </>
  );
};

const JourneyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const journeyId = id ? parseInt(id) : null;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<JourneyStop | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [receiverName, setReceiverName] = useState(''); // YENİ: Teslim alan kişi
  const [failureReason, setFailureReason] = useState('');
  const [failureNotes, setFailureNotes] = useState('');
  const [processingStopId, setProcessingStopId] = useState<number | null>(null);

  // ✅ SignalR hooks kullanımı
  const { isConnected } = useSignalR({
    autoConnect: true,
    onConnected: () => {
      console.log('✅ SignalR connected in JourneyDetail');
    },
    onDisconnected: () => {
      console.log('❌ SignalR disconnected in JourneyDetail');
    },
    onError: (error) => {
      console.error('SignalR error:', error);
    }
  });

  const { subscribeToUpdates } = useJourneyTracking(journeyId);

  // ✅ State'ler - İmza ve Fotoğraf için
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]); // Çoklu fotoğraf için array
  const [signaturePreview, setSignaturePreview] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]); // Çoklu önizleme
  const [isDrawing, setIsDrawing] = useState(false);

  // ✅ Görüntüleme için
  const [viewSignature, setViewSignature] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  // ✅ YENİ: Çoklu fotoğraf galerisi için
  const [journeyPhotos, setJourneyPhotos] = useState<any[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

  // Canvas ve file input ref'leri
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geri dönüş işlevi
  const handleGoBack = () => {
    const fromPath = (location.state as { from?: string })?.from;
    if (fromPath) {
      navigate(fromPath);
    } else {
      navigate('/journeys');
    }
  };

  // ✅ Helper function - URL'leri tam path'e çevir
  const getFullImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    // Eğer zaten tam URL ise (http:// veya https:// ile başlıyorsa) direkt döndür
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Base64 data URL ise direkt döndür
    if (url.startsWith('data:')) {
      return url;
    }

    // Cloudinary URL kontrolü
    if (url.includes('cloudinary.com')) {
      return url;
    }

    // Relative URL ise base URL ekle (legacy support)
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5055';
    return `${baseUrl}${url}`;
  };

  // ✅ DÜZELTİLDİ: SignalR bağlantısı ve event listener'ları
  useEffect(() => {
    if (!journeyId) return;

    let mounted = true;

    const setupSignalR = async () => {
      try {
        // SignalR'a bağlan
        if (!signalRService.getConnectionStatus()) {
          await signalRService.connect();
        }

        // Journey group'a katıl
        await signalRService.joinJourney(journeyId, (data: any) => {
          if (!mounted) return;

          console.log('🔄 Journey update received:', data);

          // Her türlü güncelleme için journey'yi yeniden yükle
          loadJourney();
        });

        console.log('✅ Joined SignalR journey group:', journeyId);

      } catch (error) {
        console.error('SignalR setup error:', error);
      }
    };

    setupSignalR();

    // Cleanup
    return () => {
      mounted = false;
      if (journeyId) {
        signalRService.leaveJourney(journeyId).catch(console.error);
      }
    };
  }, [journeyId]);

  // ✅ DÜZELTİLDİ: Auto-refresh mekanizması
  useEffect(() => {
    if (!journey) return;

    const isActive = journey.status === 'in_progress' ||
      journey.status === 'started' ||
      journey.status === 'preparing';

    if (isActive) {
      const interval = setInterval(() => {
        console.log('⏱️ Auto-refresh journey detail');
        loadJourney();
      }, 5000); // 5 saniyede bir

      return () => clearInterval(interval);
    }
  }, [journey?.status, id]);

  // Initial load
  useEffect(() => {
    if (id) {
      loadJourney();
      loadJourneyPhotos(); // Fotoğrafları da yükle
    }
  }, [id]);

  // Canvas başlangıç ayarları
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

      if (data) {
        setJourney(data);
      } else {
        handleGoBack();
      }
    } catch (error: any) {
      console.error('Error loading journey:', error);
      if (error?.code !== 'ECONNABORTED') {
        handleGoBack();
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ YENİ: Fotoğrafları yükleme fonksiyonu
  const loadJourneyPhotos = async () => {
    if (!id) return;
    
    try {
      const photos = await journeyService.getStopPhotos(id);
      setJourneyPhotos(photos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  // ✅ YENİ: Stop için fotoğrafları yükle
  const loadStopPhotos = async (journeyId: number, stopId: number) => {
    try {
      const photos = await journeyService.getStopPhotosForStatus(journeyId, stopId);
      return photos;
    } catch (error) {
      console.error('Error loading stop photos:', error);
      return [];
    }
  };

  // ✅ Seferi başlat fonksiyonu
  const handleStartJourney = async () => {
    if (!journey) return;

    if (window.confirm('Seferi başlatmak istediğinizden emin misiniz?')) {
      try {
        await journeyService.start(journey.id);
        toast.success('Sefer başlatıldı');
        loadJourney();
      } catch (error: any) {
        console.error('Error starting journey:', error);
        const errorMessage = error.response?.data?.message || 'Sefer başlatılamadı';
        toast.error(errorMessage);
      }
    }
  };

  // İmza fonksiyonları...
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

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        setSignatureFile(file);
        setSignaturePreview(URL.createObjectURL(blob));
        setShowSignatureModal(false);
        toast.success('İmza eklendi');
      }
    }, 'image/png');
  };

  // ✅ YENİ: Çoklu fotoğraf seçimi
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_PHOTOS = 10;
    const currentCount = photoFiles.length;
    const availableSlots = MAX_PHOTOS - currentCount;

    if (availableSlots <= 0) {
      toast.error(`En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
      const file = files[i];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dosyası 5MB'dan büyük`);
        continue;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setPhotoFiles(prev => [...prev, ...newFiles]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
    setShowPhotoModal(false);
    toast.success(`${newFiles.length} fotoğraf eklendi`);
  };

  // ✅ YENİ: Fotoğraf silme
  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handler'lar...
  const handleCheckIn = async () => {
    if (!journey || !selectedStop) return;

    setProcessingStopId(parseInt(selectedStop.id));
    try {
      console.log('Check-in başlatılıyor:', selectedStop.id);

      await journeyService.checkInStop(journey.id, selectedStop.id);

      setJourney(prev => {
        if (!prev) return prev;

        const updatedStops = prev.stops?.map(s =>
          s.id === selectedStop.id
            ? {
              ...s,
              status: 'InProgress' as any,
              checkInTime: new Date().toISOString() as any
            }
            : s
        );

        return {
          ...prev,
          stops: updatedStops,
          currentStopIndex: updatedStops?.findIndex(s =>
            s.status === 'Pending' || s.status === 'InProgress'
          ) || 0
        };
      });

      setShowCheckInModal(false);
      setSelectedStop(null);
      toast.success('Check-in başarılı');

      // Journey'yi yeniden yükle
      setTimeout(() => loadJourney(), 1000);

    } catch (error) {
      console.error('Check-in hatası:', error);
      toast.error('Check-in işlemi başarısız!');
      loadJourney();
    } finally {
      setProcessingStopId(null);
    }
  };

  // ✅ YENİ: Çoklu fotoğraf destekli complete - Teslim alan eklendi
  const handleComplete = async () => {
    if (!journey || !selectedStop) return;

    // Teslim alan kişi kontrolü
    if (!receiverName || receiverName.trim().length < 3) {
      toast.error('Teslim alan kişinin adını girmelisiniz (en az 3 karakter)');
      return;
    }

    setProcessingStopId(parseInt(selectedStop.id));
    try {
      const formData = new FormData();
      if (deliveryNotes) {
        formData.append('notes', deliveryNotes);
      }

      // Teslim alan kişi eklendi
      formData.append('receiverName', receiverName);

      if (signatureFile) {
        formData.append('signature', signatureFile);
      }

      // Çoklu fotoğraf ekleme
      photoFiles.forEach((file, index) => {
        if (index === 0) {
          // İlk fotoğraf için backward compatibility
          formData.append('photo', file);
        } else {
          // Diğer fotoğraflar
          formData.append('photos', file);
        }
      });

      await journeyService.completeStopWithFiles(journey.id, selectedStop.id, formData);

      setJourney(prev => {
        if (!prev) return prev;

        const updatedStops = prev.stops?.map(s =>
          s.id === selectedStop.id
            ? {
              ...s,
              status: 'Completed' as any,
              checkOutTime: new Date().toISOString() as any
            }
            : s
        );

        const completedCount = updatedStops?.filter(s =>
          s.status === 'Completed' || s.status === 'Failed'
        ).length || 0;

        return {
          ...prev,
          stops: updatedStops,
          route: prev.route ? {
            ...prev.route,
            completedDeliveries: completedCount
          } : prev.route
        };
      });

      setShowCompleteModal(false);
      setSelectedStop(null);
      setDeliveryNotes('');
      setReceiverName(''); // Reset
      setSignatureFile(null);
      setPhotoFiles([]);
      setSignaturePreview('');
      setPhotoPreviews([]);

      toast.success('Teslimat tamamlandı');

      // Journey'yi ve fotoğrafları yeniden yükle
      setTimeout(() => {
        loadJourney();
        loadJourneyPhotos();
      }, 1000);

    } catch (error) {
      console.error('Error completing stop:', error);
      toast.error('Teslimat tamamlanamadı');
      loadJourney();
    } finally {
      setProcessingStopId(null);
    }
  };

  const handleFail = async () => {
    if (!journey || !selectedStop || !failureReason) return;

    setProcessingStopId(parseInt(selectedStop.id));
    try {
      await journeyService.failStop(journey.id, selectedStop.id, failureReason, failureNotes);

      setJourney(prev => {
        if (!prev) return prev;

        const updatedStops = prev.stops?.map(s =>
          s.id === selectedStop.id
            ? { ...s, status: 'Failed' as any }
            : s
        );

        return {
          ...prev,
          stops: updatedStops
        };
      });

      setShowFailModal(false);
      setSelectedStop(null);
      setFailureReason('');
      setFailureNotes('');

      toast.success('Durak başarısız olarak işaretlendi');

      // Journey'yi yeniden yükle
      setTimeout(() => loadJourney(), 1000);

    } catch (error) {
      console.error('Error failing stop:', error);
      toast.error('İşlem başarısız');
      loadJourney();
    } finally {
      setProcessingStopId(null);
    }
  };

  const handleCompleteJourney = async () => {
    if (!journey) return;
    if (window.confirm('Seferi tamamlamak istediğinizden emin misiniz?')) {
      try {
        await journeyService.finish(journey.id);
        toast.success('Sefer tamamlandı');
        handleGoBack();
      } catch (error: any) {
        console.error('Error completing journey:', error);
        const errorMessage = error.response?.data?.message || 'Sefer tamamlanamadı';
        toast.error(errorMessage);
      }
    }
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!journey) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Başlık
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55); // gray-800
    doc.text('Sefer Detay Raporu', pageWidth / 2, 20, { align: 'center' });

    // Sefer Bilgileri
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // gray-500
    doc.text(`Sefer: ${journey.name || journey.route?.name || `#${journey.id}`}`, 14, 35);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 42);

    let yPos = 55;

    // Genel Bilgiler Tablosu
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Genel Bilgiler', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Özellik', 'Değer']],
      body: [
        ['Sürücü', journey.driver?.fullName || journey.driver?.name || journey.route?.driver?.name || '-'],
        ['Araç', `${journey.route?.vehicle?.plateNumber || journey.vehicle?.plateNumber || '-'}`],
        ['Durum',
          journey.status === 'preparing' ? 'Hazırlanıyor' :
          journey.status === 'planned' ? 'Planlandı' :
          journey.status === 'started' ? 'Başladı' :
          journey.status === 'in_progress' ? 'Devam Ediyor' :
          journey.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'
        ],
        ['Toplam Mesafe', `${journey.totalDistance?.toFixed(1) || 0} km`],
        ['Toplam Süre', `${journey.totalDuration ? Math.round(journey.totalDuration / 60) : 0} saat`],
        ['Başarılı Teslimat', `${normalStops.filter((s: JourneyStop) => s.status?.toLowerCase() === 'completed').length}`],
        ['Başarısız Teslimat', `${normalStops.filter((s: JourneyStop) => s.status?.toLowerCase() === 'failed').length}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Duraklar Tablosu
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Duraklar', 14, yPos);
    yPos += 5;

    const stopsData = normalStops.map((stop: JourneyStop, index: number) => {
      const statusLower = stop.status?.toLowerCase() || 'pending';
      const statusText =
        statusLower === 'completed' ? 'Tamamlandı' :
        statusLower === 'failed' ? 'Başarısız' :
        statusLower === 'inprogress' || statusLower === 'in_progress' ? 'Devam Ediyor' :
        'Bekliyor';

      // Süre hesaplama
      let duration = '-';
      if (stop.checkInTime && stop.checkOutTime) {
        const checkIn = new Date(stop.checkInTime);
        const checkOut = new Date(stop.checkOutTime);
        const durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
        duration = durationMinutes > 0 ? `${durationMinutes} dk` : '-';
      }

      return [
        stop.order.toString(),
        stop.routeStop?.customer?.name || stop.routeStop?.name || `Durak ${stop.order}`,
        stop.endAddress || stop.routeStop?.address || stop.routeStop?.customer?.address || '-',
        stop.estimatedArrivalTime ? formatTimeSpan(stop.estimatedArrivalTime) : '-',
        stop.checkInTime ? formatTime(stop.checkInTime) : '-',
        duration,
        statusText
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Müşteri', 'Adres', 'Plan Varış', 'Gerç. Varış', 'Süre', 'Durum']],
      body: stopsData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 25 },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Kaydet
    const fileName = `sefer_${journey.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('PDF indirildi');
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!journey) return;

    // Genel Bilgiler
    const generalInfo = [
      ['SEFER DETAY RAPORU'],
      [],
      ['Sefer', journey.name || journey.route?.name || `#${journey.id}`],
      ['Tarih', new Date().toLocaleDateString('tr-TR')],
      ['Sürücü', journey.driver?.fullName || journey.driver?.name || journey.route?.driver?.name || '-'],
      ['Araç', `${journey.route?.vehicle?.plateNumber || journey.vehicle?.plateNumber || '-'}`],
      ['Durum',
        journey.status === 'preparing' ? 'Hazırlanıyor' :
        journey.status === 'planned' ? 'Planlandı' :
        journey.status === 'started' ? 'Başladı' :
        journey.status === 'in_progress' ? 'Devam Ediyor' :
        journey.status === 'completed' ? 'Tamamlandı' : 'İptal Edildi'
      ],
      ['Toplam Mesafe', `${journey.totalDistance?.toFixed(1) || 0} km`],
      ['Toplam Süre', `${journey.totalDuration ? Math.round(journey.totalDuration / 60) : 0} saat`],
      ['Başarılı Teslimat', `${normalStops.filter((s: JourneyStop) => s.status?.toLowerCase() === 'completed').length}`],
      ['Başarısız Teslimat', `${normalStops.filter((s: JourneyStop) => s.status?.toLowerCase() === 'failed').length}`],
      [],
      ['DURAKLAR'],
      ['Sıra', 'Müşteri', 'Adres', 'Telefon', 'Plan. Varış', 'Gerç. Varış', 'Plan. Tamamlanma', 'Gerç. Tamamlanma', 'Planlanan Süre', 'Gerçekleşen Süre', 'Durum']
    ];

    // Duraklar
    const stopsData = normalStops.map((stop: JourneyStop) => {
      const statusLower = stop.status?.toLowerCase() || 'pending';
      const statusText =
        statusLower === 'completed' ? 'Tamamlandı' :
        statusLower === 'failed' ? 'Başarısız' :
        statusLower === 'inprogress' || statusLower === 'in_progress' ? 'Devam Ediyor' :
        'Bekliyor';

      // Planlanan süre
      let plannedDuration = '-';
      if (stop.estimatedArrivalTime && stop.estimatedDepartureTime) {
        const arrivalParts = stop.estimatedArrivalTime.split(':');
        const departureParts = stop.estimatedDepartureTime.split(':');
        const arrivalMinutes = parseInt(arrivalParts[0]) * 60 + parseInt(arrivalParts[1]);
        const departureMinutes = parseInt(departureParts[0]) * 60 + parseInt(departureParts[1]);
        const durationMinutes = departureMinutes - arrivalMinutes;
        plannedDuration = durationMinutes > 0 ? `${durationMinutes} dk` : '-';
      }

      // Gerçekleşen süre
      let actualDuration = '-';
      if (stop.checkInTime && stop.checkOutTime) {
        const checkIn = new Date(stop.checkInTime);
        const checkOut = new Date(stop.checkOutTime);
        const durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
        actualDuration = durationMinutes > 0 ? `${durationMinutes} dk` : '-';
      }

      return [
        stop.order,
        stop.routeStop?.customer?.name || stop.routeStop?.name || `Durak ${stop.order}`,
        stop.endAddress || stop.routeStop?.address || stop.routeStop?.customer?.address || '-',
        stop.routeStop?.customer?.phone || '-',
        stop.estimatedArrivalTime ? formatTimeSpan(stop.estimatedArrivalTime) : '-',
        stop.checkInTime ? formatTime(stop.checkInTime) : '-',
        stop.estimatedDepartureTime ? formatTimeSpan(stop.estimatedDepartureTime) : '-',
        stop.checkOutTime ? formatTime(stop.checkOutTime) : '-',
        plannedDuration,
        actualDuration,
        statusText
      ];
    });

    const allData = [...generalInfo, ...stopsData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Column widths
    ws['!cols'] = [
      { wch: 8 },  // Sıra
      { wch: 30 }, // Müşteri
      { wch: 40 }, // Adres
      { wch: 15 }, // Telefon
      { wch: 12 }, // Plan. Varış
      { wch: 12 }, // Gerç. Varış
      { wch: 15 }, // Plan. Tamamlanma
      { wch: 15 }, // Gerç. Tamamlanma
      { wch: 15 }, // Planlanan Süre
      { wch: 15 }, // Gerçekleşen Süre
      { wch: 15 }, // Durum
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sefer Detay');

    // Save
    const fileName = `sefer_${journey.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel indirildi');
  };

  // ✅ DÜZELTİLDİ: Case-insensitive status kontrolü
  const getStopStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inprogress':
      case 'in_progress':
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

  const formatETA = (eta?: string) => {
    if (!eta) return '-';
    return eta;
  };

  // Fotoğraf galerisi handler'ları
  const handleViewPhotos = (photos: any[]) => {
    setJourneyPhotos(photos);
    setCurrentPhotoIndex(0);
    setShowPhotoGallery(true);
  };

  const handleViewSignature = (url: string) => {
    setViewSignature(url);
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

  // ✅ YENİ: Stops'ları normal ve excluded olarak ayır
  const allStops = journey.stops || [];
  const normalStops = allStops.filter((s: JourneyStop) => s.order > 0 && !s.isExcluded);
  const excludedStops = allStops.filter((s: JourneyStop) => s.order === 0 || s.isExcluded);

  const currentStopIndex = journey.currentStopIndex || 0;
  const currentStop = normalStops[currentStopIndex];

  // Progress hesaplaması - sadece normal stops için
  const completedStops = normalStops.filter((s: JourneyStop) =>
    s.status?.toLowerCase() === 'completed'
  ).length;

  const failedStops = normalStops.filter((s: JourneyStop) =>
    s.status?.toLowerCase() === 'failed'
  ).length;

  // Toplam işlenen duraklar (başarılı + başarısız)
  const totalProcessedStops = completedStops + failedStops;
  const overallProgress = normalStops.length > 0
    ? (totalProcessedStops / normalStops.length) * 100
    : 0;

  // Başarı oranları
  const successRate = normalStops.length > 0
    ? (completedStops / normalStops.length) * 100
    : 0;

  const failureRate = normalStops.length > 0
    ? (failedStops / normalStops.length) * 100
    : 0;

  // Journey durumlarını kontrol et
  const isJourneyStarted = journey.status === 'in_progress' || journey.status === 'started';
  const isJourneyPlanned = journey.status === 'planned' || journey.status === 'preparing';

  const canCompleteJourney = isJourneyStarted &&
    normalStops.every((s: JourneyStop) => {
      const statusLower = s.status?.toLowerCase() || 'pending';
      return statusLower === 'completed' || statusLower === 'failed' || statusLower === 'skipped';
    });

  if (normalStops.length === 0 && excludedStops.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {journey.name || journey.route?.name || `Sefer #${journey.id}`}
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
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {journey.name || journey.route?.name || `Sefer #${journey.id}`}
            </h1>
            <p className="text-gray-600">Sefer Detayları</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* SignalR Connection Status */}
          <div className={`flex items-center px-3 py-1 rounded-lg text-xs ${isConnected
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Real-time bağlantı aktif
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Bağlantı bekleniyor...
              </>
            )}
          </div>

          {/* Mobile App Bilgilendirmesi */}
          {isJourneyStarted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-xs text-blue-700">
              📱 Teslimat işlemleri mobil uygulama üzerinden yapılır
            </div>
          )}

          {/* Export Butonları */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              title="PDF olarak indir"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              title="Excel olarak indir"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>

          {/* Seferi Başlat Butonu */}
          {isJourneyPlanned && (
            <button
              onClick={handleStartJourney}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Seferi Başlat
            </button>
          )}

          {/* Seferi Tamamla Butonu */}
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
            {journey.driver?.fullName || journey.driver?.name || journey.route?.driver?.name || 'Atanmadı'}
          </p>
          {(journey.driver?.phoneNumber || journey.driver?.phone || journey.route?.driver?.phone) && (
            <a
              href={`tel:${journey.driver?.phoneNumber || journey.driver?.phone || journey.route?.driver?.phone}`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-1"
            >
              <Phone className="w-3 h-3 mr-1" />
              {journey.driver?.phoneNumber || journey.driver?.phone || journey.route?.driver?.phone}
            </a>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Araç</span>
            <Truck className="w-4 h-4 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-900">
            {journey.route?.vehicle?.plateNumber || journey.vehicle?.plateNumber || 'Atanmadı'}
          </p>
          <p className="text-sm text-gray-500">
            {journey.route?.vehicle?.brand || journey.vehicle?.brand} {journey.route?.vehicle?.model || journey.vehicle?.model}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Durum</span>
            <Navigation className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            {isJourneyStarted && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            <p className="font-semibold text-gray-900">
              {journey.status === 'preparing' && 'Hazırlanıyor'}
              {journey.status === 'planned' && 'Planlandı'}
              {journey.status === 'started' && 'Başladı'}
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

      {/* Progress Bar - DÜZELTİLDİ: İki renkli */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">İlerleme Durumu</h3>
          <span className="text-sm text-gray-600">
            {completedStops} başarılı, {failedStops} başarısız / {normalStops.length} aktif durak
            {excludedStops.length > 0 && ` (${excludedStops.length} kaldırıldı)`}
          </span>
        </div>

        {/* ✅ YENİ: İki renkli progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          {/* Başarılı duraklar - Yeşil */}
          {successRate > 0 && (
            <div
              className="absolute h-full bg-green-500 transition-all"
              style={{
                width: `${successRate}%`,
                left: 0
              }}
            />
          )}

          {/* Başarısız duraklar - Kırmızı */}
          {failureRate > 0 && (
            <div
              className="absolute h-full bg-red-500 transition-all"
              style={{
                width: `${failureRate}%`,
                left: `${successRate}%`
              }}
            />
          )}
        </div>

        {/* İstatistikler */}
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
            <p className="text-2xl font-bold text-green-600">{completedStops}</p>
            <p className="text-sm text-gray-600">Başarılı</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{failedStops}</p>
            <p className="text-sm text-gray-600">Başarısız</p>
          </div>
        </div>
      </div>

      {/* ✅ YENİ: Excluded Stops Section */}
      {excludedStops.length > 0 && (
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-200">
          <div className="p-6 border-b border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-900">
                Teslimat Saatine Uyum Sağlamadığı İçin Kaldırılan Duraklar ({excludedStops.length})
              </h3>
            </div>
            <p className="text-sm text-red-700 mt-2">
              Bu duraklar zaman penceresi kısıtlamaları nedeniyle rotadan çıkarılmıştır
            </p>
          </div>
          <div className="divide-y divide-red-200">
            {excludedStops.map((stop: JourneyStop) => (
              <div key={stop.id} className="p-4 hover:bg-red-100 transition-colors">
                <div className="flex items-start space-x-4">
                  <XCircle className="w-5 h-5 text-red-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {stop.routeStop?.customer?.name ||
                        stop.routeStop?.name ||
                        'Müşteri'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {stop.endAddress ||
                        stop.routeStop?.address ||
                        stop.routeStop?.customer?.address ||
                        'Adres bilgisi yok'}
                    </p>
                    {stop.routeStop?.customer?.timeWindowStart && (
                      <p className="text-xs text-red-600 mt-2">
                        Teslimat penceresi: {stop.routeStop.customer.timeWindowStart} - {stop.routeStop.customer.timeWindowEnd}
                      </p>
                    )}
                    {stop.notes && (
                      <p className="text-sm text-red-700 mt-1 italic">
                        Kaldırılma nedeni: {stop.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stops List - Sadece normal stops */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-gray-900">Aktif Duraklar ({normalStops.length})</h3>
        </div>
        <div className="divide-y">
          {/* BAŞLANGIÇ DEPOSU - EN BAŞA EKLENDİ */}
          {journey.route?.depot && (
            <div className="p-4 bg-blue-50 border-b-2 border-blue-200">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-3 flex-shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-blue-900">
                      🏭 Başlangıç Deposu
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                      Başlangıç
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    {journey.route.depot.name} - {journey.route.depot.address}
                  </p>
                  {journey.route.startDetails?.plannedStartTime && (
                    <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded">
                      <div className="text-xs font-medium text-blue-800 mb-1">
                        Planlanan Çıkış Saati
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700">Depodan Çıkış:</span>
                        <span className="font-bold text-blue-900 text-sm">
                          {formatTimeSpan(journey.route.startDetails.plannedStartTime)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {normalStops.map((stop: JourneyStop, index: number) => {
            const stopStatusLower = stop.status?.toLowerCase() || 'pending';

            return (
              <div
                key={stop.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${index === currentStopIndex ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-6">
                  {/* Sol taraf - Müşteri bilgileri */}
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      {getStopStatusIcon(stop.status)}
                      {index < normalStops.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap">
                        <span className="text-xs text-gray-500">#{stop.order}</span>
                        <h4 className="font-medium text-gray-900">
                          {stop.routeStop?.customer?.name ||
                            stop.routeStop?.name ||
                            `Durak ${stop.order}`}
                        </h4>
                        {index === currentStopIndex && isJourneyStarted && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Mevcut
                          </span>
                        )}
                        {stopStatusLower === 'completed' && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            Tamamlandı
                          </span>
                        )}
                        {stopStatusLower === 'failed' && (
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

                      <div className="flex items-center gap-3 text-sm mb-2">
                        {stop.routeStop?.customer?.phone && (
                          <a
                            href={`tel:${stop.routeStop.customer.phone}`}
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            {stop.routeStop.customer.phone}
                          </a>
                        )}
                        {stop.distance > 0 && (
                          <span className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {stop.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>

                      {stop.routeStop?.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Not: {stop.routeStop.notes}
                        </p>
                      )}

                      {/* ✅ DURAK TAMAMLANDIYSA DETAYLARI GÖSTER */}
                      {(stopStatusLower === 'completed' || stopStatusLower === 'failed') && journey && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <StopDetailsSection
                            journeyId={journey.id}
                            stopId={parseInt(stop.id)}
                            stopStatus={stopStatusLower}
                            onViewSignature={handleViewSignature}
                            onViewPhotos={handleViewPhotos}
                          />
                        </div>
                      )}

                      {/* Actions - Sadece sefer başlatıldıysa göster */}
                      {isJourneyStarted && (
                        <div className="mt-3">
                          {stopStatusLower === 'pending' && index === currentStopIndex && (
                            <button
                              onClick={() => {
                                setSelectedStop(stop);
                                setShowCheckInModal(true);
                              }}
                              disabled={processingStopId === parseInt(stop.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {processingStopId === parseInt(stop.id) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckSquare className="w-4 h-4 mr-2" />
                              )}
                              Check-in
                            </button>
                          )}

                          {(stopStatusLower === 'inprogress' || stopStatusLower === 'in_progress') && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStop(stop);
                                  setShowCompleteModal(true);
                                }}
                                disabled={processingStopId === parseInt(stop.id)}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {processingStopId === parseInt(stop.id) ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Tamamla
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStop(stop);
                                  setShowFailModal(true);
                                }}
                                disabled={processingStopId === parseInt(stop.id)}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Başarısız
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sağ taraf - Zaman bilgileri */}
                  {(stop.estimatedArrivalTime || stop.estimatedDepartureTime || stop.checkInTime || stop.checkOutTime) && (
                    <div className="flex-shrink-0" style={{ width: '580px' }}>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <h5 className="text-xs font-semibold text-blue-900 uppercase">Zaman Takibi</h5>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {/* Varış Saati */}
                          {(stop.estimatedArrivalTime || stop.checkInTime) && (
                            <div className="bg-white rounded-lg p-2.5 shadow-sm">
                              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Varış Saati</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Planlanan</div>
                                  <div className="text-sm font-bold text-blue-700">
                                    {stop.estimatedArrivalTime ? formatTimeSpan(stop.estimatedArrivalTime) : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Gerçekleşen</div>
                                  <div className="text-sm font-bold text-green-700">
                                    {stop.checkInTime ? formatTime(stop.checkInTime) : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tamamlanma Saati */}
                          {(stop.estimatedDepartureTime || stop.checkOutTime) && (
                            <div className="bg-white rounded-lg p-2.5 shadow-sm">
                              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Tamamlanma Saati</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Planlanan</div>
                                  <div className="text-sm font-bold text-blue-700">
                                    {stop.estimatedDepartureTime ? formatTimeSpan(stop.estimatedDepartureTime) : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Gerçekleşen</div>
                                  <div className="text-sm font-bold text-green-700">
                                    {stop.checkOutTime ? formatTime(stop.checkOutTime) : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Durakta Geçirilen Süre */}
                          {((stop.estimatedArrivalTime && stop.estimatedDepartureTime) || stop.checkOutTime) && (
                            <div className="bg-white rounded-lg p-2.5 shadow-sm">
                              <div className="text-xs font-semibold text-gray-700 mb-2 text-center">Durakta Geçirilen Süre</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Planlanan</div>
                                  <div className="text-sm font-bold text-blue-700">
                                    {stop.estimatedArrivalTime && stop.estimatedDepartureTime ? (() => {
                                      const arrivalParts = stop.estimatedArrivalTime.split(':');
                                      const departureParts = stop.estimatedDepartureTime.split(':');
                                      const arrivalMinutes = parseInt(arrivalParts[0]) * 60 + parseInt(arrivalParts[1]);
                                      const departureMinutes = parseInt(departureParts[0]) * 60 + parseInt(departureParts[1]);
                                      const durationMinutes = departureMinutes - arrivalMinutes;
                                      return durationMinutes > 0 ? `${durationMinutes} dk` : '-';
                                    })() : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Gerçekleşen</div>
                                  <div className="text-sm font-bold text-green-700">
                                    {stop.checkInTime && stop.checkOutTime ? (() => {
                                      const checkIn = new Date(stop.checkInTime);
                                      const checkOut = new Date(stop.checkOutTime);
                                      const durationMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));
                                      return durationMinutes > 0 ? `${durationMinutes} dk` : '-';
                                    })() : stop.checkOutTime ? '0 dk' : '-'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Depo Dönüş - SON DURAKTAN SONRA EKLENEN */}
        {journey.route?.optimized && journey.route?.endDetails && journey.route?.endDetails.estimatedArrivalTime && (
          <div className="p-4 bg-green-50 border-t-2 border-green-200">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-semibold text-sm mr-3 flex-shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-green-900">
                    🏭 Depoya Dönüş
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    Son Durak
                  </span>
                </div>
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                  <div className="text-xs font-medium text-green-800 mb-1">
                    Tahmini Depo Varış Saati
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Depoya Varış:</span>
                    <span className="font-bold text-green-900 text-sm">
                      {formatETA(journey.route.endDetails.estimatedArrivalTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS - Geri kalan modal'lar aynı kalacak */}

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
                onClick={() => {
                  setShowCheckInModal(false);
                  setSelectedStop(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCheckIn}
                disabled={processingStopId !== null}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processingStopId !== null && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Evet, Vardım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Delivery Modal - ✅ YENİ: Teslim alan kişi eklendi */}
      {showCompleteModal && selectedStop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Teslimatı Tamamla</h2>
            <p className="text-gray-600 mb-4">
              <strong>{selectedStop.routeStop?.customer?.name || selectedStop.routeStop?.name || 'Durak'}</strong> teslimatı tamamlandı mı?
            </p>

            {/* ✅ YENİ: Teslim Alan Kişi */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teslim Alan Kişi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ad Soyad (Örn: Ahmet Yılmaz)"
              />
              {receiverName.trim().length > 0 && receiverName.trim().length < 3 && (
                <p className="text-xs text-red-500 mt-1">En az 3 karakter girmelisiniz</p>
              )}
            </div>

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
            <div className="mb-4">
              <div className="flex justify-center space-x-4 mb-4">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Edit3 className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">İmza</span>
                  {signaturePreview && (
                    <span className="text-xs text-green-600 mt-1">✓ Eklendi</span>
                  )}
                </button>

                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Fotoğraf ({photoFiles.length}/10)
                  </span>
                  {photoFiles.length > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      ✓ {photoFiles.length} fotoğraf
                    </span>
                  )}
                </button>
              </div>

              {/* Önizleme */}
              {(signaturePreview || photoPreviews.length > 0) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Ekler:</p>
                  <div className="flex flex-wrap gap-2">
                    {signaturePreview && (
                      <div className="relative">
                        <img src={signaturePreview} alt="İmza" className="h-16 border rounded" />
                        <button
                          onClick={() => {
                            setSignatureFile(null);
                            setSignaturePreview('');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Fotoğraf ${index + 1}`} className="h-16 border rounded" />
                        <button
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tr">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedStop(null);
                  setDeliveryNotes('');
                  setReceiverName('');
                  setSignatureFile(null);
                  setPhotoFiles([]);
                  setSignaturePreview('');
                  setPhotoPreviews([]);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleComplete}
                disabled={processingStopId !== null || !receiverName.trim() || receiverName.trim().length < 3}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processingStopId !== null && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Modal */}
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
                  setSelectedStop(null);
                  setFailureReason('');
                  setFailureNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleFail}
                disabled={!failureReason || processingStopId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {processingStopId !== null && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Başarısız Olarak İşaretle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* İmza Modal */}
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

      {/* ✅ YENİ: Çoklu Fotoğraf Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Fotoğraf Ekle ({photoFiles.length}/10)
            </h2>

            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-gray-600">Fotoğraf Seç veya Çek</span>
                <span className="text-xs text-gray-500 mt-1">
                  JPG, PNG, max 5MB - Birden fazla seçebilirsiniz
                </span>
              </button>
            </div>

            {photoFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Seçilen fotoğraflar:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewers - ✅ DÜZELTİLDİ */}
      {viewSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">İmza</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={viewSignature}
                alt="İmza"
                className="w-full"
                onError={(e) => {
                  console.error('İmza yüklenemedi:', viewSignature);
                  // Cloudinary URL ise thumbnail versiyonunu dene
                  if (viewSignature.includes('cloudinary.com')) {
                    const thumbnailUrl = viewSignature.replace('/upload/', '/upload/c_thumb,w_400,h_200/');
                    if (e.currentTarget.src !== thumbnailUrl) {
                      e.currentTarget.src = thumbnailUrl;
                      return;
                    }
                  }
                  // Fallback görsel
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iNTAiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTQiPkltemEgeXVrbGVuZW1lZGk8L3RleHQ+PC9zdmc+';
                }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <a
                href={viewSignature}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tam Boyut
              </a>
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

      {viewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Teslimat Fotoğrafı</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={viewPhoto}
                alt="Teslimat Fotoğrafı"
                className="w-full"
                onError={(e) => {
                  console.error('Fotoğraf yüklenemedi:', viewPhoto);
                  // Cloudinary URL ise thumbnail versiyonunu dene
                  if (viewPhoto.includes('cloudinary.com')) {
                    const thumbnailUrl = viewPhoto.replace('/upload/', '/upload/c_limit,w_800,h_600/');
                    if (e.currentTarget.src !== thumbnailUrl) {
                      e.currentTarget.src = thumbnailUrl;
                      return;
                    }
                  }
                  // Fallback görsel
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iNTAiIGZpbGw9IiM5OTkiIGZvbnQtc2l6ZT0iMTQiPkZvdG/En3JhZiB5w7xrbGVuZW1lZGk8L3RleHQ+PC9zdmc+';
                }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <a
                href={viewPhoto}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Tam Boyut
              </a>
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

      {/* ✅ YENİ: Fotoğraf Galerisi Modal - Duplicate düzeltmesi */}
      {showPhotoGallery && journeyPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Sol ok */}
            {currentPhotoIndex > 0 && (
              <button
                onClick={() => setCurrentPhotoIndex(prev => prev - 1)}
                className="absolute left-4 z-10 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}
            
            {/* Fotoğraf */}
            <div className="max-w-4xl max-h-[80vh] relative">
              <img
                src={getFullImageUrl(journeyPhotos[currentPhotoIndex].photoUrl || journeyPhotos[currentPhotoIndex].PhotoUrl || journeyPhotos[currentPhotoIndex])}
                alt={`Teslimat fotoğrafı ${currentPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const url = journeyPhotos[currentPhotoIndex].photoUrl || journeyPhotos[currentPhotoIndex].PhotoUrl || journeyPhotos[currentPhotoIndex];
                  if (url.includes('cloudinary.com')) {
                    const thumbnailUrl = url.replace('/upload/', '/upload/c_limit,w_800,h_600/');
                    if (e.currentTarget.src !== thumbnailUrl) {
                      e.currentTarget.src = thumbnailUrl;
                    }
                  }
                }}
              />
              
              {/* Fotoğraf açıklaması */}
              {journeyPhotos[currentPhotoIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                  <p>{journeyPhotos[currentPhotoIndex].caption}</p>
                </div>
              )}
            </div>
            
            {/* Sağ ok */}
            {currentPhotoIndex < journeyPhotos.length - 1 && (
              <button
                onClick={() => setCurrentPhotoIndex(prev => prev + 1)}
                className="absolute right-4 z-10 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}
            
            {/* Kapat butonu */}
            <button
              onClick={() => {
                setShowPhotoGallery(false);
                setJourneyPhotos([]);
                setCurrentPhotoIndex(0);
              }}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Sayaç */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
              {currentPhotoIndex + 1} / {journeyPhotos.length}
            </div>
            
            {/* Thumbnail strip */}
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-black bg-opacity-50 rounded-lg max-w-[80vw] overflow-x-auto">
              {journeyPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    index === currentPhotoIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getFullImageUrl(photo.thumbnailUrl || photo.ThumbnailUrl || photo.photoUrl || photo.PhotoUrl || photo)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyDetail;