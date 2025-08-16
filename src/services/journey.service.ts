import { api } from './api';
import { Journey, Route, JourneyStatus } from '@/types';

// Backend'deki JourneyStatusType enum'u
export enum JourneyStatusType {
  InTransit = 200,
  Arrived = 300,
  Processing = 400,
  Completed = 500,
  Delayed = 600,
  Cancelled = 700,
  OnHold = 800
}

// Journey özet bilgisi için yeni tip
export interface JourneySummary {
  id: number;
  routeId: number;
  routeName: string;
  date: string;
  status: string;
  
  // Sürücü
  driverId?: string;
  driverName: string;
  
  // Araç
  vehicleId?: string;
  vehiclePlateNumber: string;
  
  // Metrikler
  totalStops: number;
  completedStops: number;
  totalDistance: number;
  totalDuration: number;
  
  // Zamanlar
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  
  // Live location
  liveLocation?: {
    latitude: number;
    longitude: number;
    speed?: number;
  };
}

export interface AssignRouteDto {
  routeId: number;
  driverId: number;
}

export interface AddJourneyStatusDto {
  stopId: number;
  status: JourneyStatusType;
  notes?: string;
  failureReason?: string;
  signatureBase64?: string;
  photoBase64?: string;
  latitude?: number;
  longitude?: number;
  additionalValues?: Record<string, string>;
}

export interface CompleteStopDto {
  notes?: string;
  signatureBase64?: string;
  photoBase64?: string;
}

export interface FailStopDto {
  failureReason: string;
  notes?: string;
}

class JourneyService {
  private baseUrl = '/workspace/journeys';

  /**
   * ✅ YENİ - Sadece özet bilgi için (Dashboard, Journeys listesi)
   * PERFORMANS: 90% daha az veri
   */
  async getAllSummary(from?: Date, to?: Date): Promise<JourneySummary[]> {
    try {
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const response = await api.get(`${this.baseUrl}/summary`, { params });
      console.log('Journey summaries loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey summaries:', error);
      throw error;
    }
  }

  /**
   * ⚠️ DİKKAT: Sadece gerçekten tüm detay gerektiğinde kullan!
   * Örnek: Journey detay sayfası, export işlemleri
   */
  async getAll(from?: Date, to?: Date): Promise<Journey[]> {
    try {
      console.warn('⚠️ getAll() tüm detayları çekiyor. Eğer sadece liste için kullanıyorsanız getAllSummary() kullanın!');
      
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const response = await api.get(this.baseUrl, { params });
      console.log('Full journeys loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journeys:', error);
      throw error;
    }
  }

