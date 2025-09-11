// src/components/payment/UpgradePlan.tsx

import React, { useState, useEffect } from 'react';
import { Check, Loader2, X, Star, Zap, Shield, Crown } from 'lucide-react';
import { paymentService, type PlanType, type PlanLimits, type UpgradePlanRequest } from '../../services/payment.service';

interface UpgradePlanProps {
  onClose?: () => void;
  currentPlan?: PlanType;
  className?: string;
}

const planFeatures = {
  Starter: {
    icon: <Zap className="h-6 w-6" />,
    color: 'blue',
    features: [
      '3 sürücü, 3 araç',
      '100 müşteri',
      '2 kullanıcı',
      '500 durak/ay (ek 3₺)',
      'WhatsApp yok',
      'Rota şablonları',
      '30 gün kanıt arşivi'
    ]
  },
  Growth: {
    icon: <Star className="h-6 w-6" />,
    color: 'green',
    features: [
      'Sınırsız sürücü & araç',
      '1.000 müşteri',
      '10 kullanıcı',
      '500 durak/ay (ek 3₺)',
      '100 WhatsApp/ay (ek 0,50₺)',
      'Zaman penceresi',
      'Müşteri memnuniyet raporu',
      '90 gün kanıt arşivi'
    ]
  },
  Professional: {
    icon: <Shield className="h-6 w-6" />,
    color: 'purple',
    features: [
      'Sınırsız sürücü & araç',
      '1.000 müşteri',
      '10 kullanıcı',
      '2.000 durak/ay (ek 2₺)',
      '100 WhatsApp/ay (ek 0,50₺)',
      'Gelişmiş özellikler',
      'Öncelik desteği',
      '90 gün kanıt arşivi'
    ]
  },
  Business: {
    icon: <Crown className="h-6 w-6" />,
    color: 'yellow',
    features: [
      'Sınırsız her şey',
      'Sınırsız müşteri',
      '50 kullanıcı',
      '5.000 durak/ay (ek 1,5₺)',
      '500 WhatsApp/ay (ek 0,30₺)',
      'Özel raporlar',
      'Özel entegrasyon',
      '365 gün kanıt arşivi'
    ]
  }
};

export const UpgradePlan: React.FC<UpgradePlanProps> = ({
  onClose,
  currentPlan = 'Trial',
  className = ''
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Growth');
  const [planLimits, setPlanLimits] = useState<Record<PlanType, PlanLimits>>({} as any);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadPlanLimits();
  }, []);

  const loadPlanLimits = async () => {
    try {
      const plans: PlanType[] = ['Starter', 'Growth', 'Professional', 'Business'];
      const limits: Record<string, PlanLimits> = {};
      
      for (const plan of plans) {
        const planLimit = await paymentService.getPlanLimits(plan);
        limits[plan] = planLimit;
      }
      
      setPlanLimits(limits as Record<PlanType, PlanLimits>);
    } catch (error) {
      console.error('Error loading plan limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Lütfen tüm bilgileri doldurun');
      return;
    }

    setUpgrading(true);
    try {
      const request: UpgradePlanRequest = {
        planType: selectedPlan,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/failed`
      };

      const result = await paymentService.initiatePlanUpgrade(request);
      
      if (result.isSuccess && result.paymentUrl) {
        // Redirect to payment provider
        window.location.href = result.paymentUrl;
      } else {
        alert(result.errorMessage || 'Ödeme başlatılamadı');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      alert(errorMessage);
    } finally {
      setUpgrading(false);
    }
  };

  const getColorClasses = (color: string, selected: boolean) => {
    const colors = {
      blue: selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
      green: selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
      purple: selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300',
      yellow: selected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      yellow: 'text-yellow-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const availablePlans: PlanType[] = ['Starter', 'Growth', 'Professional', 'Business'];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Planınızı Yükseltin</h2>
          <p className="text-sm text-gray-600 mt-1">
            İhtiyaçlarınıza uygun planı seçin ve daha fazla özellikten yararlanın
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {availablePlans.map((plan) => {
            const planInfo = planFeatures[plan];
            const limits = planLimits[plan];
            const isSelected = selectedPlan === plan;
            const isCurrent = currentPlan === plan;

            return (
              <div
                key={plan}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  getColorClasses(planInfo.color, isSelected)
                } ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isCurrent && setSelectedPlan(plan)}
              >
                {isCurrent && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      Mevcut
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-3">
                  <div className={getIconColor(planInfo.color)}>
                    {planInfo.icon}
                  </div>
                  <h3 className="font-semibold">{paymentService.getPlanDisplayName(plan)}</h3>
                </div>

                {limits && (
                  <div className="mb-3">
                    <div className="text-2xl font-bold text-gray-900">
                      {paymentService.formatPrice(limits.monthlyPrice)}
                    </div>
                    <div className="text-sm text-gray-600">aylık</div>
                  </div>
                )}

                <ul className="space-y-1 text-sm">
                  {planInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Fatura Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad *
              </label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta *
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+90 555 123 45 67"
              />
            </div>
          </div>
        </div>

        {/* Selected Plan Summary */}
        {planLimits[selectedPlan] && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  {paymentService.getPlanDisplayName(selectedPlan)} Planı
                </h3>
                <p className="text-sm text-blue-700">
                  Aylık {paymentService.formatPrice(planLimits[selectedPlan].monthlyPrice)}
                </p>
              </div>
              <div className="text-blue-600">
                {planFeatures[selectedPlan].icon}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={upgrading}
            >
              İptal
            </button>
          )}
          <button
            onClick={handleUpgrade}
            disabled={upgrading || currentPlan === selectedPlan}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upgrading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {upgrading ? 'Yönlendiriliyor...' : 'Ödemeye Geç'}
          </button>
        </div>
      </div>
    </div>
  );
};