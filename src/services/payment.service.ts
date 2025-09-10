// src/services/payment.service.ts

import { api } from './api';

// Payment Types
export type PlanType = 'Trial' | 'Starter' | 'Growth' | 'Professional' | 'Business';

export interface UpgradePlanRequest {
  planType: PlanType;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  successUrl?: string;
  failUrl?: string;
}

export interface UpgradePlanResponse {
  isSuccess: boolean;
  paymentUrl?: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface StartTrialResponse {
  isSuccess: boolean;
  trialEndDate?: string;
  errorMessage?: string;
}

export interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  paidDate?: string;
  status: 'Pending' | 'Paid' | 'Failed' | 'Cancelled';
  planType: PlanType;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface TrialLimits {
  maxStops: number;
  maxWhatsAppMessages: number;
  maxDrivers: number;
  maxVehicles: number;
}

export interface TrialStatusResponse {
  isActive: boolean;
  isExpired: boolean;
  startDate?: string;
  endDate?: string;
  remainingDays: number;
  limits?: TrialLimits;
}

export interface WorkspaceUsageDto {
  workspaceId: number;
  workspaceName: string;
  planType: PlanType;
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
  planType: PlanType;
  monthlyPrice: number;
  maxDrivers?: number;
  maxVehicles?: number;
  maxCustomers?: number;
  maxUsers: number;
  includedMonthlyStops: number;
  additionalStopPrice: number;
  hasCustomerWhatsAppNotifications: boolean;
  includedWhatsAppMessages: number;
  additionalWhatsAppPrice: number;
  hasTimeWindows: boolean;
  hasCustomerSatisfactionReport: boolean;
  hasRouteTemplates: boolean;
  hasCustomReports: boolean;
  proofArchiveDays: number;
}

class PaymentService {
  async startTrial(): Promise<StartTrialResponse> {
    try {
      const response = await api.post('/payment/start-trial');
      return response.data;
    } catch (error) {
      console.error('Start trial error:', error);
      throw error;
    }
  }

  async initiatePlanUpgrade(request: UpgradePlanRequest): Promise<UpgradePlanResponse> {
    try {
      const response = await api.post('/payment/initiate-upgrade', request);
      return response.data;
    } catch (error) {
      console.error('Initiate plan upgrade error:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<InvoiceResponse[]> {
    try {
      const response = await api.get('/payment/invoices');
      return response.data;
    } catch (error) {
      console.error('Get invoices error:', error);
      throw error;
    }
  }

  async getTrialStatus(): Promise<TrialStatusResponse> {
    try {
      const response = await api.get('/payment/trial-status');
      return response.data;
    } catch (error) {
      console.error('Get trial status error:', error);
      throw error;
    }
  }

  async getCurrentUsage(): Promise<WorkspaceUsageDto> {
    try {
      const response = await api.get('/subscription/usage');
      return response.data;
    } catch (error) {
      console.error('Get current usage error:', error);
      throw error;
    }
  }

  async getPlanLimits(planType: PlanType): Promise<PlanLimits> {
    try {
      const response = await api.get(`/subscription/plan-limits/${planType}`);
      return response.data;
    } catch (error) {
      console.error('Get plan limits error:', error);
      throw error;
    }
  }

  // Utility methods
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  }

  getPlanDisplayName(planType: PlanType): string {
    const planNames = {
      Trial: 'Deneme',
      Starter: 'Başlangıç',
      Growth: 'Büyüme',
      Professional: 'Profesyonel',
      Business: 'İşletme'
    };
    return planNames[planType] || planType;
  }

  getPlanColor(planType: PlanType): string {
    const planColors = {
      Trial: 'bg-gray-100 text-gray-800',
      Starter: 'bg-blue-100 text-blue-800',
      Growth: 'bg-green-100 text-green-800',
      Professional: 'bg-purple-100 text-purple-800',
      Business: 'bg-gold-100 text-gold-800'
    };
    return planColors[planType] || 'bg-gray-100 text-gray-800';
  }

  getInvoiceStatusColor(status: string): string {
    const statusColors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Paid: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  getInvoiceStatusDisplayName(status: string): string {
    const statusNames = {
      Pending: 'Bekliyor',
      Paid: 'Ödendi',
      Failed: 'Başarısız',
      Cancelled: 'İptal'
    };
    return statusNames[status] || status;
  }
}

export const paymentService = new PaymentService();