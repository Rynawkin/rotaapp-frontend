import { api } from './api';

export const adminService = {
  async getWorkspaceStats() {
    const response = await api.get('/admin/workspaces/stats');
    return response.data;
  },

  async getWorkspaceUsage() {
    const response = await api.get('/admin/workspaces/usage');
    return response.data;
  },

  async getAllWorkspaces() {
    const response = await api.get('/admin/workspaces');
    return response.data;
  },

  async getWorkspaceById(id: string) {
    const response = await api.get(`/admin/workspaces/${id}`);
    return response.data;
  },

  async updateWorkspaceStatus(id: string, active: boolean) {
    const response = await api.patch(`/admin/workspaces/${id}/status`, { active });
    return response.data;
  },

  async deleteWorkspace(id: string) {
    const response = await api.delete(`/admin/workspaces/${id}`);
    return response.data;
  },

  async getWorkspaceSubscription(id: string) {
    const response = await api.get(`/admin/workspaces/${id}/subscription`);
    return response.data;
  },
  
  async updateWorkspacePlan(id: string, planType: string) {
    const response = await api.put(`/admin/workspaces/${id}/plan`, { planType });
    return response.data;
  },
  
  async resetWorkspaceUsage(id: string) {
    const response = await api.post(`/admin/workspaces/${id}/reset-usage`);
    return response.data;
  },
  
  async getAvailablePlans() {
    const response = await api.get('/admin/plans');
    return response.data;
  },

  // Issue Management Methods - YENİ EKLENEN
  async getIssues(params?: any) {
    const response = await api.get('/workspace/issues', { params });
    return response.data;
  },

  async updateIssueStatus(issueId: number, data: { status: string; adminNotes?: string }) {
    const response = await api.put(`/workspace/issues/${issueId}/status`, data);
    return response.data;
  },

  // Marketing Lead Management Methods - YENİ EKLENEN
  async getMarketingLeads(params?: any) {
    const response = await api.get('/marketinglead', { params });
    return response.data;
  },

  async getMarketingLead(id: number) {
    const response = await api.get(`/marketinglead/${id}`);
    return response.data;
  },

  async updateMarketingLead(id: number, data: { status: number; adminNotes?: string; assignedTo?: string }) {
    const response = await api.put(`/marketinglead/${id}`, data);
    return response.data;
  },

  async getMarketingLeadStats() {
    const response = await api.get('/marketinglead/stats');
    return response.data;
  }
};