// src/types/index.ts

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
  workspaceId?: string;
  createdAt: Date;
}

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  distanceUnit: string;
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
  settings?: WorkspaceSettings; // YENİ EKLENEN
}

// Workspace Settings - YENİ EKLENEN
export interface WorkspaceSettings {
  whatsAppSettings?: WhatsAppSettings;
  emailTemplates?: any;
  // Diğer ayarlar...
}

// WhatsApp Settings - YENİ EKLENEN
export interface WhatsAppSettings {
  enabled: boolean;
  enableWhatsAppForJourneyStart: boolean;
  enableWhatsAppForCheckIn: boolean;
  enableWhatsAppForCompletion: boolean;
  enableWhatsAppForFailure: boolean;
  businessPhoneNumber?: string;
  businessDisplayName?: string;
}

// Super Admin Types
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
  status: 'active' | 'inactive' | 'suspended';
  userCount: number;
  driverCount: number;
  routeCount: number;
  customerCount: number;
  lastActivity: Date;
  monthlyRevenue: number;
}

// Customer Types
export interface Customer {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  
  // WhatsApp Alanları - YENİ EKLENEN
  whatsApp?: string;
  whatsAppOptIn: boolean;
  whatsAppVerified: boolean;
  whatsAppOptInDate?: Date;
  
  latitude: number;
  longitude: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  estimatedServiceTime?: number;
  notes?: string;
  tags?: string[];
  lastDeliveryDate?: Date; // Son teslimat tarihi - filtreleme için
  createdAt: Date;
  updatedAt: Date;
}

// Customer Contact Types
export interface CustomerContact {
  id?: number;
  customerId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  receiveJourneyStart: boolean;
  receiveJourneyCheckIn: boolean;
  receiveDeliveryCompleted: boolean;
  receiveDeliveryFailed: boolean;
  receiveJourneyAssigned: boolean;
  receiveJourneyCancelled: boolean;
  workspaceId?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Driver Types
export interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleId?: number;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  avatar?: string;
  rating?: number;
  totalDeliveries?: number;
  createdAt: Date;
}

// Vehicle Types
export interface Vehicle {
  id: number;
  plateNumber: string;
  type: 'car' | 'van' | 'truck' | 'motorcycle';
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  currentKm?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Vehicle Maintenance Types
export interface VehicleMaintenance {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  type: 'routine' | 'repair' | 'inspection' | 'tire_change' | 'oil_change' | 'other';
  title: string;
  description?: string;
  cost: number;
  performedAt: Date;
  nextMaintenanceDate?: Date;
  nextMaintenanceKm?: number;
  currentKm?: number;
  workshop?: string;
  parts?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MaintenanceReminder {
  id: number;
  vehicleId: number;
  maintenanceId?: number;
  reminderDays: number; // Kaç gün öncesinden hatırlatma gönderilsin
  nextMaintenanceDate: Date;
  isActive: boolean;
  sentAt?: Date;
  createdAt?: Date;
}

export interface CreateMaintenanceDto {
  vehicleId: number;
  type: 'routine' | 'repair' | 'inspection' | 'tire_change' | 'oil_change' | 'other';
  title: string;
  description?: string;
  cost: number;
  performedAt: Date;
  nextMaintenanceDate?: Date;
  nextMaintenanceKm?: number;
  currentKm?: number;
  workshop?: string;
  parts?: string;
  notes?: string;
  reminderDays?: number; // Hatırlatma için kaç gün öncesinden (tarih bazlı)
  reminderKm?: number; // Hatırlatma için kaç km öncesinden (km bazlı)
}

export interface UpdateMaintenanceDto extends Partial<CreateMaintenanceDto> {}

// Route Types
export interface Route {
  id: string;
  name: string;
  date: Date;
  driverId?: string;
  driver?: Driver;
  vehicleId?: string;
  vehicle?: Vehicle;
  currentKm?: number; // Current kilometer reading of the vehicle
  depotId: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  stops: RouteStop[];
  totalDistance?: number;
  totalDuration?: number;
  totalDeliveries: number;
  completedDeliveries: number;
  optimized: boolean;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

// Route Stop Types
export interface RouteStop {
  id: string;
  routeId: string;
  customerId: string;
  customer?: Customer;
  order: number;
  status: 'pending' | 'arrived' | 'completed' | 'failed';
  
