// types/maps.ts

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MarkerData {
  position: LatLng;
  title: string;
  label?: string;
  type: 'customer' | 'depot' | 'driver' | 'vehicle';
  customerId?: string;
  driverId?: string;
  vehicleId?: string;
  icon?: string;
  color?: string;
}

export interface OptimizationWaypoint {
  location: LatLng;
  customerId: string;
  timeWindow?: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  priority: 'high' | 'normal' | 'low';
  serviceTime: number; // dakika
  notes?: string;
}

export interface DistanceMatrixResult {
  distance: number; // metre
  duration: number; // saniye
  status: string;
}

export interface OptimizationResult {
  optimizedOrder: number[]; // Orijinal waypoint indeksleri
  totalDistance: number; // km
  totalDuration: number; // dakika
  waypoints: OptimizationWaypoint[];
  route?: google.maps.DirectionsResult;
  violations?: string[]; // Zaman penceresi ihlalleri
  estimatedArrival?: Date[]; // Her durak için tahmini varış
  priorityBreakdown?: {
    high: number;
    normal: number;
    low: number;
  };
}

export interface RouteSegment {
  from: LatLng;
  to: LatLng;
  distance: number; // km
  duration: number; // dakika
  polyline?: string; // Encoded polyline
  traffic?: 'smooth' | 'moderate' | 'heavy';
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  mapTypeId?: google.maps.MapTypeId;
  styles?: google.maps.MapTypeStyle[];
  options?: google.maps.MapOptions;
}

export interface DirectionsOptions {
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  avoidFerries?: boolean;
  optimizeWaypoints?: boolean;
  travelMode?: google.maps.TravelMode;
  drivingOptions?: {
    departureTime: Date;
    trafficModel?: google.maps.TrafficModel;
  };
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: LatLng;
  types?: string[];
  rating?: number;
  openingHours?: {
    isOpen: boolean;
    weekdayText: string[];
  };
  phoneNumber?: string;
  website?: string;
}

export interface TrafficInfo {
  level: 'low' | 'medium' | 'high' | 'very-high';
  delayInMinutes: number;
  affectedRoutes: string[];
}

export interface LiveLocation {
  vehicleId: string;
  driverId: string;
  position: LatLng;
  speed: number; // km/h
  heading: number; // degrees
  timestamp: Date;
  accuracy?: number; // meters
  altitude?: number; // meters
  battery?: number; // percentage
}

export interface GeofenceArea {
  id: string;
  name: string;
  type: 'circle' | 'polygon' | 'rectangle';
  coordinates: LatLng | LatLng[]; // circle için center, polygon için points
  radius?: number; // circle için metre cinsinden
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  active: boolean;
}

export interface MapEvent {
  type: 'click' | 'drag' | 'zoom' | 'marker_click' | 'polygon_click';
  position?: LatLng;
  target?: any;
  zoom?: number;
}

export interface RouteAnalytics {
  routeId: string;
  date: Date;
  performance: {
    plannedDuration: number;
    actualDuration: number;
    efficiency: number; // percentage
  };
  stops: {
    planned: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  distance: {
    planned: number;
    actual: number;
    deviation: number;
  };
  delays: {
    traffic: number;
    service: number;
    other: number;
    total: number;
  };
}

export interface HeatmapData {
  location: LatLng;
  weight: number;
}

export interface ClusterOptions {
  gridSize?: number;
  maxZoom?: number;
  minimumClusterSize?: number;
  styles?: Array<{
    url: string;
    height: number;
    width: number;
    textColor?: string;
    textSize?: number;
  }>;
}