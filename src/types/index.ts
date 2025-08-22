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
  latitude: number;
  longitude: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  priority: 'high' | 'normal' | 'low';
  estimatedServiceTime?: number;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
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
  createdAt?: Date;
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
  overridePriority?: 'high' | 'normal' | 'low';
  serviceTime?: number;
  
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

// Journey Stop Types - DÜZELTİLDİ
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
  arriveBetweenStart?: string;
  arriveBetweenEnd?: string;
  
  // ✅ BACKEND'DEN GELEN FIELD'LAR
  checkInTime?: string;  // ISO string format
  checkOutTime?: string; // ISO string format
  
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
  stopId: string;
  status: JourneyStatusType;
  notes?: string;
  latitude: number;
  longitude: number;
  additionalValues?: Record<string, string>;
  createdAt: Date;
  failureReason?: string;
  signatureUrl?: string;
  photoUrl?: string;
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