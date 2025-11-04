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
  name?: string;
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

// ✅ GÜNCELLENDİ: name ve startKm eklendi
export interface AssignRouteDto {
  routeId: number;
  driverId: number;
  name?: string; // ✅ YENİ EKLENEN
  startKm: number; // ✅ YENİ EKLENEN - Başlangıç kilometresi (ZORUNLU)
}

// ✅ YENİ: Stop detayları interface
export interface StopDetails {
  signatureUrl?: string;
  photoUrl?: string;
  receiverName?: string;
  notes?: string;
  failureReason?: string;
  status?: string;
  createdAt?: string;
}

export interface AddJourneyStatusDto {
  stopId: number;
  status: JourneyStatusType;
  notes?: string;
  failureReason?: string;
  receiverName?: string; // ✅ YENİ EKLENEN
  signatureBase64?: string;
  photoBase64?: string;
  latitude?: number;
  longitude?: number;
  additionalValues?: Record<string, string>;
}

export interface CompleteStopDto {
  notes?: string;
  receiverName?: string; // ✅ YENİ EKLENEN
  signature?: File | Blob;  // Blob desteği
  photo?: File | Blob;      // Blob desteği
}

export interface CompleteStopWithFilesDto {
  notes?: string;
  receiverName?: string; // ✅ YENİ EKLENEN
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

// ✅ YENİ: Cloudinary transformation interface
export interface ImageTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'thumb' | 'scale';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
}

// ✅ YENİ: Stop Photo interface
export interface StopPhoto {
  id: number;
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  displayOrder: number;
  createdAt: string;
}

class JourneyService {
  private baseUrl = '/workspace/journeys';

