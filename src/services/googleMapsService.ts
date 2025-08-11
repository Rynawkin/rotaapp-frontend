import { 
  LatLng, 
  OptimizationWaypoint, 
  DistanceMatrixResult,
  OptimizationResult 
} from '@/types/maps';
import { Customer } from '@/types';

class GoogleMapsService {
  private directionsService: google.maps.DirectionsService | null = null;
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private placesService: google.maps.places.PlacesService | null = null;

  // Services'i initialize et
  initializeServices(map?: google.maps.Map) {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      this.directionsService = new google.maps.DirectionsService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();
      this.geocoder = new google.maps.Geocoder();
      
      if (map) {
        this.placesService = new google.maps.places.PlacesService(map);
      }
      return true;
    }
    console.warn('Google Maps not loaded yet');
    return false;
  }

  // Adres -> Koordinat
  async geocodeAddress(address: string): Promise<LatLng | null> {
    if (!this.geocoder) {
      console.error('Geocoder service not initialized');
      return null;
    }

    try {
      const response = await this.geocoder.geocode({ 
        address: address + ', İstanbul, Turkey' // İstanbul'a özel
      });

      if (response.results && response.results.length > 0) {
        const location = response.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Koordinat -> Adres
  async reverseGeocode(latLng: LatLng): Promise<string | null> {
    if (!this.geocoder) {
      console.error('Geocoder service not initialized');
      return null;
    }

    try {
      const response = await this.geocoder.geocode({ location: latLng });
      
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Mesafe Matrisi Hesapla
  async calculateDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[]
  ): Promise<DistanceMatrixResult[][] | null> {
    if (!this.distanceMatrixService) {
      console.error('Distance Matrix service not initialized');
      return null;
    }

    return new Promise((resolve) => {
      this.distanceMatrixService!.getDistanceMatrix(
        {
          origins: origins.map(ll => new google.maps.LatLng(ll.lat, ll.lng)),
          destinations: destinations.map(ll => new google.maps.LatLng(ll.lat, ll.lng)),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        },
        (response, status) => {
          if (status === 'OK' && response) {
            const results: DistanceMatrixResult[][] = [];
            
            response.rows.forEach(row => {
              const rowResults: DistanceMatrixResult[] = [];
              row.elements.forEach(element => {
                rowResults.push({
                  distance: element.distance?.value || 0,
                  duration: element.duration?.value || 0,
                  status: element.status
                });
              });
              results.push(rowResults);
            });
            
            resolve(results);
          } else {
            console.error('Distance Matrix error:', status);
            resolve(null);
          }
        }
      );
    });
  }

  // Rota Optimize Et - TSP Algoritması ile
  async optimizeRoute(
    depot: LatLng,
    waypoints: OptimizationWaypoint[],
    optimizationMode: 'distance' | 'duration' = 'distance'
  ): Promise<OptimizationResult | null> {
    if (!this.directionsService) {
      console.error('Directions service not initialized');
      return null;
    }

    // Önce mesafe matrisini hesapla
    const locations = [depot, ...waypoints.map(w => w.location)];
    const distanceMatrix = await this.calculateDistanceMatrix(locations, locations);
    
    if (!distanceMatrix) {
      return null;
    }

    // TSP algoritması ile optimize et
    const optimizedIndices = this.solveTSP(distanceMatrix, optimizationMode);
    
    // İlk eleman depot olduğu için waypoint indekslerini ayarla
    const optimizedOrder = optimizedIndices.slice(1).map(i => i - 1);
    
    // Optimize edilmiş waypoint'leri sırala
    const optimizedWaypoints = optimizedOrder.map(i => waypoints[i]);

    // Google Directions ile rotayı çiz
    const directionResult = await this.getDirections(
      depot,
      optimizedWaypoints.map(w => w.location),
      depot
    );

    // Toplam mesafe ve süre hesapla
    let totalDistance = 0;
    let totalDuration = 0;

    if (directionResult) {
      directionResult.routes[0].legs.forEach(leg => {
        totalDistance += leg.distance?.value || 0;
        totalDuration += leg.duration?.value || 0;
      });
    }

    // Servis sürelerini ekle
    optimizedWaypoints.forEach(wp => {
      totalDuration += wp.serviceTime * 60; // dakika -> saniye
    });

    return {
      optimizedOrder,
      totalDistance: totalDistance / 1000, // metre -> km
      totalDuration: Math.round(totalDuration / 60), // saniye -> dakika
      waypoints: optimizedWaypoints,
      route: directionResult || undefined
    };
  }

  // TSP Çözümü - Nearest Neighbor Algoritması
  private solveTSP(
    distanceMatrix: DistanceMatrixResult[][],
    mode: 'distance' | 'duration'
  ): number[] {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const tour: number[] = [];
    
    // Depodan başla (index 0)
    let current = 0;
    visited[current] = true;
    tour.push(current);

    // En yakın komşuyu bul ve ekle
    while (tour.length < n) {
      let nearest = -1;
      let minValue = Infinity;

      for (let i = 0; i < n; i++) {
        if (!visited[i]) {
          const value = mode === 'distance' 
            ? distanceMatrix[current][i].distance 
            : distanceMatrix[current][i].duration;

          if (value < minValue) {
            minValue = value;
            nearest = i;
          }
        }
      }

      if (nearest !== -1) {
        visited[nearest] = true;
        tour.push(nearest);
        current = nearest;
      }
    }

    return tour;
  }

  // Google Directions API ile rota çiz
  async getDirections(
    origin: LatLng,
    waypoints: LatLng[],
    destination: LatLng
  ): Promise<google.maps.DirectionsResult | null> {
    if (!this.directionsService) {
      console.error('Directions service not initialized');
      return null;
    }

    return new Promise((resolve) => {
      this.directionsService!.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypoints.map(wp => ({
            location: new google.maps.LatLng(wp.lat, wp.lng),
            stopover: true
          })),
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false, // Zaten optimize ettik
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'TR'
        },
        (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            console.error('Directions error:', status);
            resolve(null);
          }
        }
      );
    });
  }

  // Öncelik bazlı sıralama yap
  sortByPriority(waypoints: OptimizationWaypoint[]): OptimizationWaypoint[] {
    const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
    return [...waypoints].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Zaman penceresi kısıtlamalarını kontrol et
  validateTimeWindows(waypoints: OptimizationWaypoint[], startTime: string): boolean {
    // Basit validasyon - ileride geliştirilecek
    return waypoints.every(wp => {
      if (!wp.timeWindow) return true;
      
      const start = this.timeToMinutes(wp.timeWindow.start);
      const end = this.timeToMinutes(wp.timeWindow.end);
      const current = this.timeToMinutes(startTime);
      
      return current >= start && current <= end;
    });
  }

  // Saat string'ini dakikaya çevir
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Customer'ı waypoint'e çevir
  customerToWaypoint(customer: Customer, overrides?: {
    timeWindow?: { start: string; end: string };
    priority?: 'high' | 'normal' | 'low';
    serviceTime?: number;
  }): OptimizationWaypoint {
    return {
      location: {
        lat: customer.latitude,
        lng: customer.longitude
      },
      customerId: customer.id,
      timeWindow: overrides?.timeWindow || customer.timeWindow,
      priority: overrides?.priority || customer.priority,
      serviceTime: overrides?.serviceTime || customer.estimatedServiceTime || 10
    };
  }
}

// Singleton instance
export const googleMapsService = new GoogleMapsService();