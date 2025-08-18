// src/components/tracking/VehicleCard.tsx
import React from 'react';
import { 
  Car, 
  User, 
  MapPin, 
  Clock,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle,
  Navigation,
  Activity
} from 'lucide-react';
import { Journey } from '@/types';

interface VehicleCardProps {
  journey: Journey;
  selected?: boolean;
  onClick?: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ journey, selected, onClick }) => {
  const getStatusIcon = () => {
    switch (journey.status) {
      case 'preparing':
        return <Clock className="w-4 h-4" />;
      case 'started':
        return <Activity className="w-4 h-4" />;
      case 'in_progress':
        return <Navigation className="w-4 h-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (journey.status) {
      case 'preparing':
        return 'text-yellow-600 bg-yellow-100';
      case 'started':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = () => {
    switch (journey.status) {
      case 'preparing':
        return 'Hazırlanıyor';
      case 'started':
        return 'Başladı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmiyor';
    }
  };

  // ✅ DÜZELTME: Null check ekledik
  const getCurrentStop = () => {
    if (!journey.route?.stops || !Array.isArray(journey.route.stops)) {
      return null;
    }
    const index = journey.currentStopIndex || 0;
    return journey.route.stops[index] || null;
  };

  // ✅ DÜZELTME: Null check ekledik
  const getProgress = () => {
    if (!journey.route?.stops || !Array.isArray(journey.route.stops)) {
      return 0;
    }
    const completed = journey.route.stops.filter(s => s.status === 'completed').length;
    const total = journey.route.stops.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getTimeElapsed = () => {
    if (!journey.startedAt) return '0 dk';
    const elapsed = Date.now() - new Date(journey.startedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    return `${hours} sa ${minutes % 60} dk`;
  };

  // ✅ DÜZELTME: Null check ekledik
  const getETA = () => {
    if (!journey.route?.stops || !Array.isArray(journey.route.stops)) {
      return 'Bilinmiyor';
    }
    const remainingStops = journey.route.stops.filter(s => 
      s.status === 'pending' || s.status === 'arrived'
    ).length;
    const avgTimePerStop = 15; // minutes
    const estimatedMinutes = remainingStops * avgTimePerStop;
    if (estimatedMinutes < 60) return `~${estimatedMinutes} dk`;
    const hours = Math.floor(estimatedMinutes / 60);
    return `~${hours} sa ${estimatedMinutes % 60} dk`;
  };

  // ✅ DÜZELTME: Null check ekledik
  const getTotalDeliveries = () => {
    return journey.route?.totalDeliveries || journey.route?.stops?.length || 0;
  };

  const getCompletedDeliveries = () => {
    return journey.route?.completedDeliveries || 0;
  };

  const currentStop = getCurrentStop();

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
        selected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Car className="w-5 h-5 text-gray-600 mr-2" />
          <div>
            <p className="font-semibold text-gray-900">
              {journey.route?.vehicle?.plateNumber || 'Araç Yok'}
            </p>
            <p className="text-xs text-gray-500">
              {journey.route?.vehicle?.brand} {journey.route?.vehicle?.model}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </span>
      </div>

      {/* Driver Info */}
      <div className="flex items-center mb-3">
        <User className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-700">
          {journey.route?.driver?.name || 'Sürücü Atanmadı'}
        </span>
      </div>

      {/* Current Location */}
      {currentStop && (
        <div className="flex items-start mb-3">
          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              Hedef: {currentStop.customer?.name || 'Müşteri Bilgisi Yok'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentStop.customer?.address || currentStop.address || 'Adres bilgisi yok'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded px-2 py-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Hız</span>
            <div className="flex items-center">
              <TrendingUp className="w-3 h-3 text-gray-400 mr-1" />
              <span className="text-xs font-semibold text-gray-700">
                {journey.liveLocation?.speed ? Math.round(journey.liveLocation.speed) : 0} km/h
              </span>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded px-2 py-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Teslimat</span>
            <div className="flex items-center">
              <Package className="w-3 h-3 text-gray-400 mr-1" />
              <span className="text-xs font-semibold text-gray-700">
                {getCompletedDeliveries()}/{getTotalDeliveries()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">İlerleme</span>
          <span className="text-xs font-semibold text-gray-700">%{getProgress()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center">
          <Clock className="w-3 h-3 text-gray-400 mr-1" />
          <span className="text-gray-600">
            Geçen: {getTimeElapsed()}
          </span>
        </div>
        <span className="text-gray-600">
          Tahmini: {getETA()}
        </span>
      </div>

      {/* Live Indicator */}
      {(journey.status === 'in_progress' || journey.status === 'started') && (
        <div className="flex items-center justify-center mt-3 pt-3 border-t">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-green-600 font-medium">Canlı Takip Aktif</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleCard;