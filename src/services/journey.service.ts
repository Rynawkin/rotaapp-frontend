import { api } from './api';
import { Journey, Route, JourneyStatus } from '@/types';

export interface AssignRouteDto {
  routeId: number;
  driverId: number;
}

export interface AddJourneyStatusDto {
  status: string;
  notes?: string;
  latitude: number;
  longitude: number;
  additionalValues?: Record<string, string>;
}

class JourneyService {
  private baseUrl = '/workspace/journeys';  // DÜZELTME: /api/ kaldırıldı

  async getAll(from?: Date, to?: Date): Promise<Journey[]> {
    try {
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const response = await api.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching journeys:', error);
      throw error;
    }
  }

  async getById(id: string | number): Promise<Journey> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey:', error);
      throw error;
    }
  }

  async getByRouteId(routeId: string | number): Promise<Journey | null> {
    try {
      // Get all journeys and find the one with matching routeId
      const journeys = await this.getAll();
      return journeys.find(j => j.routeId === routeId) || null;
    } catch (error) {
      console.error('Error fetching journey by route:', error);
      return null;
    }
  }

  async getStatuses(journeyId: string | number): Promise<JourneyStatus[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${journeyId}/statuses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey statuses:', error);
      throw error;
    }
  }

  // Start journey from route (assign route to driver and create journey)
  async startFromRoute(routeId: string | number, driverId?: number): Promise<Journey> {
    try {
      // First, get the route to check if it has driver assigned
      const route = await api.get(`/workspace/journeys/routes/${routeId}`);  // DÜZELTME
      
      if (!route.data.driverId && !driverId) {
        throw new Error('Sefer başlatmak için sürücü atamanız gerekiyor');
      }

      if (!route.data.vehicleId) {
        throw new Error('Sefer başlatmak için araç atamanız gerekiyor');
      }

      const assignDto: AssignRouteDto = {
        routeId: Number(routeId),
        driverId: Number(driverId || route.data.driverId)
      };

      const response = await api.post(`${this.baseUrl}/assignment`, assignDto);
      
      // Start the journey immediately after assignment
      if (response.data && response.data.id) {
        await this.start(response.data.id);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error starting journey from route:', error);
      throw new Error(error.response?.data?.message || error.message || 'Sefer başlatılamadı');
    }
  }

  // Start an existing journey
  async start(journeyId: string | number): Promise<Journey> {
    try {
      const response = await api.post(`${this.baseUrl}/${journeyId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting journey:', error);
      throw error;
    }
  }

  // Finish journey
  async finish(journeyId: string | number): Promise<Journey> {
    try {
      const response = await api.post(`${this.baseUrl}/${journeyId}/finish`);
      return response.data;
    } catch (error) {
      console.error('Error finishing journey:', error);
      throw error;
    }
  }

  // Cancel journey
  async cancel(journeyId: string | number): Promise<Journey> {
    try {
      const response = await api.post(`${this.baseUrl}/${journeyId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling journey:', error);
      throw error;
    }
  }

  // Update journey status (for driver app)
  async updateStatus(journeyId: string | number, status: 'preparing' | 'in_progress' | 'completed' | 'cancelled'): Promise<Journey> {
    try {
      // This would be a custom endpoint depending on your backend
      // For now, we'll use start/finish/cancel methods
      switch (status) {
        case 'in_progress':
          return await this.start(journeyId);
        case 'completed':
          return await this.finish(journeyId);
        case 'cancelled':
          return await this.cancel(journeyId);
        default:
          throw new Error('Invalid status');
      }
    } catch (error) {
      console.error('Error updating journey status:', error);
      throw error;
    }
  }

  // Add status for a stop
  async addStopStatus(
    journeyId: string | number, 
    stopId: string | number, 
    statusData: AddJourneyStatusDto
  ): Promise<JourneyStatus> {
    try {
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/status/${stopId}`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error('Error adding stop status:', error);
      throw error;
    }
  }

  // Optimize journey route
  async optimizeRoute(journeyId: string | number): Promise<Journey> {
    try {
      const response = await api.post(`${this.baseUrl}/${journeyId}/optimize`);
      return response.data;
    } catch (error) {
      console.error('Error optimizing journey:', error);
      throw error;
    }
  }
}

export const journeyService = new JourneyService();