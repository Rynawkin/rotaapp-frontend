// frontend/src/types/route.types.ts (yeni dosya oluştur)

export interface RouteStopFormData {
  customerId: string;
  customer?: Customer;
  order: number;
  
  // Time window override
  overrideTimeWindow?: {
    start: string;
    end: string;
  };
  
  // Priority override
  overridePriority?: 'high' | 'normal' | 'low';
  
  // Service settings
  serviceTime?: number;
  signatureRequired?: boolean;  // YENİ
  photoRequired?: boolean;      // YENİ
  
  // Notes
  stopNotes?: string;
  
  // Optimization results
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}