  overrideTimeWindow?: {
    start: string;
    end: string;
  };
  serviceTime?: number;
  signatureRequired?: boolean;  // YENİ
  photoRequired?: boolean;      // YENİ

  estimatedArrival?: Date;
  actualArrival?: Date;
  completedAt?: Date;
  duration?: number;
  distance?: number;
  deliveryProof?: {
    signature?: string;
    photo?: string;
    notes?: string;
  };
  failureReason?: string;
  stopNotes?: string;
}

// Journey Stop Status Enum
export type JourneyStopStatus = 
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Failed'
  | 'Skipped';

// Journey Stop Types
export interface JourneyStop {
  id: string;
  journeyId: string;
  stopId: string;
  routeStopId: string;
  order: number;
  status: JourneyStopStatus;
  
  // Distance and Location
  distance: number;
  startAddress: string;
  startLatitude: number;
  startLongitude: number;
  endAddress: string;
  endLatitude: number;
  endLongitude: number;
  
  // Time Windows
  estimatedArrivalTime: string;
  estimatedDepartureTime?: string;

  // ✅ YENİ - Original ETA'lar (planlanan zamanlar - dispatcher analizi için)
  originalEstimatedArrivalTime?: string;
  originalEstimatedDepartureTime?: string;

  arriveBetweenStart?: string;
  arriveBetweenEnd?: string;

  // Backend'den gelen field'lar
  checkInTime?: string;  // ISO string format
  checkOutTime?: string; // ISO string format

  // ✅ YENİ - Delay tracking fields
  delayReasonCategory?: string;
  delayReason?: string;
  newDelay?: number;
  cumulativeDelay?: number;

  // Relations
  routeStop?: RouteStop;
}

// Journey Status Type
export type JourneyStatusType = 
  | 'InTransit'
  | 'Arrived'
  | 'Processing'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled'
  | 'OnHold';

// Journey Status
export interface JourneyStatus {
  id: string;
  journeyId: string;
  stopId: string | number; // ✅ Backend'den number olarak geliyor
  status: JourneyStatusType;
  notes?: string;
  latitude: number;
  longitude: number;
  additionalValues?: Record<string, string>;
  createdAt: Date;
  failureReason?: string;
  signatureUrl?: string;
  photoUrl?: string;
  signatureBase64?: string; // ✅ Base64 versiyonu da var
  photoBase64?: string; // ✅ Base64 versiyonu da var
}

// Journey (Active Route) Types
export interface Journey {
  id: string;
  routeId: string;
  route: Route;
  status: 'preparing' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  currentStopIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  startKm?: number; // ✅ YENİ - Sefer başlangıç kilometresi
  endKm?: number; // ✅ YENİ - Sefer bitiş kilometresi
  startFuel?: string; // ✅ YENİ - Sefer başlangıç yakıt seviyesi
  endFuel?: string; // ✅ YENİ - Sefer bitiş yakıt seviyesi
  vehicleCondition?: string; // ✅ YENİ - Sefer bitişindeki araç durumu
  needsReoptimization?: boolean; // ✅ YENİ - Optimizasyon gerekiyor mu?
  totalDistance: number;
  totalDuration: number;
  stops?: JourneyStop[];
  statuses?: JourneyStatus[];
  liveLocation?: LiveLocation;
}

// LiveLocation Type
export interface LiveLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

// Depot Types
export interface Depot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  workingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
}

// Statistics Types
export interface DashboardStats {
  totalDeliveries: number;
  activeCustomers: number;
  activeDrivers: number;
  averageDeliveryTime: number;
  todayRoutes: number;
  completedToday: number;
  failedToday: number;
  onTimeRate: number;
}

// Report Types
export interface DeliveryTrend {
  date: string;
  completed: number;
  failed: number;
  total: number;
}

export interface DriverPerformanceReport {
  driverId: string;
  driverName: string;
  totalDeliveries: number;
  completedDeliveries: number;
  avgDeliveryTime: number;
  totalDistance: number;
  rating: number;
  successRate?: number;
}

export interface VehicleUtilizationReport {
  vehicleId: string;
  plateNumber: string;
  vehicleType?: string;
  totalRoutes: number;
  totalDistance: number;
  totalDuration?: number;
  utilizationRate: number;
  avgDistancePerRoute?: number;
  status?: Vehicle['status'];
}

export interface CustomerAnalyticsReport {
  customerId: string;
  customerName: string;
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  avgServiceTime: number;
  lastOrderDate?: Date;
}

export interface RouteEfficiencyReport {
  routeId: string;
  routeName: string;
  plannedDeliveries: number;
  actualDeliveries: number;
  plannedDistance: number;
  actualDistance: number;
  plannedDuration: number;
  actualDuration: number;
  efficiencyScore: number;
  optimizationSavings?: number;
}

export interface TimeBasedReport {
  period: string;
  deliveries: number;
  distance: number;
  duration: number;
  drivers: number;
  vehicles: number;
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  driverId?: string;
  vehicleId?: string;
  customerId?: string;
  routeStatus?: Route['status'];
  depotId?: string;
}

export interface ReportSummary {
  totalDeliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  totalDistance: number;
  totalDuration: number;
  activeDrivers: number;
  activeVehicles: number;
  totalCustomers: number;
  onTimeDeliveryRate: number;
  fuelEfficiency?: number;
  costPerDelivery?: number;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  target?: number;
  icon?: string;
  color?: string;
  description?: string;
  lastUpdated?: Date;
}

export interface OptimizationResponse {
  success: boolean;
  message: string;
  optimizedStops: RouteStop[];
  excludedStops: ExcludedStop[];
  totalDistance: number;
  totalDuration: number;
  hasExclusions: boolean;
  endDetails?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    estimatedArrivalTime?: string;
  };
}

export interface ExcludedStop {
  stop: RouteStop;
  customer?: Customer;
  reason: string;
  timeWindowConflict?: string;
}

export type OptimizationStatus = 'none' | 'success' | 'partial';

// Route Form Types
export interface StopData {
  customer: Customer;
  overrideTimeWindow?: { start: string; end: string };
  serviceTime?: number;
  signatureRequired?: boolean;  // YENİ
  photoRequired?: boolean;      // YENİ
  stopNotes?: string;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}

// ✅ YENİ - Delay Reason Helper Functions
export const getDelayReasonLabel = (category?: string): string => {
  if (!category) return '';

  switch (category) {
    case 'Traffic':
      return 'Trafik Yoğunluğu';
    case 'CustomerNotReady':
      return 'Müşteri Hazır Değil';
    case 'VehicleIssue':
      return 'Araç Arızası';
    case 'Weather':
      return 'Hava Koşulları';
    case 'UnloadingDelay':
      return 'Yükleme/Boşaltma Gecikmesi';
    case 'RouteChange':
      return 'Rota Değişikliği';
    case 'AccidentArea':
      return 'Kaza Bölgesi';
    case 'BreakTime':
      return 'Yemek Molası';
    case 'Other':
      return 'Diğer';
    default:
      return category;
  }
};

// ✅ YENİ - Fuel Level Helper Functions
export const getFuelLabel = (fuelLevel?: string): string => {
  if (!fuelLevel) return '-';

  switch (fuelLevel) {
    case 'full':
      return '🟢 Tam';
    case 'three_quarters':
      return '🟢 3/4';
    case 'half':
      return '🟡 1/2';
    case 'quarter':
      return '🟠 1/4';
    case 'empty':
      return '🔴 Boş';
    default:
      return fuelLevel;
  }
};

// ✅ YENİ - Vehicle Condition Helper Functions
export const getVehicleConditionLabel = (condition?: string): string => {
  if (!condition) return '-';

  switch (condition) {
    case 'good':
      return '✅ İyi Durumda';
    case 'needs_cleaning':
      return '🧹 Temizlik Gerekli';
    case 'needs_maintenance':
      return '🔧 Bakım Gerekli';
    case 'damaged':
      return '⚠️ Hasar Var';
    default:
      return condition;
  }
};

export const getVehicleConditionColor = (condition?: string): string => {
  if (!condition) return 'bg-gray-100 text-gray-700';

  switch (condition) {
    case 'good':
      return 'bg-green-100 text-green-700';
    case 'needs_cleaning':
      return 'bg-blue-100 text-blue-700';
    case 'needs_maintenance':
      return 'bg-orange-100 text-orange-700';
    case 'damaged':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};