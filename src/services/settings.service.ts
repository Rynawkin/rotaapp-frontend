// frontend/src/services/settings.service.ts

import { api } from './api';

export interface WorkspaceSettings {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  taxNumber?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  currency?: string;
  timeZone?: string;
  language?: string;
  dateFormat?: string;
  firstDayOfWeek?: string;
}

export interface DeliverySettings {
  defaultServiceTime: number;
  maxDeliveriesPerRoute: number;
  defaultSignatureRequired: boolean;  // YENİ
  defaultPhotoRequired: boolean;      // YENİ
  workingHours: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  prioritySettings: {
    high: { color: string; maxDelay: number };
    normal: { color: string; maxDelay: number };
    low: { color: string; maxDelay: number };
  };
  autoOptimize: boolean;
  trafficConsideration: boolean;
  costPerKm?: number;
  costPerHour?: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  notificationEmail: string;
  notificationPhone: string;
  whatsAppSettings: {
    enabled: boolean;
    enableWhatsAppForJourneyStart: boolean;
    enableWhatsAppForCheckIn: boolean;
    enableWhatsAppForCompletion: boolean;
    enableWhatsAppForFailure: boolean;
    businessPhoneNumber: string;
    businessDisplayName: string;
  };
  events: {
    routeCompleted: boolean;
    deliveryFailed: boolean;
    driverDelayed: boolean;
    newCustomer: boolean;
    dailyReport: boolean;
  };
}

export interface TwilioStatus {
  connected: boolean;
  phoneNumber?: string;
  connectedAt?: Date;
}

export interface TwilioSignupResponse {
  signupUrl: string;
}

export interface DelayAlertSettings {
  enabled: boolean;
  thresholdHours: number;
  alertEmails: string;
}

export interface AllSettings {
  workspace: WorkspaceSettings;
  delivery: DeliverySettings;
  notifications: NotificationSettings;
}

class SettingsService {
  // Workspace Settings
  async getWorkspaceSettings(): Promise<WorkspaceSettings> {
    const response = await api.get('/settings/workspace');
    return response.data;
  }

  async updateWorkspaceSettings(settings: Partial<WorkspaceSettings>): Promise<void> {
    await api.put('/settings/workspace', settings);
  }

  // Delivery Settings
  async getDeliverySettings(): Promise<DeliverySettings> {
    const response = await api.get('/settings/delivery');
    return response.data;
  }

  async updateDeliverySettings(settings: Partial<DeliverySettings>): Promise<void> {
    await api.put('/settings/delivery', settings);
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get('/settings/notifications');
    return response.data;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    await api.put('/settings/notifications', settings);
  }

  // Twilio WhatsApp Integration
  async getTwilioStatus(): Promise<TwilioStatus> {
    const response = await api.get('/twilio/status');
    return response.data;
  }

  async connectTwilioWhatsApp(): Promise<TwilioSignupResponse> {
    const response = await api.get('/twilio/embedded-signup');
    return response.data;
  }

  async disconnectTwilioWhatsApp(): Promise<{ success: boolean }> {
    const response = await api.delete('/twilio/disconnect');
    return response.data;
  }

  // Delay Alert Settings
  async getDelayAlertSettings(): Promise<DelayAlertSettings> {
    const response = await api.get('/settings/delay-alerts');
    return response.data;
  }

  async updateDelayAlertSettings(settings: DelayAlertSettings): Promise<void> {
    await api.put('/settings/delay-alerts', settings);
  }

  // Get All Settings
  async getAllSettings(): Promise<AllSettings> {
    const response = await api.get('/settings/all');
    return response.data;
  }
}

export const settingsService = new SettingsService();