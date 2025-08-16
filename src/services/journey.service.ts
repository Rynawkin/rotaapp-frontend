import { api } from './api';
import { Journey, Route, JourneyStatus } from '@/types';

// Backend'deki JourneyStatusType enum'u
export enum JourneyStatusType {
  InTransit = 200,     // Yolda
  Arrived = 300,       // Varış yapıldı
  Processing = 400,    // İşlem yapılıyor
  Completed = 500,     // İşlem tamamlandı
  Delayed = 600,       // Gecikme var
  Cancelled = 700,     // İptal edildi (Başarısız durak için)
  OnHold = 800        // Bekletiliyor
}

export interface AssignRouteDto {
  routeId: number;
  driverId: number;
}

// ✅ GÜNCELLENDİ - Yeni field'lar eklendi
export interface AddJourneyStatusDto {
  stopId: number;
  status: JourneyStatusType;
  notes?: string;
  failureReason?: string;      // ✅ YENİ
  signatureBase64?: string;     // ✅ YENİ
  photoBase64?: string;         // ✅ YENİ
  latitude?: number;
  longitude?: number;
  additionalValues?: Record<string, string>;
}

// ✅ YENİ - Complete stop için özel DTO
export interface CompleteStopDto {
  notes?: string;
  signatureBase64?: string;
  photoBase64?: string;
}

// ✅ YENİ - Fail stop için özel DTO
export interface FailStopDto {
  failureReason: string;
  notes?: string;
}

class JourneyService {
  private baseUrl = '/workspace/journeys';

  async getAll(from?: Date, to?: Date): Promise<Journey[]> {
    try {
      const params: any = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();
      
      const response = await api.get(this.baseUrl, { params });
      console.log('Journeys loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journeys:', error);
      throw error;
    }
  }

  async getById(id: string | number): Promise<Journey> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      console.log('Journey loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey:', error);
      throw error;
    }
  }

  async getByRouteId(routeId: string | number): Promise<Journey | null> {
    try {
      const journeys = await this.getAll();
      return journeys.find(j => j.routeId === Number(routeId)) || null;
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
      // ✅ Hata mesajını kullanıcıya göster
      if (error.response?.data?.message) {
        throw error; // Hata mesajını koruyarak fırlat
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
        status: JourneyStatusType.Arrived, // 300
        notes: 'Durağa varıldı',
        latitude: 0,  // Gerçek koordinatlar alınabilir
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

  // ✅ GÜNCELLENDİ - Complete a stop delivery with signature and photo
  async completeStop(
    journeyId: string | number, 
    stopId: string | number, 
    data?: CompleteStopDto
  ): Promise<JourneyStatus> {
    try {
      console.log('Completing stop:', journeyId, stopId, data);
      
      // ✅ Base64 string'lerden data URL prefix'ini temizle
      const cleanBase64 = (base64String?: string) => {
        if (!base64String) return undefined;
        // "data:image/png;base64," veya "data:image/jpeg;base64," kısmını kaldır
        const base64Prefix = /^data:image\/[a-z]+;base64,/;
        return base64String.replace(base64Prefix, '');
      };
      
      const statusData: AddJourneyStatusDto = {
        stopId: Number(stopId),
        status: JourneyStatusType.Completed, // 500
        notes: data?.notes || 'Teslimat tamamlandı',
        signatureBase64: cleanBase64(data?.signatureBase64),  // ✅ Temizlenmiş imza
        photoBase64: cleanBase64(data?.photoBase64),          // ✅ Temizlenmiş fotoğraf
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

  // ✅ GÜNCELLENDİ - Mark stop as failed with reason and notes
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
        status: JourneyStatusType.Cancelled, // 700
        failureReason: reason,                // ✅ Başarısızlık nedeni
        notes: notes,                         // ✅ Ek notlar
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

  // ✅ GÜNCELLENDİ - Add status for a stop (generic)
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

  // Simulate movement for testing (only for development)
  async simulateMovement(journeyId: string | number): Promise<void> {
    console.warn('simulateMovement is a mock function for testing only');
    // Backend'de bu fonksiyon yok, sadece development için
    // SignalR entegrasyonu yapıldığında gerçek konum güncellemeleri alınacak
  }
}

export const journeyService = new JourneyService();