import { api } from './api';

export interface NotificationRoleMapping {
  id?: number;
  workspaceId?: number;
  contactRole: string;
  notificationType: string;
  isEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoleOption {
  key: string;
  value: string;
}

export interface NotificationTypeOption {
  key: string;
  value: string;
}

class NotificationRoleMappingService {
  // Get all notification role mappings
  async getAll(): Promise<NotificationRoleMapping[]> {
    try {
      const response = await api.get('/NotificationRoleMapping');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification role mappings:', error);
      throw error;
    }
  }

  // Get available roles
  async getRoles(): Promise<RoleOption[]> {
    try {
      const response = await api.get('/NotificationRoleMapping/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  // Get available notification types
  async getNotificationTypes(): Promise<NotificationTypeOption[]> {
    try {
      const response = await api.get('/NotificationRoleMapping/notification-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification types:', error);
      throw error;
    }
  }

  // Bulk update mappings
  async bulkUpdate(mappings: NotificationRoleMapping[]): Promise<void> {
    try {
      await api.post('/NotificationRoleMapping/bulk-update', mappings);
    } catch (error) {
      console.error('Error bulk updating notification role mappings:', error);
      throw error;
    }
  }

  // Reset to default mappings
  async resetToDefaults(): Promise<void> {
    try {
      await api.post('/NotificationRoleMapping/reset-defaults');
    } catch (error) {
      console.error('Error resetting notification role mappings to defaults:', error);
      throw error;
    }
  }
}

export const notificationRoleMappingService = new NotificationRoleMappingService();