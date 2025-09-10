// src/components/payment/TrialBanner.tsx

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { paymentService, type TrialStatusResponse } from '../../services/payment.service';

interface TrialBannerProps {
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  onUpgradeClick,
  onDismiss,
  className = ''
}) => {
  const [trialStatus, setTrialStatus] = useState<TrialStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadTrialStatus();
  }, []);

  const loadTrialStatus = async () => {
    try {
      const status = await paymentService.getTrialStatus();
      setTrialStatus(status);
    } catch (error) {
      console.error('Error loading trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed || !trialStatus?.isActive) {
    return null;
  }

  const isExpiringSoon = trialStatus.remainingDays <= 3;
  const isExpired = trialStatus.isExpired;

  const getBannerStyle = () => {
    if (isExpired) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (isExpiringSoon) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getIcon = () => {
    if (isExpired) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (isExpiringSoon) {
      return <Clock className="h-5 w-5 text-orange-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-blue-500" />;
  };

  const getMessage = () => {
    if (isExpired) {
      return 'Deneme süreniz sona erdi. Hizmetleri kullanmaya devam etmek için bir plan seçin.';
    }
    if (isExpiringSoon) {
      return `Deneme süreniz ${trialStatus.remainingDays} gün sonra sona erecek. Planınızı yükseltin.`;
    }
    return `Deneme süreniz ${trialStatus.remainingDays} gün daha devam ediyor.`;
  };

  return (
    <div className={`relative rounded-lg border p-4 ${getBannerStyle()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h3 className="text-sm font-medium">
              {isExpired ? 'Deneme Süresi Bitti' : 'Deneme Süresi'}
            </h3>
            <p className="mt-1 text-sm">{getMessage()}</p>
            
            {trialStatus.limits && (
              <div className="mt-2 text-xs opacity-75">
                <span>Limitleriniz: </span>
                <span>{trialStatus.limits.maxStops} durak, </span>
                <span>{trialStatus.limits.maxWhatsAppMessages} WhatsApp mesajı, </span>
                <span>{trialStatus.limits.maxDrivers} sürücü, </span>
                <span>{trialStatus.limits.maxVehicles} araç</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {(isExpired || isExpiringSoon) && (
            <button
              onClick={onUpgradeClick}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Planı Yükselt
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};