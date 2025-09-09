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
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
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
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Backend yoksa mock data döndür
      return this.generateMockNotifications();
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get(`${this.baseUrl}/unread-count`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/${notificationId}/read`);
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
        id: 1,
        title: 'Yeni rota oluşturuldu',
        message: 'Rota #RT001 başarıyla oluşturuldu.',
        type: 'success',
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 dk önce
        userId: 'current-user',
        relatedEntityType: 'route',
        relatedEntityId: 1
      },
      {
        id: 2,
        title: 'Sürücü sefere başladı',
        message: 'Ali Yılmaz RT001 rotasına başladı.',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 dk önce
        userId: 'current-user',
        relatedEntityType: 'journey',
        relatedEntityId: 2
      },
      {
        id: 3,
        title: 'Haftalık rapor hazır',
        message: 'Haftalık performans raporu hazırlandı.',
        type: 'info',
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 saat önce
        userId: 'current-user',
        relatedEntityType: 'report'
      }
    ];
  }
}

export const notificationService = new NotificationService();