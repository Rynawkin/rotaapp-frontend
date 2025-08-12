// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
  createdAt: Date;
}

// Customer Types - GÜNCELLENMİŞ
export interface Customer {
  id: string;
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
  estimatedServiceTime?: number; // Varsayılan servis süresi (dakika) - YENİ
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Driver Types
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleId?: string;
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
  id: string;
  plateNumber: string;
  type: 'car' | 'van' | 'truck' | 'motorcycle';
  brand: string;
  model: string;
  year: number;
  capacity: number; // kg
  status: 'active' | 'maintenance' | 'inactive';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
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

// Route Stop Types - GÜNCELLENMİŞ
export interface RouteStop {
  id: string;
  routeId: string;
  customerId: string;
  customer?: Customer;
  order: number;
  status: 'pending' | 'arrived' | 'completed' | 'failed';
  
  // Override fields - YENİ
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
  stopNotes?: string; // Bu durak için özel notlar - YENİ
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
  liveLocation?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    timestamp: Date;
  };
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

// Report Types - YENİ
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