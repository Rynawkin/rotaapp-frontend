// frontend/src/services/journey.service.ts
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

// ✅ GÜNCELLENDİ: failedStops eklendi
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
  failedStops: number; // ✅ EKLENDI
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

export interface CompleteStopWithFilesDto {
  notes?: string;
  signatureFile?: File;
  photoFile?: File;
}

export interface FailStopDto {
  failureReason: string;
  notes?: string;
}

export interface BulkOperationResult {
  totalCount: number;
  successCount: number;
  failedCount: number;
  message: string;
  failedItems: BulkOperationFailedItem[];
}

export interface BulkOperationFailedItem {
  id: number;
  name?: string;
  reason: string;
}

class JourneyService {
  private baseUrl = '/workspace/journeys';

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

  async getActiveJourneys(): Promise<any[]> {
    try {
      const response = await api.get(`${this.baseUrl}/active`);
      console.log('Active journeys loaded with routes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active journeys:', error);
      throw error;
    }
  }

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
      const summaries = await this.getAllSummary();
      const summary = summaries.find(j => j.routeId === Number(routeId));
      
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
        console.log('Journey created, NOT auto-starting:', assignResponse.data.id);
        // Otomatik başlatma KALDIRILDI
        // const startResponse = await this.start(assignResponse.data.id);
        // return startResponse;
        return assignResponse.data;
      }
      
      return assignResponse.data;
    } catch (error: any) {
      console.error('Error starting journey from route:', error);
      throw new Error(error.response?.data?.message || error.message || 'Sefer başlatılamadı');
    }
  }

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

  async checkInStop(journeyId: string | number, stopId: string | number): Promise<boolean> {
    try {
      console.log('Checking in stop:', journeyId, stopId);
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/stops/${stopId}/checkin`
      );
      console.log('Check-in response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error checking in stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // ✅ DÜZELTİLDİ: Direkt FormData alıyor
  async completeStopWithFiles(
    journeyId: string | number,
    stopId: string | number,
    formData: FormData
  ): Promise<boolean> {
    try {
      console.log('Completing stop with files:', journeyId, stopId);
      
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/stops/${stopId}/complete`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Complete stop response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error completing stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  async failStop(
    journeyId: string | number,
    stopId: string | number,
    reason: string,
    notes?: string
  ): Promise<boolean> {
    try {
      console.log('Failing stop:', journeyId, stopId, reason, notes);
      
      const requestData: FailStopDto = {
        failureReason: reason,
        notes: notes
      };
      
      const response = await api.post(
        `${this.baseUrl}/${journeyId}/stops/${stopId}/fail`,
        requestData
      );
      
      console.log('Fail stop response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error failing stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  async completeStop(
    journeyId: string | number, 
    stopId: string | number, 
    data?: CompleteStopDto
  ): Promise<JourneyStatus> {
    try {
      console.warn('⚠️ completeStop() Base64 kullanıyor. Timeout riski var! completeStopWithFiles() kullanın.');
      console.log('Completing stop (legacy):', journeyId, stopId, data);
      
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

  async simulateMovement(journeyId: string | number): Promise<void> {
    console.warn('simulateMovement is a mock function for testing only');
  }

  async bulkCancel(journeyIds: number[], reason?: string): Promise<BulkOperationResult> {
    try {
      console.log('Bulk cancelling journeys:', journeyIds);
      const response = await api.post(`${this.baseUrl}/bulk/cancel`, {
        journeyIds,
        reason
      });
      console.log('Bulk cancel result:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error bulk cancelling journeys:', error);
      throw new Error(error.response?.data?.message || 'Toplu iptal işlemi başarısız');
    }
  }

  async bulkArchive(journeyIds: number[]): Promise<BulkOperationResult> {
    try {
      console.log('Bulk archiving journeys:', journeyIds);
      const response = await api.post(`${this.baseUrl}/bulk/archive`, {
        journeyIds
      });
      console.log('Bulk archive result:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error bulk archiving journeys:', error);
      throw new Error(error.response?.data?.message || 'Toplu arşivleme işlemi başarısız');
    }
  }

  async bulkDelete(journeyIds: number[], forceDelete: boolean = false): Promise<BulkOperationResult> {
    try {
      console.log('Bulk deleting journeys:', journeyIds, 'Force:', forceDelete);
      const response = await api.delete(`${this.baseUrl}/bulk/delete`, {
        data: {
          journeyIds,
          forceDelete
        }
      });
      console.log('Bulk delete result:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error bulk deleting journeys:', error);
      throw new Error(error.response?.data?.message || 'Toplu silme işlemi başarısız');
    }
  }
  
  async base64ToFile(base64String: string, filename: string): Promise<File> {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'image/png' });
    
    return new File([blob], filename, { type: 'image/png' });
  }
}

export const journeyService = new JourneyService();