  /**
   * ✅ Tek journey detayı - Detay sayfası için
   */
  async getById(id: string | number): Promise<Journey> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      console.log('Journey detail loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey:', error);
      throw error;
    }
  }

  async getByRouteId(routeId: string | number): Promise<Journey | null> {
    try {
      // Önce özet bilgiyle kontrol et
      const summaries = await this.getAllSummary();
      const summary = summaries.find(j => j.routeId === Number(routeId));
      
      // Eğer bulunduysa, detayını çek
      if (summary) {
        return await this.getById(summary.id);
      }
      
      return null;
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

  // Start journey from route
  async startFromRoute(routeId: string | number, driverId?: number): Promise<Journey> {
    try {
      console.log('Starting journey from route:', routeId, 'with driver:', driverId);
      
      const route = await api.get(`/workspace/routes/${routeId}`);
      console.log('Route data:', route.data);
      
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

      console.log('Assigning route:', assignDto);
      const assignResponse = await api.post(`${this.baseUrl}/assignment`, assignDto);
      console.log('Journey created:', assignResponse.data);
      
      if (assignResponse.data && assignResponse.data.id) {
        console.log('Starting journey:', assignResponse.data.id);
        const startResponse = await this.start(assignResponse.data.id);
        return startResponse;
      }
      
      return assignResponse.data;
    } catch (error: any) {
      console.error('Error starting journey from route:', error);
      throw new Error(error.response?.data?.message || error.message || 'Sefer başlatılamadı');
    }
  }

  // Start an existing journey
  async start(journeyId: string | number): Promise<Journey> {
    try {
      console.log('Starting journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/start`);
      console.log('Journey started:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error starting journey:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  // Finish journey
  async finish(journeyId: string | number): Promise<Journey> {
    try {
      console.log('Finishing journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/finish`);
      return response.data;
    } catch (error: any) {
      console.error('Error finishing journey:', error);
      if (error.response?.data?.message) {
        throw error;
      }
      throw error;
    }
  }

  // Cancel journey
  async cancel(journeyId: string | number): Promise<Journey> {
    try {
      console.log('Cancelling journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling journey:', error);
      throw error;
    }
  }

  // Check-in to a stop
  async checkInStop(journeyId: string | number, stopId: string | number): Promise<JourneyStatus> {
    try {
      console.log('Checking in stop:', journeyId, stopId);
      const statusData: AddJourneyStatusDto = {
        stopId: Number(stopId),
        status: JourneyStatusType.Arrived,
        notes: 'Durağa varıldı',
        latitude: 0,
        longitude: 0
      };
      
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/status`,
        statusData
      );
      console.log('Check-in response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error checking in stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Complete a stop delivery with signature and photo
  async completeStop(
    journeyId: string | number, 
    stopId: string | number, 
    data?: CompleteStopDto
  ): Promise<JourneyStatus> {
    try {
      console.log('Completing stop:', journeyId, stopId, data);
      
      // Base64 string'lerden data URL prefix'ini temizle
      const cleanBase64 = (base64String?: string) => {
        if (!base64String) return undefined;
        const base64Prefix = /^data:image\/[a-z]+;base64,/;
        return base64String.replace(base64Prefix, '');
      };
      
      const statusData: AddJourneyStatusDto = {
        stopId: Number(stopId),
        status: JourneyStatusType.Completed,
        notes: data?.notes || 'Teslimat tamamlandı',
        signatureBase64: cleanBase64(data?.signatureBase64),
        photoBase64: cleanBase64(data?.photoBase64),
        latitude: 0,
        longitude: 0
      };
      
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/status`,
        statusData
      );
      console.log('Complete stop response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error completing stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Mark stop as failed with reason and notes
  async failStop(
    journeyId: string | number, 
    stopId: string | number, 
    reason: string,
    notes?: string
  ): Promise<JourneyStatus> {
    try {
      console.log('Failing stop:', journeyId, stopId, reason, notes);
      const statusData: AddJourneyStatusDto = {
        stopId: Number(stopId),
        status: JourneyStatusType.Cancelled,
        failureReason: reason,
        notes: notes,
        latitude: 0,
        longitude: 0
      };
      
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/status`,
        statusData
      );
      console.log('Fail stop response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error failing stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Add status for a stop (generic)
  async addStopStatus(
    journeyId: string | number, 
    stopId: string | number, 
    statusData: Partial<AddJourneyStatusDto>
  ): Promise<JourneyStatus> {
    try {
      const fullStatusData: AddJourneyStatusDto = {
        stopId: Number(stopId),
        status: statusData.status || JourneyStatusType.InTransit,
        notes: statusData.notes,
        failureReason: statusData.failureReason,
        signatureBase64: statusData.signatureBase64,
        photoBase64: statusData.photoBase64,
        latitude: statusData.latitude || 0,
        longitude: statusData.longitude || 0,
        additionalValues: statusData.additionalValues
      };
      
      console.log('Adding stop status:', journeyId, fullStatusData);
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/status`,
        fullStatusData
      );
      return response.data;
    } catch (error: any) {
      console.error('Error adding stop status:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Optimize journey route
  async optimizeRoute(journeyId: string | number): Promise<Journey> {
    try {
      console.log('Optimizing journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/optimize`);
      return response.data;
    } catch (error) {
      console.error('Error optimizing journey:', error);
      throw error;
    }
  }

  // ✅ YENİ - Update journey status (pause/resume için)
  async updateStatus(journeyId: string | number, status: string): Promise<Journey> {
    try {
      console.log('Updating journey status:', journeyId, status);
      const response = await api.put(`${this.baseUrl}/${journeyId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating journey status:', error);
      throw error;
    }
  }

  // Simulate movement for testing (only for development)
  async simulateMovement(journeyId: string | number): Promise<void> {
    console.warn('simulateMovement is a mock function for testing only');
  }
}

export const journeyService = new JourneyService();