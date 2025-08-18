// src/types/index.ts

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
  workspaceId?: string; // Multi-tenant için eklendi
  createdAt: Date;
}

// Workspace Types - YENİ
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
  // Abonelik bilgileri
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

// Super Admin Types - YENİ
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
  id: number;  // string'den number'a değişti
  code: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  latitude: number;
  longitude: number;
  timeWindow?: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  priority: 'high' | 'normal' | 'low';
  estimatedServiceTime?: number; // Varsayılan servis süresi (dakika)
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Driver Types
export interface Driver {
  id: number; // DÜZELTİLDİ: string -> number
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleId?: number; // DÜZELTİLDİ: string -> number
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
  id: number; // DÜZELTİLDİ: string -> number
  plateNumber: string;
  type: 'car' | 'van' | 'truck' | 'motorcycle';
  brand: string;
  model: string;
  year: number;
  capacity: number; // kg
  status: 'active' | 'maintenance' | 'inactive';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  createdAt?: Date; // Optional fields added
  updatedAt?: Date;
}

// Route Types
export interface Route {
  id: string;
  name: string;
  date: Date;
  driverId?: string;
  driver?: Driver;
  vehicleId?: string;
  vehicle?: Vehicle;
  depotId: string;
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';
  stops: RouteStop[];
  totalDistance?: number; // km
  totalDuration?: number; // minutes
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
  
  // Override fields
  overrideTimeWindow?: {
    start: string;
    end: string;
  };
  overridePriority?: 'high' | 'normal' | 'low';
  serviceTime?: number; // Bu durak için özel servis süresi (dakika)
  
  estimatedArrival?: Date;
  actualArrival?: Date;
  completedAt?: Date;
  duration?: number; // minutes
  distance?: number; // km from previous stop
  deliveryProof?: {
    signature?: string;
    photo?: string;
    notes?: string;
  };
  failureReason?: string;
  stopNotes?: string; // Bu durak için özel notlar
}

// Journey Stop Status Enum - YENİ EKLENDİ
export type JourneyStopStatus = 
  | 'Pending'
  | 'InProgress'
  | 'Completed'
  | 'Failed'
  | 'Skipped';

// Journey Stop Types - YENİ EKLENDİ
export interface JourneyStop {
  id: string;
  journeyId: string;
  stopId: string;
  routeStopId: string;  // Backend'de RouteStopId field'ı eklendi
  order: number;
  status: JourneyStopStatus;  // Backend'de Status field'ı eklendi
  
  // Distance and Location
  distance: number; // km
  startAddress: string;
  startLatitude: number;
  startLongitude: number;
  endAddress: string;
  endLatitude: number;
  endLongitude: number;
  
  // Time Windows
  estimatedArrivalTime: string; // TimeSpan backend'den string olarak gelir
  estimatedDepartureTime?: string;
  arriveBetweenStart?: string;
  arriveBetweenEnd?: string;
  
  // Actual times
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  completedAt?: Date;
  
  // Relations
  routeStop?: RouteStop;
}

// Journey Status Type - YENİ EKLENDİ (Backend'deki JourneyStatusType için)
export type JourneyStatusType = 
  | 'InTransit'     // 200 - Yolda
  | 'Arrived'       // 300 - Varış yapıldı
  | 'Processing'    // 400 - İşlem yapılıyor
  | 'Completed'     // 500 - İşlem tamamlandı
  | 'Delayed'       // 600 - Gecikme var
  | 'Cancelled'     // 700 - İptal edildi
  | 'OnHold';       // 800 - Bekletiliyor

// Journey Status - YENİ EKLENDİ
export interface JourneyStatus {
  id: string;
  journeyId: string;
  stopId: string;
  status: JourneyStatusType;
  notes?: string;
  latitude: number;
  longitude: number;
  additionalValues?: Record<string, string>;
  createdAt: Date;
}

// Journey (Active Route) Types - GÜNCELLENDİ
export interface Journey {
  id: string;
  routeId: string;
  route: Route;
  status: 'preparing' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  currentStopIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  totalDistance: number;
  totalDuration: number;
  stops?: JourneyStop[];  // YENİ EKLENDİ - Journey stops listesi
  statuses?: JourneyStatus[];  // YENİ EKLENDİ - Journey status history
  liveLocation?: LiveLocation;  // GÜNCELLENDİ - LiveLocation type'ı kullanılıyor
}

// LiveLocation Type - YENİ EKLENDİ (Backend'deki LiveLocation entity'sine uygun)
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
    [key: string]: { // monday, tuesday, etc.
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
  priority: Customer['priority'];
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
  period: string; // 'hourly' | 'daily' | 'weekly' | 'monthly'
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
  priority?: Customer['priority'];
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