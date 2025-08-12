// src/components/tracking/JourneyDetails.tsx
import React from 'react';
import { 
  X, 
  Car, 
  User, 
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  Navigation,
  TrendingUp,
  Calendar,
  Hash,
  Activity,
  Star
} from 'lucide-react';
import { Journey } from '@/types';

interface JourneyDetailsProps {
  journey: Journey;
  onClose: () => void;
}

const JourneyDetails: React.FC<JourneyDetailsProps> = ({ journey, onClose }) => {
  const getStatusBadge = () => {
    const statusConfig = {
      preparing: { text: 'Hazırlanıyor', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      started: { text: 'Başladı', color: 'bg-blue-100 text-blue-700', icon: Activity },
      in_progress: { text: 'Devam Ediyor', color: 'bg-green-100 text-green-700', icon: Navigation },
      completed: { text: 'Tamamlandı', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
      cancelled: { text: 'İptal Edildi', color: 'bg-red-100 text-red-700', icon: AlertCircle }
    };

    const config = statusConfig[journey.status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertCircle;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config?.color || 'bg-gray-100 text-gray-700'}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config?.text || 'Bilinmiyor'}
      </span>
    );
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'arrived':
        return <Navigation className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStopStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'arrived':
        return 'Varıldı';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bekliyor';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR');
  };

  const calculateDuration = () => {
    if (!journey.startedAt) return '0 dk';
    const start = new Date(journey.startedAt).getTime();
    const end = journey.completedAt ? new Date(journey.completedAt).getTime() : Date.now();
    const duration = Math.floor((end - start) / 60000);
    if (duration < 60) return `${duration} dk`;
    const hours = Math.floor(duration / 60);
    return `${hours} sa ${duration % 60} dk`;
  };

  const getProgress = () => {
    const completed = journey.route.stops.filter(s => s.status === 'completed').length;
    return Math.round((completed / journey.route.stops.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sefer Detayları</h2>
              <p className="text-blue-100">
                {journey.route.name} • {formatDate(journey.startedAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status Bar */}
          <div className="bg-gray-50 border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusBadge()}
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  Süre: {calculateDuration()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Hız: {journey.liveLocation?.speed ? Math.round(journey.liveLocation.speed) : 0} km/h
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">%{getProgress()}</div>
                <div className="text-xs text-gray-500">Tamamlanan</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Vehicle & Driver Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Vehicle Card */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Car className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Araç Bilgileri</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Plaka:</span>
                    <span className="text-sm font-medium">{journey.route.vehicle?.plateNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Model:</span>
                    <span className="text-sm font-medium">
                      {journey.route.vehicle?.brand} {journey.route.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tip:</span>
                    <span className="text-sm font-medium capitalize">{journey.route.vehicle?.type || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Kapasite:</span>
                    <span className="text-sm font-medium">{journey.route.vehicle?.capacity || 0} kg</span>
                  </div>
                </div>
              </div>

              {/* Driver Card */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Sürücü Bilgileri</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ad Soyad:</span>
                    <span className="text-sm font-medium">{journey.route.driver?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Telefon:</span>
                    <span className="text-sm font-medium">{journey.route.driver?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ehliyet:</span>
                    <span className="text-sm font-medium">{journey.route.driver?.licenseNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Puan:</span>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{journey.route.driver?.rating || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Stats */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {journey.route.completedDeliveries}/{journey.route.totalDeliveries}
                  </div>
                  <div className="text-xs text-gray-600">Teslimat</div>
                </div>
                <div className="text-center">
                  <Navigation className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {journey.totalDistance.toFixed(1)} km
                  </div>
                  <div className="text-xs text-gray-600">Mesafe</div>
                </div>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {journey.totalDuration} dk
                  </div>
                  <div className="text-xs text-gray-600">Süre</div>
                </div>
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {journey.currentStopIndex + 1}
                  </div>
                  <div className="text-xs text-gray-600">Mevcut Durak</div>
                </div>
              </div>
            </div>

            {/* Stops List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Duraklar ({journey.route.stops.length})
              </h3>
              <div className="space-y-3">
                {journey.route.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`border rounded-lg p-4 ${
                      index === journey.currentStopIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3">
                          <span className="text-sm font-semibold text-gray-700">
                            {stop.order}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h4 className="font-medium text-gray-900 mr-2">
                              {stop.customer?.name}
                            </h4>
                            {stop.customer?.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                Öncelikli
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {stop.customer?.address}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {stop.customer?.phone && (
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {stop.customer.phone}
                              </div>
                            )}
                            {stop.customer?.timeWindow && (
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {stop.customer.timeWindow.start} - {stop.customer.timeWindow.end}
                              </div>
                            )}
                            {stop.distance && (
                              <div className="flex items-center">
                                <Navigation className="w-3 h-3 mr-1" />
                                {stop.distance.toFixed(1)} km
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getStopStatusIcon(stop.status)}
                        <span className="ml-2 text-sm text-gray-600">
                          {getStopStatusText(stop.status)}
                        </span>
                      </div>
                    </div>

                    {/* Stop Times */}
                    {(stop.estimatedArrival || stop.actualArrival) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-6 text-xs">
                        {stop.estimatedArrival && (
                          <div>
                            <span className="text-gray-500">Tahmini:</span>
                            <span className="ml-1 font-medium">{formatTime(stop.estimatedArrival)}</span>
                          </div>
                        )}
                        {stop.actualArrival && (
                          <div>
                            <span className="text-gray-500">Gerçek:</span>
                            <span className="ml-1 font-medium">{formatTime(stop.actualArrival)}</span>
                          </div>
                        )}
                        {stop.completedAt && (
                          <div>
                            <span className="text-gray-500">Tamamlandı:</span>
                            <span className="ml-1 font-medium">{formatTime(stop.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetails;