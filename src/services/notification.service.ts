import { api } from './api';

// SignalR için
declare global {
  interface Window {
    signalRService?: {
      onNotificationReceived: (callback: (notification: Notification) => void) => void;
      offNotificationReceived: (callback: (notification: Notification) => void) => void;
    };
  }
}

export interface Notification {
  id: string; // Backend uses Guid
  title: string;
  message: string;
  type: string; // Backend uses enum string like "JOURNEY_ASSIGNED"
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  data?: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
}

class NotificationService {
  private baseUrl = '/notifications';
  private notificationCallbacks: ((notification: Notification) => void)[] = [];

  constructor() {
    this.setupSignalRListeners();
  }

  private setupSignalRListeners() {
    // SignalR service hazır olduğunda listener'ları kur
    const checkSignalR = () => {
      if (window.signalRService) {
        window.signalRService.onNotificationReceived(this.handleNotificationReceived.bind(this));
      } else {
        setTimeout(checkSignalR, 1000);
      }
    };
    checkSignalR();
  }

  private handleNotificationReceived(notification: Notification) {
    console.log('New notification received:', notification);
    this.notificationCallbacks.forEach(callback => callback(notification));
  }

  onNotificationReceived(callback: (notification: Notification) => void) {
    this.notificationCallbacks.push(callback);
  }

  offNotificationReceived(callback: (notification: Notification) => void) {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }

  async getAll(): Promise<Notification[]> {
    try {
      const response = await api.get(this.baseUrl);
      // Backend returns NotificationsListResponse with notifications array
      if (response.data && Array.isArray(response.data.notifications)) {
        return response.data.notifications;
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Backend yoksa mock data döndür
      return this.generateMockNotifications();
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get(`${this.baseUrl}/unread-count`);
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/${notificationId}/mark-read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/mark-all-read`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getStats(): Promise<NotificationStats> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, unread: 0 };
    }
  }

  // Real-time bildirimler için
  generateMockNotifications(): Notification[] {
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Yeni sefer atandı',
        message: 'Size yeni bir sefer atandı: Rota #RT001.',
        type: 'JOURNEY_ASSIGNED',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 dk önce
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Sefer durumu değişti',
        message: 'Rota RT001 seferi başlatıldı.',
        type: 'JOURNEY_STATUS_CHANGED',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 dk önce
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Sistem duyurusu',
        message: 'Haftalık performans raporu hazırlandı.',
        type: 'SYSTEM_ANNOUNCEMENT',
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 saat önce
        readAt: new Date(Date.now() - 50 * 60 * 1000).toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Termin hatırlatması',
        message: 'Müşteri ABC Ltd. teslimat termini yaklaşıyor.',
        type: 'DEADLINE_REMINDER',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 dk önce
      }
    ];
  }
}

export const notificationService = new NotificationService();