  // ✅ YENİ: Cloudinary URL helper metodları
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }

  getOptimizedImageUrl(url: string, transformation: ImageTransformation): string {
    if (!url || !this.isCloudinaryUrl(url)) return url;

    // Cloudinary URL format: https://res.cloudinary.com/{cloud-name}/image/upload/{transformations}/{public-id}.{format}
    const transformParts: string[] = [];

    if (transformation.width) transformParts.push(`w_${transformation.width}`);
    if (transformation.height) transformParts.push(`h_${transformation.height}`);
    if (transformation.crop) transformParts.push(`c_${transformation.crop}`);
    if (transformation.quality) transformParts.push(`q_${transformation.quality}`);
    if (transformation.format) transformParts.push(`f_${transformation.format}`);

    const transformString = transformParts.join(',');

    // URL'de zaten transformation varsa değiştir, yoksa ekle
    if (url.includes('/upload/')) {
      // Check if there's already a transformation
      const parts = url.split('/upload/');
      const afterUpload = parts[1];

      // Check if first part after upload starts with v{number} (version)
      const segments = afterUpload.split('/');
      if (segments[0].match(/^v\d+$/)) {
        // Has version, add transformation after upload
        return `${parts[0]}/upload/${transformString}/${afterUpload}`;
      } else if (segments[0].includes('_')) {
        // Has existing transformation, replace it
        const publicIdIndex = segments.findIndex(s => !s.includes('_') || s.includes('.'));
        const publicIdParts = segments.slice(publicIdIndex);
        return `${parts[0]}/upload/${transformString}/${publicIdParts.join('/')}`;
      } else {
        // No transformation, add it
        return `${parts[0]}/upload/${transformString}/${afterUpload}`;
      }
    }

    return url;
  }

  getThumbnailUrl(url: string): string {
    return this.getOptimizedImageUrl(url, {
      width: 200,
      height: 200,
      crop: 'thumb',
      quality: 'auto',
      format: 'auto'
    });
  }

  getEmailOptimizedUrl(url: string, type: 'signature' | 'photo'): string {
    if (type === 'signature') {
      return this.getOptimizedImageUrl(url, {
        width: 400,
        height: 200,
        crop: 'limit',
        quality: 'auto',
        format: 'auto'
      });
    } else {
      return this.getOptimizedImageUrl(url, {
        width: 600,
        height: 400,
        crop: 'limit',
        quality: 'auto',
        format: 'auto'
      });
    }
  }

  getWhatsAppOptimizedUrl(url: string): string {
    return this.getOptimizedImageUrl(url, {
      width: 300,
      height: 300,
      crop: 'limit',
      quality: 80,
      format: 'jpg'
    });
  }

  // ✅ YENİ: URL'leri normalize et (Base64, Cloudinary, Local desteği)
  normalizeImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // Base64 data URL ise direkt döndür
    if (url.startsWith('data:')) {
      return url;
    }

    // Tam URL ise direkt döndür
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Cloudinary URL kontrolü
    if (url.includes('cloudinary.com')) {
      return url;
    }

    // Relative URL ise base URL ekle (legacy local storage desteği)
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5055';
    return `${baseUrl}${url}`;
  }

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

  async getStaticMapUrl(journeyId: number): Promise<string> {
    try {
      const response = await api.get(`/workspace/journeys/${journeyId}/static-map`);
      return response.data.staticMapUrl;
    } catch (error) {
      console.error('Static map URL error:', error);
      throw error;
    }
  }

  async getById(id: string | number): Promise<Journey> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      console.log('Journey detail loaded:', response.data);

      // ✅ YENİ: Image URL'lerini normalize et
      if (response.data && response.data.statuses) {
        response.data.statuses = response.data.statuses.map((status: any) => ({
          ...status,
          signatureUrl: this.normalizeImageUrl(status.signatureUrl),
          photoUrl: this.normalizeImageUrl(status.photoUrl)
        }));
      }

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

      // ✅ YENİ: Image URL'lerini normalize et
      const statuses = response.data.map((status: any) => ({
        ...status,
        signatureUrl: this.normalizeImageUrl(status.signatureUrl),
        photoUrl: this.normalizeImageUrl(status.photoUrl)
      }));

      return statuses;
    } catch (error) {
      console.error('Error fetching journey statuses:', error);
      throw error;
    }
  }

  // ✅ YENİ: Stop fotoğraflarını getir
  async getStopPhotos(journeyId: string | number): Promise<StopPhoto[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${journeyId}/photos`);
      console.log('Journey photos loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching journey photos:', error);
      return [];
    }
  }

  // ✅ YENİ: Belirli bir stop için fotoğrafları getir
  async getStopPhotosForStatus(journeyId: number, stopId: number): Promise<StopPhoto[]> {
    try {
      const response = await api.get(`${this.baseUrl}/${journeyId}/stops/${stopId}/photos`);
      console.log('Stop photos loaded:', response.data);
      
      // Property isimlerini normalize et (backend C# PascalCase döndürüyor)
      const photos = response.data.map((photo: any) => ({
        id: photo.Id || photo.id,
        photoUrl: photo.PhotoUrl || photo.photoUrl,
        thumbnailUrl: photo.ThumbnailUrl || photo.thumbnailUrl,
        caption: photo.Caption || photo.caption,
        displayOrder: photo.DisplayOrder || photo.displayOrder,
        createdAt: photo.CreatedAt || photo.createdAt
      }));
      
      // Duplicate fotoğrafları filtrele
      const uniquePhotos = photos.filter((photo: StopPhoto, index: number, self: StopPhoto[]) =>
        index === self.findIndex((p) => p.photoUrl === photo.photoUrl)
      );
      
      return uniquePhotos;
    } catch (error) {
      console.error('Error fetching stop photos:', error);
      return [];
    }
  }

  // ✅ YENİ: Stop detaylarını getir (imza, teslim alan kişi vs.)
  async getStopDetails(journeyId: number, stopId: number): Promise<StopDetails | null> {
    try {
      const response = await api.get(`${this.baseUrl}/${journeyId}/stops/${stopId}/details`);
      console.log('Stop details loaded:', response.data);
      
      // URL'leri normalize et
      if (response.data) {
        return {
          ...response.data,
          signatureUrl: this.normalizeImageUrl(response.data.signatureUrl || response.data.SignatureUrl),
          photoUrl: this.normalizeImageUrl(response.data.photoUrl || response.data.PhotoUrl),
          receiverName: response.data.receiverName || response.data.ReceiverName,
          notes: response.data.notes || response.data.Notes,
          failureReason: response.data.failureReason || response.data.FailureReason,
          status: response.data.status || response.data.Status,
          createdAt: response.data.createdAt || response.data.CreatedAt
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching stop details:', error);
      return null;
    }
  }

  // ✅ GÜNCELLENDİ: name ve startKm parametreleri eklendi
  async startFromRoute(routeId: string | number, driverId?: number, name?: string, startKm?: number): Promise<Journey> {
    try {
      console.log('Starting journey from route:', routeId, 'with driver:', driverId, 'name:', name, 'startKm:', startKm);

      const route = await api.get(`/workspace/routes/${routeId}`);
      console.log('Route data:', route.data);

      if (!route.data.driverId && !driverId) {
        throw new Error('Sefer başlatmak için sürücü atamanız gerekiyor');
      }

      if (!route.data.vehicleId) {
        throw new Error('Sefer başlatmak için araç atamanız gerekiyor');
      }

      // StartKm kontrolü - zorunlu
      if (startKm === undefined || startKm === null) {
        throw new Error('Başlangıç kilometresi girmeniz gerekiyor');
      }

      if (startKm < 0) {
        throw new Error('Başlangıç kilometresi 0\'dan küçük olamaz');
      }

      const assignDto: AssignRouteDto = {
        routeId: Number(routeId),
        driverId: Number(driverId || route.data.driverId),
        name: name, // ✅ YENİ EKLENEN
        startKm: startKm // ✅ YENİ EKLENEN
      };

      console.log('Assigning route:', assignDto);
      const assignResponse = await api.post(`${this.baseUrl}/assignment`, assignDto);
      console.log('Journey created:', assignResponse.data);

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

  // ✅ DÜZELTİLDİ: Direkt FormData alıyor ve receiverName desteği eklendi
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

  // ✅ Legacy method - Base64 desteği için korundu
  async completeStop(
    journeyId: string | number,
    stopId: string | number,
    data?: CompleteStopDto & { signatureBase64?: string; photoBase64?: string; receiverName?: string }
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
        receiverName: data?.receiverName, // ✅ YENİ EKLENEN
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
        receiverName: statusData.receiverName, // ✅ YENİ EKLENEN
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

  // ✅ YENİ: Aktif sefere durak ekle
  async addStopToActiveJourney(
    journeyId: number,
    customerId: number,
    address: string,
    latitude: number,
    longitude: number,
    serviceTimeMinutes?: number,
    notes?: string,
    arriveBetweenStart?: string, // ✅ YENİ - "HH:mm" format
    arriveBetweenEnd?: string    // ✅ YENİ - "HH:mm" format
  ): Promise<Journey> {
    try {
      console.log('Adding stop to active journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/stops`, {
        customerId,
        address,
        latitude,
        longitude,
        serviceTimeMinutes,
        notes,
        arriveBetweenStart,
        arriveBetweenEnd
      });
      console.log('Stop added:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error adding stop to journey:', error);
      throw new Error(error.response?.data?.message || 'Durak eklenemedi');
    }
  }

  // ✅ YENİ: Aktif seferi yeniden optimize et
  async reoptimizeActiveJourney(
    journeyId: number,
    currentLatitude: number,
    currentLongitude: number
  ): Promise<Journey> {
    try {
      console.log('Reoptimizing active journey:', journeyId);
      const response = await api.post(`${this.baseUrl}/${journeyId}/reoptimize`, {
        currentLatitude,
        currentLongitude
      });
      console.log('Journey reoptimized:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error reoptimizing journey:', error);
      throw new Error(error.response?.data?.message || 'Optimizasyon başarısız');
    }
  }

  // ✅ YENİ: Seferden durak sil
  async removeStopFromJourney(journeyId: number, stopId: number): Promise<Journey> {
    try {
      console.log('Removing stop from journey:', journeyId, stopId);
      const response = await api.delete(`${this.baseUrl}/${journeyId}/stops/${stopId}`);
      console.log('Stop removed:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error removing stop:', error);
      throw new Error(error.response?.data?.message || 'Durak silinemedi');
    }
  }
}

export const journeyService = new JourneyService();