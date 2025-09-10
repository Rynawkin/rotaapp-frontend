// src/components/payment/UsageStats.tsx

import React, { useState, useEffect } from 'react';
import { BarChart3, MessageCircle, MapPin, Calendar, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { paymentService, type WorkspaceUsageDto } from '../../services/payment.service';

interface UsageStatsProps {
  className?: string;
}

export const UsageStats: React.FC<UsageStatsProps> = ({ className = '' }) => {
  const [usage, setUsage] = useState<WorkspaceUsageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await paymentService.getCurrentUsage();
      setUsage(data);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100';
    if (percentage >= 75) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Kullanım bilgisi yüklenemedi</h3>
          <p className="text-sm text-gray-500">
            Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
        </div>
      </div>
    );
  }

  const stopsPercentage = getUsagePercentage(usage.currentMonthStops, usage.includedMonthlyStops);
  const whatsappPercentage = getUsagePercentage(usage.currentMonthWhatsAppMessages, usage.includedWhatsAppMessages);

  const excessStops = Math.max(0, usage.currentMonthStops - usage.includedMonthlyStops);
  const excessWhatsApp = Math.max(0, usage.currentMonthWhatsAppMessages - usage.includedWhatsAppMessages);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Kullanım İstatistikleri</h2>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentService.getPlanColor(
              usage.planType
            )}`}
          >
            {paymentService.getPlanDisplayName(usage.planType)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Stops Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Durak Kullanımı</h3>
              </div>
              {stopsPercentage >= 90 && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bu ay</span>
                <span className="font-medium">
                  {usage.currentMonthStops} / {usage.includedMonthlyStops}
                </span>
              </div>
              
              <div className={`w-full bg-gray-200 rounded-full h-2 ${getProgressBarColor(stopsPercentage)}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(stopsPercentage)}`}
                  style={{ width: `${stopsPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Kalan: {usage.remainingStops}</span>
                <span>{stopsPercentage.toFixed(0)}% kullanıldı</span>
              </div>
              
              {excessStops > 0 && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <span className="text-orange-800">
                    Limit aşımı: <strong>{excessStops} durak</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Usage */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-gray-900">WhatsApp Kullanımı</h3>
              </div>
              {whatsappPercentage >= 90 && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Bu ay</span>
                <span className="font-medium">
                  {usage.currentMonthWhatsAppMessages} / {usage.includedWhatsAppMessages}
                </span>
              </div>
              
              <div className={`w-full bg-gray-200 rounded-full h-2 ${getProgressBarColor(whatsappPercentage)}`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(whatsappPercentage)}`}
                  style={{ width: `${whatsappPercentage}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Kalan: {usage.remainingWhatsAppMessages}</span>
                <span>{whatsappPercentage.toFixed(0)}% kullanıldı</span>
              </div>
              
              {excessWhatsApp > 0 && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                  <span className="text-orange-800">
                    Limit aşımı: <strong>{excessWhatsApp} mesaj</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing Summary */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Fatura Özeti</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {paymentService.formatPrice(usage.estimatedMonthlyTotal)}
              </div>
              <div className="text-sm text-blue-600 font-medium">Tahmini Aylık Toplam</div>
            </div>
            
            {usage.currentMonthAdditionalCharges > 0 && (
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {paymentService.formatPrice(usage.currentMonthAdditionalCharges)}
                </div>
                <div className="text-sm text-orange-600 font-medium">Ek Ücretler</div>
              </div>
            )}
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1">
                <Calendar className="h-4 w-4 text-gray-600" />
                <div className="text-sm text-gray-600">
                  Sonraki Sıfırlama
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">
                {paymentService.formatDate(usage.nextResetDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Warnings */}
        {(stopsPercentage >= 75 || whatsappPercentage >= 75) && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Kullanım Uyarısı</h4>
                <div className="text-sm text-yellow-700 mt-1">
                  {stopsPercentage >= 75 && (
                    <p>Durak limitinizin %{stopsPercentage.toFixed(0)}'ını kullandınız.</p>
                  )}
                  {whatsappPercentage >= 75 && (
                    <p>WhatsApp mesaj limitinizin %{whatsappPercentage.toFixed(0)}'ını kullandınız.</p>
                  )}
                  <p className="mt-1">
                    Limitinizi aşarsanız ek ücretler uygulanacaktır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};