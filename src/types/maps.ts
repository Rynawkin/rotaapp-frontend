// src/types/maps.ts
// Google Maps Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  mapId?: string;
}

export interface MarkerData {
  position: LatLng;
  title?: string;
  label?: string;
  icon?: string;
  type?: 'depot' | 'customer' | 'driver' | 'stop' | 'vehicle';
  customerId?: string;
  order?: number;
  status?: 'pending' | 'arrived' | 'completed' | 'failed';
}

export interface RouteOptimizationRequest {
  origin: LatLng; // Depo
  waypoints: OptimizationWaypoint[];
  travelMode: google.maps.TravelMode;
  optimizeWaypoints: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

export interface OptimizationWaypoint {
  location: LatLng;
  customerId: string;
  timeWindow?: {
    start: string;
    end: string;
  };
  priority: 'high' | 'normal' | 'low';
  serviceTime: number; // dakika
}

export interface DistanceMatrixResult {
  distance: number; // metre
  duration: number; // saniye
  status: string;
}

export interface OptimizationResult {
  optimizedOrder: number[];
  totalDistance: number; // km
  totalDuration: number; // dakika
  waypoints: OptimizationWaypoint[];
  route?: google.maps.DirectionsResult;
}