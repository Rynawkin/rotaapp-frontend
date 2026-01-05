import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Calendar,
  User,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Loader2,
  Play,
  Copy,
  Phone,
  Mail,
  Star,
  Timer,
  Package,
  Home,
  Map,
  Zap,
  FileText,
  Download,
  Eye,
  Share2,
  ArrowRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import MapComponent from '@/components/maps/MapComponent';
import LeafletMapComponent from '@/components/maps/LeafletMapComponent';
import { Route, RouteStop, Customer } from '@/types';
import { LatLng, MarkerData } from '@/types/maps';
import { routeService } from '@/services/route.service';
import { customerService } from '@/services/customer.service';
import { journeyService } from '@/services/journey.service';
import { googleMapsService } from '@/services/googleMapsService';
import { depotService } from '@/services/depot.service';

// Google Maps libraries
const libraries: ("places" | "drawing" | "geometry")[] = ['places', 'geometry'];

// Dakikayı saat ve dakika formatına çevir
const formatDuration = (totalMinutes: number): string => {
  if (!totalMinutes || totalMinutes === 0) return '0 dakika';
  if (totalMinutes < 60) {
    return `${totalMinutes} dakika`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} saat`;
  }
  return `${hours} saat ${minutes} dakika`;
};

// ETA formatını düzelt (HH:mm:ss veya HH:mm formatında göster)
const formatETA = (etaString?: string): string => {
  if (!etaString) return '';
  // Backend'den HH:mm:ss formatında geliyor, sadece HH:mm göster
  return etaString.substring(0, 5);
};

const RouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [depot, setDepot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MarkerData[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);

  // Google Maps Loader Hook
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
    id: 'google-map-script'
  });

  useEffect(() => {
    loadData();
  }, [id]);

  // Route veya customers değiştiğinde marker'ları güncelle
  useEffect(() => {
    if (route && route.stops && customers.length > 0) {
      const markers = generateMapMarkers();
      setMapMarkers(markers);

      // Google Maps yüklendiyse ve depot varsa directions'ı yükle (optimized kontrolü kaldırıldı)
      if (isGoogleMapsLoaded && depot && route.stops.length > 0) {
        loadRouteOnMap(route);
      }
    }
  }, [route, customers, depot, isGoogleMapsLoaded]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Backend'den customer bilgileriyle birlikte route'u al
      const routeData = await routeService.getById(id);

      // Customer listesini de al (backup için)
      const customersData = await customerService.getAll();

      // Depot bilgisini al
      let depotData = null;
      if (routeData.depotId) {
        try {
          depotData = await depotService.getById(routeData.depotId);
        } catch (error) {
          console.warn('Depot yüklenemedi, varsayılan kullanılacak:', error);
        }
      }

      // Eğer backend'den customer gelmemişse, customerId ile eşleştir
      if (routeData && routeData.stops) {
        routeData.stops = routeData.stops.map(stop => {
          // Eğer stop'ta customer yoksa ve customerId varsa, customersData'dan bul
          if (!stop.customer && stop.customerId) {
            const customer = customersData.find(c => c.id === stop.customerId);
            return {
              ...stop,
              customer: customer
            };
          }
          return stop;
        });
      }

      setRoute(routeData);
      setCustomers(customersData);
      setDepot(depotData || routeData.depot);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMapMarkers = (): MarkerData[] => {
    if (!route || !route.stops || route.stops.length === 0) {
      return [];
    }

    const markers = route.stops.map((stop) => {
      const customer = stop.customer || customers.find(c => c.id === stop.customerId);

      if (!customer) {
        console.warn(`Customer not found for stop ${stop.order}, customerId: ${stop.customerId}`);
        return null;
      }

      // Koordinatları kontrol et
      if (!customer.latitude || !customer.longitude) {
        console.warn(`No coordinates for customer ${customer.name}`);
        return null;
      }

      const marker = {
        position: {
          lat: customer.latitude,
          lng: customer.longitude
        },
        title: customer.name || `Durak ${stop.order}`,
        label: String(stop.order),
        type: 'customer' as const,
        customerId: stop.customerId,
        order: stop.order
      };

      return marker;
    }).filter(Boolean) as MarkerData[];

    return markers;
  };

  const loadRouteOnMap = async (routeData: Route) => {
    if (!routeData.stops || routeData.stops.length === 0) return;
    if (!isGoogleMapsLoaded) return;
    if (!depot) return;

    const depotLocation = {
      lat: depot.latitude || 40.9913,
      lng: depot.longitude || 29.0236
    };

    // BUGFIX: Filter out waypoints with invalid coordinates (0,0) to prevent ZERO_RESULTS error
    const waypoints = routeData.stops
      .map(stop => {
        const customer = stop.customer || customers.find(c => c.id === stop.customerId);
        if (!customer || !customer.latitude || !customer.longitude) {
          console.warn(`Skipping stop ${stop.order} - invalid coordinates`, customer);
          return null;
        }
        return {
          lat: customer.latitude,
          lng: customer.longitude
        };
      })
      .filter((wp): wp is { lat: number; lng: number } => wp !== null);

    // Don't try to get directions if no valid waypoints
    if (waypoints.length === 0) {
      console.warn('No valid waypoints found for route');
      return;
    }

    try {
      googleMapsService.initializeServices();

      const directions = await googleMapsService.getDirections(
        depotLocation,
        waypoints,
        depotLocation
      );

      if (directions) {
        setMapDirections(directions);
      }
    } catch (error) {
      console.error('Error loading route on map:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Bu rotayı silmek istediğinizden emin misiniz?')) return;

    try {
      await routeService.delete(id);
      navigate('/routes');
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const handleDuplicate = async () => {
    if (!route) return;

    try {
      // Stop'ları temizle ve sıfırla
      const cleanStops = route.stops.map((stop, index) => ({
        ...stop,
        id: `temp-${Date.now()}-${index}`,
        routeId: '',
        status: 'pending' as const,
        actualArrival: undefined,
        completedAt: undefined,
        deliveryProof: undefined,
        failureReason: undefined,
        order: index + 1
      }));

      // Yeni rota oluştur
      const newRoute: Partial<Route> = {
        name: `${route.name} (Kopya)`,
        date: new Date(),
        driverId: route.driverId,
        vehicleId: route.vehicleId,
        depotId: route.depotId,
        status: 'draft',
        stops: cleanStops,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        totalDeliveries: route.totalDeliveries,
        completedDeliveries: 0,
        optimized: route.optimized,
        notes: route.notes ? `${route.notes} (Kopya)` : '',
        driver: route.driver,
        vehicle: route.vehicle,
        depot: depot
      };

      console.log('Creating duplicate route:', newRoute);

      // Yeni rotayı oluştur
      const created = await routeService.create(newRoute);

      console.log('Created route:', created);

      if (created && created.id) {
        alert(`✅ Rota başarıyla kopyalandı!\n\nYeni rota: ${created.name}`);
        navigate('/routes');
      } else {
        throw new Error('Rota oluşturuldu ancak ID alınamadı');
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      alert('❌ Rota kopyalanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleCopyRouteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleStartJourney = async () => {
    if (!route) return;

    // Sürücü ve araç kontrolü
    if (!route.driverId || !route.vehicleId) {
      alert('⚠️ Sefer başlatmak için önce sürücü ve araç ataması yapmalısınız!');
      navigate(`/routes/${route.id}/edit`);
      return;
    }

    // Durak kontrolü
    if (!route.stops || route.stops.length === 0) {
      alert('⚠️ Sefer başlatmak için en az bir durak eklemelisiniz!');
      return;
    }

    // ✅ Kilometre kontrolü - Rota oluşturulurken girilmiş olmalı
    if (!route.currentKm) {
      alert('⚠️ Rotaya kilometre bilgisi girilmemiş! Lütfen rotayı düzenleyerek kilometre bilgisini ekleyin.');
      navigate(`/routes/${route.id}/edit`);
      return;
    }

    setStartingJourney(true);

    try {
      // Sefer başlat (route'daki currentKm ile)
      const journey = await journeyService.startFromRoute(route.id, undefined, undefined, route.currentKm);

      if (journey) {
        alert('✅ Sefer başarıyla başlatıldı! Sizi sefer detay sayfasına yönlendiriyoruz...');

        // Journeys sayfasına yönlendir
        setTimeout(() => {
          navigate(`/journeys/${journey.id}`);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sefer başlatma hatası:', error);
      alert(`❌ Sefer başlatılamadı: ${error.message || 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setStartingJourney(false);
    }
  };

  const handleExport = () => {
    if (!route) return;

    const csvContent = [
      ['Sıra', 'Müşteri', 'Adres', 'Telefon', 'Durum', 'Mesafe', 'Süre', 'Tahmini Varış', 'Tahmini Ayrılış'],
      ...route.stops.map(stop => [
        stop.order,
        stop.customer?.name || '',
        stop.customer?.address || '',
        stop.customer?.phone || '',
        stop.status,
        stop.distance ? `${stop.distance} km` : '',
        stop.duration ? `${stop.duration} dk` : '',
        formatETA(stop.estimatedArrivalTime),
        formatETA(stop.estimatedDepartureTime)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!route) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Helper function to replace Turkish characters for PDF compatibility
    const fixTurkish = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\u011f/g, 'g').replace(/\u011e/g, 'G')
        .replace(/\u00fc/g, 'u').replace(/\u00dc/g, 'U')
        .replace(/\u015f/g, 's').replace(/\u015e/g, 'S')
        .replace(/\u0131/g, 'i').replace(/\u0130/g, 'I')
        .replace(/\u00f6/g, 'o').replace(/\u00d6/g, 'O')
        .replace(/\u00e7/g, 'c').replace(/\u00c7/g, 'C');
    };

    // ============ MODERN HEADER ============
    // Gradient background (dark blue)
    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(0, 0, pageWidth, 50, 'F');

    // White accent bar
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 50, pageWidth, 2, 'F');

    // Company Logo/Name
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('YOLPILOT', 15, 20);

    // Subtitle
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254); // blue-200
    doc.text('Akilli Rota Optimizasyonu', 15, 26);

    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ROTA DETAY RAPORU', pageWidth / 2, 20, { align: 'center' });

    // Route Name
    const routeName = fixTurkish(route.name || `Rota #${route.id}`);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(routeName, pageWidth / 2, 28, { align: 'center' });

    // Date box (top right)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - 50, 12, 40, 16, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.text('TARIH', pageWidth - 30, 17, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const formattedDate = route.date ? new Date(route.date).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
    doc.text(fixTurkish(formattedDate), pageWidth - 30, 24, { align: 'center' });

    let yPos = 62;

    // ============ GENEL BILGILER (INFO CARDS) ============
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.text('GENEL BILGILER', 15, yPos);
    yPos += 7;

    const statusText =
      route.status === 'draft' ? 'Taslak' :
      route.status === 'planned' ? 'Planlandi' :
      route.status === 'in_progress' ? 'Devam Ediyor' :
      route.status === 'completed' ? 'Tamamlandi' : 'Iptal Edildi';

    // Info cards in 2x4 grid
    const infoData = [
      { label: 'Surucu', value: fixTurkish(route.driver?.fullName || route.driver?.name || '-') },
      { label: 'Arac', value: fixTurkish(route.vehicle?.plateNumber || '-') },
      { label: 'Durum', value: fixTurkish(statusText) },
      { label: 'Rota Tarihi', value: fixTurkish(route.date ? new Date(route.date).toLocaleDateString('tr-TR') : '-') },
      { label: 'Toplam Mesafe', value: `${route.totalDistance ? route.totalDistance.toFixed(1) : 0} km` },
      { label: 'Toplam Sure', value: formatDuration(route.totalDuration || 0) },
      { label: 'Toplam Durak', value: `${route.totalDeliveries || route.stops.length}` },
      { label: 'Tamamlanan', value: `${route.completedDeliveries || 0}` },
      { label: 'Optimizasyon', value: route.optimized ? 'Evet' : 'Hayir' },
      ...(depot?.name ? [{ label: 'Depo', value: fixTurkish(depot.name) }] : []),
    ];

    // Draw info cards
    const cardWidth = (pageWidth - 40) / 4;
    const cardHeight = 20;
    infoData.forEach((info, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 15 + (col * cardWidth) + (col * 2);
      const y = yPos + (row * (cardHeight + 3));

      // Card background
      doc.setFillColor(248, 250, 252); // gray-50
      doc.roundedRect(x, y, cardWidth - 2, cardHeight, 2, 2, 'F');

      // Label
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.setFont('helvetica', 'normal');
      doc.text(info.label, x + 3, y + 6);

      // Value
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.setFont('helvetica', 'bold');
      doc.text(info.value, x + 3, y + 14);
    });

    yPos += (Math.ceil(infoData.length / 4) * (cardHeight + 3)) + 5;

    // ============ DURAKLAR ============
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.setFont('helvetica', 'bold');
    doc.text('DURAKLAR', 15, yPos);
    yPos += 3;

    const stopsData = route.stops.map((stop: RouteStop) => {
      const stopCustomer = stop.customer || customers.find(c => c.id === stop.customerId);
      const customerName = fixTurkish(stopCustomer?.name || `Durak ${stop.order}`);
      const customerPhone = stopCustomer?.phone ? `\n${stopCustomer.phone}` : '';
      const customerAddress = fixTurkish(stopCustomer?.address || stop.customer?.address || '-');
      const statusLabel =
        stop.status === 'completed' ? 'Tamamlandi' :
        stop.status === 'failed' ? 'Basarisiz' :
        stop.status === 'arrived' ? 'Varildi' :
        'Bekliyor';

      return [
        stop.order.toString(),
        `${customerName}${customerPhone}`,
        customerAddress,
        statusLabel,
        stop.distance ? `${stop.distance} km` : '-',
        stop.duration ? `${stop.duration} dk` : '-',
        formatETA(stop.estimatedArrivalTime),
        formatETA(stop.estimatedDepartureTime)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Musteri', 'Adres', 'Durum', 'Mesafe', 'Sure', 'Plan.\nVaris', 'Plan.\nAyrilis']],
      body: stopsData,
      theme: 'plain',
      headStyles: {
        fillColor: [30, 58, 138], // blue-900
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [255, 255, 255]
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [229, 231, 235]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // gray-50
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] },
        1: { cellWidth: 40, overflow: 'linebreak' },
        2: { cellWidth: 55, overflow: 'linebreak' },
        3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 15, halign: 'center', fontSize: 7 },
        7: { cellWidth: 16, halign: 'center', fontSize: 7 }
      },
      didParseCell: (data) => {
        // Durum sutunu renklendirme
        if (data.column.index === 3 && data.section === 'body') {
          const status = data.cell.text[0];
          if (status === 'Tamamlandi') {
            data.cell.styles.textColor = [22, 163, 74]; // green-600
            data.cell.styles.fillColor = [220, 252, 231]; // green-100
          } else if (status === 'Basarisiz') {
            data.cell.styles.textColor = [220, 38, 38]; // red-600
            data.cell.styles.fillColor = [254, 226, 226]; // red-100
          } else if (status === 'Varildi') {
            data.cell.styles.textColor = [37, 99, 235]; // blue-600
            data.cell.styles.fillColor = [219, 234, 254]; // blue-100
          }
        }
      },
      margin: { left: 15, right: 15 }
    });

    // ============ MODERN FOOTER ============
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer background
      doc.setFillColor(248, 250, 252); // gray-50
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

      // Footer top line
      doc.setDrawColor(30, 58, 138); // blue-900
      doc.setLineWidth(0.5);
      doc.line(0, pageHeight - 15, pageWidth, pageHeight - 15);

      // Footer content
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.setFont('helvetica', 'normal');

      // Left: Company info
      doc.text('YolPilot - Akilli Rota Optimizasyonu', 15, pageHeight - 8);

      // Center: Page number
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

      // Right: Creation time
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      const creationTime = new Date().toLocaleString('tr-TR');
      doc.text(fixTurkish(`Olusturulma: ${creationTime}`), pageWidth - 15, pageHeight - 8, { align: 'right' });
    }

    // Kaydet
    const fileName = `rota_${route.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('PDF indirildi');
  };

  const handleStopClick = (stopId: string) => {
    setSelectedStopId(stopId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <Edit className="w-4 h-4 mr-1" />
            Taslak
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <Calendar className="w-4 h-4 mr-1" />
            Planlandı
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <Navigation className="w-4 h-4 mr-1 animate-pulse" />
            Devam Ediyor
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            <CheckCircle className="w-4 h-4 mr-1" />
            Tamamlandı
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
            <XCircle className="w-4 h-4 mr-1" />
            İptal Edildi
          </span>
        );
      default:
        return null;
    }
  };

  const getStopStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Bekliyor</span>;
      case 'arrived':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Varıldı</span>;
      case 'completed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">Tamamlandı</span>;
      case 'failed':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Başarısız</span>;
      default:
        return null;
    }
  };

  const calculateProgress = () => {
    if (!route || !route.totalDeliveries) return 0;
    return Math.round((route.completedDeliveries / route.totalDeliveries) * 100);
  };

  const getDepotLocation = (): LatLng | undefined => {
    if (depot) {
      return {
        lat: depot.latitude,
        lng: depot.longitude
      };
    }
    // Eğer depot yoksa ve route'da depot bilgisi varsa onu kullan
    if (route?.depot) {
      return {
        lat: route.depot.latitude,
        lng: route.depot.longitude
      };
    }
    // Hiçbiri yoksa undefined dön
    return undefined;
  };

  // Harita bileşenini render eden yardımcı fonksiyon
  const renderMapComponent = () => {
    // Google Maps yükleniyor durumu
    if (!isGoogleMapsLoaded && !googleMapsLoadError) {
      return (
        <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl" style={{ height: '650px' }}>
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            </div>
            <p className="text-gray-600 mt-4">Google Maps yükleniyor...</p>
          </div>
        </div>
      );
    }

    // Google Maps yükleme hatası durumu
    if (googleMapsLoadError) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height: '650px' }}>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Google Maps API Key eksik</p>
              <p className="text-sm text-gray-500 mt-1">.env dosyasını kontrol edin</p>
            </div>
          </div>
        );
      }

      console.warn('Google Maps yüklenemedi, LeafletMapComponent kullanılıyor:', googleMapsLoadError);
      const depotLoc = getDepotLocation();
      return (
        <div>
          <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Google Maps yüklenemedi. Alternatif harita kullanılıyor.
            </p>
          </div>
          <LeafletMapComponent
            height="650px"
            customers={customers}
            depot={depotLoc}
            stops={route?.stops.map((stop) => ({
              customer: stop.customer || customers.find(c => c.id === stop.customerId) || {
                id: stop.customerId,
                name: `Müşteri ${stop.customerId}`,
                address: '',
                phone: '',
                latitude: 0,
                longitude: 0,
                code: '',
                priority: 'normal' as const,
                tags: [],
                createdAt: new Date(),
                updatedAt: new Date()
              },
              order: stop.order
            })) || []}
          />
        </div>
      );
    }

    // Google Maps başarıyla yüklendi
    if (isGoogleMapsLoaded) {
      return (
        <MapComponent
          height="650px"
          markers={mapMarkers}
          depot={getDepotLocation()}
          directions={mapDirections}
          customers={customers}
          showTraffic={false}
          selectedCustomerId={selectedStopId ? route?.stops.find(s => s.id === selectedStopId)?.customerId : undefined}
          onCustomerSelect={(customerId) => {
            const stop = route?.stops.find(s => s.customerId === customerId);
            if (stop) setSelectedStopId(stop.id);
          }}
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Rota Bulunamadı</h3>
              <p className="text-red-700 mt-1">Bu ID'ye sahip bir rota bulunamadı.</p>
              <Link to="/routes" className="text-blue-600 hover:underline mt-2 inline-block">
                ← Rotalara Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50">
          ✔ Kopyalandı!
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/routes"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(route.status)}
                {route.optimized && (
                  <span className="text-sm text-green-600 font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Optimize Edildi
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {new Date(route.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Sefer Başlat Butonu - draft, planned durumlarında göster */}
            {(route.status === 'draft' || route.status === 'planned') && (
              <button
                onClick={handleStartJourney}
                disabled={startingJourney}
                className={`px-4 py-2 ${startingJourney
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-lg transition-colors flex items-center`}
              >
                {startingJourney ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sefer Başlatılıyor...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Seferi Başlat
                  </>
                )}
              </button>
            )}

            {/* Devam Ediyor ise Sefere Git */}
            {route.status === 'in_progress' && (
              <button
                onClick={async () => {
                  const journey = await journeyService.getByRouteId(route.id);
                  if (journey) {
                    navigate(`/journeys/${journey.id}`);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Sefere Git
              </button>
            )}

            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              title="PDF olarak indir"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="CSV Olarak İndir"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleCopyRouteLink}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rota Linkini Kopyala"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rotayı Kopyala"
            >
              <Copy className="w-5 h-5 text-gray-600" />
            </button>

            <Link
              to={`/routes/${route.id}/edit`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Düzenle"
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </Link>

            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {route.status === 'in_progress' && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">İlerleme</span>
              <span className="text-sm font-medium text-gray-900">
                {route.completedDeliveries} / {route.totalDeliveries} tamamlandı
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Durak</p>
              <p className="text-2xl font-bold text-gray-900">{route.totalDeliveries || route.stops.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900">{route.completedDeliveries || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mesafe</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDistance ? `${route.totalDistance.toFixed(1)}` : '0'} <span className="text-sm">km</span>
              </p>
            </div>
            <Navigation className="w-8 h-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Süre</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDuration ? formatDuration(route.totalDuration) : '0 dakika'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Başarı Oranı</p>
              <p className="text-2xl font-bold text-gray-900">
                {route.totalDeliveries > 0 ? calculateProgress() : 0}%
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Main Content - Harita ve Duraklar YAN YANA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Taraf - Harita (2/3 genişlik) */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Map className="w-5 h-5 mr-2" />
              Rota Haritası
            </h2>
            {!route.optimized && route.stops.length > 0 && (
              <span className="text-sm text-orange-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Optimize edilmemiş
              </span>
            )}
          </div>

          {/* Harita Komponenti */}
          {renderMapComponent()}

          {!route.optimized && route.stops.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <strong>Bilgi:</strong> Rota henüz optimize edilmemiş. Rota oluşturma sayfasından optimize edebilirsiniz.
              </p>
            </div>
          )}
        </div>

        {/* Sağ Taraf - Duraklar Listesi (1/3 genişlik) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Duraklar ({route.stops.length})
            </h2>
          </div>

          <div className="max-h-[650px] overflow-y-auto">
            {route.stops.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Bu rotada henüz durak yok</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Başlangıç Deposu - EN BAŞA EKLENEN */}
                {route.depot && (
                  <div className="p-4 bg-blue-50 border-t-2 border-blue-200">
                    <div className="flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-3 flex-shrink-0">
                        🏭
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-blue-900">
                            Başlangıç Deposu
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                            İlk Durak
                          </span>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center text-sm text-blue-700">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="font-semibold">{route.depot.name}</span>
                          </div>
                          <div className="text-xs text-blue-600 ml-6">
                            {route.depot.address}
                          </div>
                          {route.startDetails?.startTime && (
                            <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded">
                              <div className="text-xs font-medium text-blue-800 mb-1">
                                Başlangıç Saati
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700">Depodan Çıkış:</span>
                                <span className="font-bold text-blue-900 text-sm">
                                  {formatETA(route.startDetails.startTime)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {route.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    onClick={() => handleStopClick(stop.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedStopId === stop.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm mr-3 flex-shrink-0">
                        {stop.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {stop.customer?.name || stop.name || `Müşteri ${stop.customerId}`}
                          </h4>
                          {getStopStatusBadge(stop.status)}
                        </div>

                        <p className="text-xs text-gray-600 truncate mb-2">
                          {stop.customer?.address || stop.address}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {(stop.customer?.phone || stop.contactPhone) && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-0.5" />
                              {stop.customer?.phone || stop.contactPhone}
                            </span>
                          )}

                          {(stop.serviceTime || stop.customer?.estimatedServiceTime) && (
                            <span className="flex items-center">
                              <Timer className="w-3 h-3 mr-0.5" />
                              {stop.serviceTime || stop.customer?.estimatedServiceTime}dk
                            </span>
                          )}

                          {stop.distance && (
                            <span className="flex items-center">
                              <Navigation className="w-3 h-3 mr-0.5" />
                              {stop.distance}km
                            </span>
                          )}
                        </div>

                        {/* ETA Bilgileri - YENİ EKLENEN KISIM */}
                        {route.optimized && (stop.estimatedArrivalTime || stop.estimatedDepartureTime) && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <div className="text-xs font-medium text-blue-700 mb-1">
                              Tahmini Saatler
                            </div>
                            <div className="space-y-1 text-xs">
                              {stop.estimatedArrivalTime && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Varış:</span>
                                  <span className="font-semibold text-blue-900">
                                    {formatETA(stop.estimatedArrivalTime)}
                                  </span>
                                </div>
                              )}
                              {stop.estimatedDepartureTime && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Tamamlanma:</span>
                                  <span className="font-semibold text-blue-900">
                                    {formatETA(stop.estimatedDepartureTime)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* İlerleme göstergesi */}
                            {index > 0 && route.stops[index - 1].estimatedDepartureTime && (
                              <div className="mt-1 pt-1 border-t border-blue-200">
                                <div className="flex items-center text-xs text-blue-600">
                                  <ArrowRight className="w-3 h-3 mr-0.5" />
                                  <span className="text-xs">
                                    #{index} duraktan {formatETA(route.stops[index - 1].estimatedDepartureTime)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {stop.customer?.timeWindow && (
                          <div className="mt-2 flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {stop.overrideTimeWindow?.start || stop.customer.timeWindow.start} -
                            {stop.overrideTimeWindow?.end || stop.customer.timeWindow.end}
                          </div>
                        )}

                        {(stop.stopNotes || stop.notes || stop.customer?.notes) && (
                          <div className="mt-2">
                            <div className="p-1.5 bg-yellow-50 rounded text-xs text-yellow-700">
                              {stop.stopNotes || stop.notes || stop.customer?.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Depo Dönüş - SON DURAKTAN SONRA EKLENEN */}
                {route.optimized && route.endDetails && route.endDetails.estimatedArrivalTime && (
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

                        <p className="text-xs text-green-700 truncate mb-2">
                          {route.endDetails.name || depot?.name || 'Depo'}
                        </p>

                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                          <div className="text-xs font-medium text-green-800 mb-1">
                            Tahmini Depo Varış Saati
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-green-700">Depoya Varış:</span>
                            <span className="font-bold text-green-900 text-sm">
                              {formatETA(route.endDetails.estimatedArrivalTime)}
                            </span>
                          </div>

                          {route.stops.length > 0 && route.stops[route.stops.length - 1].estimatedDepartureTime && (
                            <div className="mt-1 pt-1 border-t border-green-300">
                              <div className="flex items-center text-xs text-green-700">
                                <ArrowRight className="w-3 h-3 mr-0.5" />
                                <span>
                                  Son duraktan ayrılış: {formatETA(route.stops[route.stops.length - 1].estimatedDepartureTime)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-green-600 italic">
                          ✅ Rota tamamlandığında depoya dönüş yapılacak
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylar</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Sürücü</p>
                <p className="font-medium">{route.driver?.name || 'Atanmadı'}</p>
                {route.driver && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{route.driver.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Araç</p>
                <p className="font-medium">
                  {route.vehicle ? `${route.vehicle.plateNumber} - ${route.vehicle.brand} ${route.vehicle.model}` : 'Atanmadı'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Home className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Depo</p>
                <p className="font-medium">{depot?.name || route.depot?.name || 'Depo bilgisi yok'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Rota Başlangıç Saati</p>
                <p className="font-medium">
                  {route.startDetails?.plannedStartTime
                    ? formatETA(route.startDetails.plannedStartTime)
                    : route.startDetails?.startTime
                    ? formatETA(route.startDetails.startTime)
                    : 'Belirlenmemiş'}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Oluşturulma</p>
                <p className="font-medium">
                  {(() => {
                    const date = new Date(route.createdAt);
                    // UTC offset'i al (Türkiye için +3)
                    const offset = 3; // Türkiye UTC+3
                    date.setHours(date.getHours() + offset);

                    return date.toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>

          {route.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Notlar:</strong> {route.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteDetail;
