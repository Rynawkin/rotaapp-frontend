// frontend/src/services/workspace.service.ts
import { api } from './api';

export interface Workspace {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  distanceUnit: 'km' | 'mi';
  currency: string;
  timeZone: string;
  language: string;
  defaultServiceTime: number;
  maximumDriverCount: number;
  active: boolean;
  createdAt: Date;
  subscription?: {
    plan: 'trial' | 'basic' | 'premium' | 'enterprise';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
    maxDrivers: number;
    maxRoutes: number;
    maxCustomers: number;
  };
}

export interface WorkspaceStats {
  totalWorkspaces: number;
  activeWorkspaces: number;
  trialWorkspaces: number;
  totalRevenue: number;
  totalUsers: number;
  totalRoutes: number;
}

export interface WorkspaceUsage {
  workspaceId: string;
  workspaceName: string;
  plan: string;
  status: 'active' | 'inactive';
  userCount: number;
  driverCount: number;
  routeCount: number;
  customerCount: number;
  lastActivity: Date;
  monthlyRevenue: number;
}

class WorkspaceService {
  // Get current workspace
  async getCurrentWorkspace(): Promise<Workspace> {
    const response = await api.get('/workspace');
    return response.data;
  }

  // Update current workspace
  async updateCurrentWorkspace(data: Partial<Workspace>): Promise<Workspace> {
    const response = await api.put('/workspace', data);
    return response.data;
  }

  // Super Admin endpoints (Backend'de yoksa simüle)
  async getAll(): Promise<Workspace[]> {
    try {
      const response = await api.get('/admin/workspaces');
      return response.data;
    } catch (error) {
      // Mock data fallback
      return [];
    }
  }

  async getById(id: string): Promise<Workspace | null> {
    try {
      const response = await api.get(`/admin/workspaces/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async getStats(): Promise<WorkspaceStats> {
    try {
      const response = await api.get('/admin/workspaces/stats');
      return response.data;
    } catch (error) {
      // Mock stats
      return {
        totalWorkspaces: 0,
        activeWorkspaces: 0,
        trialWorkspaces: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalRoutes: 0
      };
    }
  }

  async getUsageStats(): Promise<WorkspaceUsage[]> {
    try {
      const response = await api.get('/admin/workspaces/usage');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  async updateStatus(id: string, active: boolean): Promise<Workspace | null> {
    try {
      const response = await api.patch(`/admin/workspaces/${id}/status`, { active });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/admin/workspaces/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const workspaceService = new WorkspaceService();