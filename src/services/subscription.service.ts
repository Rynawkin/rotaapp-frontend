// frontend/src/services/subscription.service.ts

import { api } from './api';

export interface UsageData {
  workspaceId: number;
  workspaceName: string;
  planType: string;
  includedMonthlyStops: number;
  currentMonthStops: number;
  remainingStops: number;
  includedWhatsAppMessages: number;
  currentMonthWhatsAppMessages: number;
  remainingWhatsAppMessages: number;
  currentMonthAdditionalCharges: number;
  estimatedMonthlyTotal: number;
  lastResetDate: string;
  nextResetDate: string;
}

export interface PlanLimits {
  monthlyPrice: number;
  includedMonthlyStops: number;
  includedWhatsAppMessages: number;
  additionalStopPrice: number;
  additionalWhatsAppPrice: number;
  maxDrivers: number;
}

export interface BillingSummary {
  plan: {
    name: string;
    monthlyPrice: number;
    currency: string;
  };
  usage: {
    stops: {
      used: number;
      included: number;
      extra: number;
      extraUnitPrice: number;
      extraCharges: number;
    };
    whatsApp: {
      used: number;
      included: number;
      extra: number;
      extraUnitPrice: number;
      extraCharges: number;
    };
  };
  summary: {
    basePrice: number;
    additionalCharges: number;
    estimatedTotal: number;
    currency: string;
    billingPeriod: {
      start: string;
      end: string;
    };
  };
}

class SubscriptionService {
  async getCurrentUsage(): Promise<UsageData> {
    const response = await api.get('/subscription/usage');
    return response.data;
  }

  async getPlanDetails(): Promise<{ currentPlan: string; limits: PlanLimits; currentUsage: UsageData }> {
    const response = await api.get('/subscription/plan');
    return response.data;
  }

  async getBillingSummary(): Promise<BillingSummary> {
    const response = await api.get('/subscription/billing-summary');
    return response.data;
  }

  async getWhatsAppUsage(): Promise<any> {
    const response = await api.get('/subscription/whatsapp-usage');
    return response.data;
  }
}

export const subscriptionService = new SubscriptionService();