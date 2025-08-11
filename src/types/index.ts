// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'driver';
  avatar?: string;
  createdAt: Date;
}

// Customer Types
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

// Route Stop Types
export interface RouteStop {
  id: string;
  routeId: string;
  customerId: string;
  customer?: Customer;
  order: number;
  status: 'pending' | 'arrived' | 'completed' | 'failed';
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