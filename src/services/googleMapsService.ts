import { 
  LatLng, 
  OptimizationWaypoint, 
  DistanceMatrixResult,
  OptimizationResult 
} from '@/types/maps';
import { Customer } from '@/types';

// Öncelik ayarları interface'i
interface PrioritySettings {
  high: { maxDelay: number; weight: number };
  normal: { maxDelay: number; weight: number };
  low: { maxDelay: number; weight: number };
}

class GoogleMapsService {
  private directionsService: google.maps.DirectionsService | null = null;
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private placesService: google.maps.places.PlacesService | null = null;

  // Öncelik ayarlarını localStorage'dan al
  private getPrioritySettings(): PrioritySettings {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.delivery?.prioritySettings) {
        const ps = settings.delivery.prioritySettings;
        return {
          high: { maxDelay: ps.high.maxDelay || 30, weight: 3 },
          normal: { maxDelay: ps.normal.maxDelay || 60, weight: 2 },
          low: { maxDelay: ps.low.maxDelay || 120, weight: 1 }
        };
      }
    }
    // Varsayılan değerler
    return {
      high: { maxDelay: 30, weight: 3 },
      normal: { maxDelay: 60, weight: 2 },
      low: { maxDelay: 120, weight: 1 }
    };
  }

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

  // Rota Optimize Et - Öncelik Destekli TSP Algoritması
  async optimizeRoute(
    depot: LatLng,
    waypoints: OptimizationWaypoint[],
    optimizationMode: 'distance' | 'duration' = 'distance'
  ): Promise<OptimizationResult | null> {
    if (!this.directionsService) {
      console.error('Directions service not initialized');
      return null;
    }

    // Önce önceliklere göre grupla
    const priorityGroups = this.groupByPriority(waypoints);
    const sortedWaypoints: OptimizationWaypoint[] = [];
    
    // Önce yüksek öncelikli müşteriler
    if (priorityGroups.high.length > 0) {
      const highPriorityOptimized = await this.optimizeGroup(
        depot, 
        priorityGroups.high, 
        optimizationMode
      );
      sortedWaypoints.push(...highPriorityOptimized);
    }
    
    // Sonra normal öncelikli müşteriler
    if (priorityGroups.normal.length > 0) {
      const lastLocation = sortedWaypoints.length > 0 
        ? sortedWaypoints[sortedWaypoints.length - 1].location 
        : depot;
      
      const normalPriorityOptimized = await this.optimizeGroup(
        lastLocation, 
        priorityGroups.normal, 
        optimizationMode
      );
      sortedWaypoints.push(...normalPriorityOptimized);
    }
    
    // En son düşük öncelikli müşteriler
    if (priorityGroups.low.length > 0) {
      const lastLocation = sortedWaypoints.length > 0 
        ? sortedWaypoints[sortedWaypoints.length - 1].location 
        : depot;
      
      const lowPriorityOptimized = await this.optimizeGroup(
        lastLocation, 
        priorityGroups.low, 
        optimizationMode
      );
      sortedWaypoints.push(...lowPriorityOptimized);
    }

    // Optimize edilmiş waypoint'lerin orijinal indekslerini bul
    const optimizedOrder = sortedWaypoints.map(sw => 
      waypoints.findIndex(w => 
        w.location.lat === sw.location.lat && 
        w.location.lng === sw.location.lng
      )
    );

    // Google Directions ile rotayı çiz
    const directionResult = await this.getDirections(
      depot,
      sortedWaypoints.map(w => w.location),
      depot,
      false // avoidTolls parametresi - frontend optimize fonksiyonu için false
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
    sortedWaypoints.forEach(wp => {
      totalDuration += wp.serviceTime * 60; // dakika -> saniye
    });

    // Zaman penceresi kontrolü ve gecikme hesaplama
    const violations = this.checkTimeWindowViolations(sortedWaypoints, totalDuration);

    return {
      optimizedOrder,
      totalDistance: totalDistance / 1000, // metre -> km
      totalDuration: Math.round(totalDuration / 60), // saniye -> dakika
      waypoints: sortedWaypoints,
      route: directionResult || undefined,
      violations // Zaman penceresi ihlalleri varsa ekle
    };
  }

  // Önceliklere göre grupla
  private groupByPriority(waypoints: OptimizationWaypoint[]): {
    high: OptimizationWaypoint[];
    normal: OptimizationWaypoint[];
    low: OptimizationWaypoint[];
  } {
    return {
      high: waypoints.filter(w => w.priority === 'high'),
      normal: waypoints.filter(w => w.priority === 'normal'),
      low: waypoints.filter(w => w.priority === 'low')
    };
  }

  // Grup içinde optimize et
  private async optimizeGroup(
    startLocation: LatLng,
    waypoints: OptimizationWaypoint[],
    mode: 'distance' | 'duration'
  ): Promise<OptimizationWaypoint[]> {
    if (waypoints.length === 0) return [];
    if (waypoints.length === 1) return waypoints;

    // Grup içindeki noktalar için mesafe matrisi hesapla
    const locations = [startLocation, ...waypoints.map(w => w.location)];
    const distanceMatrix = await this.calculateDistanceMatrix(locations, locations);
    
    if (!distanceMatrix) {
      return waypoints; // Optimizasyon yapılamadı, orijinal sırayı koru
    }

    // TSP algoritması ile optimize et (başlangıç noktası dahil)
    const optimizedIndices = this.solveTSP(distanceMatrix, mode);
    
    // İlk eleman başlangıç noktası olduğu için onu çıkar
    const groupIndices = optimizedIndices.slice(1).map(i => i - 1);
    
    // Optimize edilmiş sırada waypoint'leri döndür
    return groupIndices.map(i => waypoints[i]);
  }

  // TSP Çözümü - Nearest Neighbor Algoritması (Öncelik Ağırlıklı)
  private solveTSP(
    distanceMatrix: DistanceMatrixResult[][],
    mode: 'distance' | 'duration'
  ): number[] {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const tour: number[] = [];
    
    // Başlangıç noktasından başla (index 0)
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

  // Zaman penceresi ihlallerini kontrol et
  private checkTimeWindowViolations(
    waypoints: OptimizationWaypoint[], 
    totalDuration: number
  ): string[] {
    const violations: string[] = [];
    const prioritySettings = this.getPrioritySettings();
    let currentTime = 0; // Dakika cinsinden

    waypoints.forEach((wp, index) => {
      currentTime += wp.serviceTime || 10;
      
      // Öncelik bazlı max gecikme kontrolü
      const maxDelay = wp.priority === 'high' 
        ? prioritySettings.high.maxDelay
        : wp.priority === 'normal'
        ? prioritySettings.normal.maxDelay
        : prioritySettings.low.maxDelay;

      // Zaman penceresi kontrolü
      if (wp.timeWindow) {
        const windowStart = this.timeToMinutes(wp.timeWindow.start);
        const windowEnd = this.timeToMinutes(wp.timeWindow.end);
        
        if (currentTime > windowEnd + maxDelay) {
          violations.push(
            `⚠️ Durak ${index + 1}: Zaman penceresi aşıldı (Max gecikme: ${maxDelay} dk)`
          );
        }
      }
      
      // Tahmini varış süresi ekle (basitleştirilmiş)
      currentTime += 15; // Ortalama seyahat süresi
    });

    return violations;
  }

  // Google Directions API ile rota çiz
  async getDirections(
    origin: LatLng,
    waypoints: LatLng[],
    destination: LatLng,
    avoidTolls: boolean = false
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
          optimizeWaypoints: false, // Zaten öncelik bazlı optimize ettik
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'TR',
          avoidTolls: avoidTolls
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
    const prioritySettings = this.getPrioritySettings();
    let currentMinutes = this.timeToMinutes(startTime);
    
    return waypoints.every(wp => {
      if (!wp.timeWindow) return true;
      
      const windowStart = this.timeToMinutes(wp.timeWindow.start);
      const windowEnd = this.timeToMinutes(wp.timeWindow.end);
      
      // Öncelik bazlı max gecikme toleransı ekle
      const maxDelay = wp.priority === 'high' 
        ? prioritySettings.high.maxDelay
        : wp.priority === 'normal'
        ? prioritySettings.normal.maxDelay
        : prioritySettings.low.maxDelay;
      
      // Gecikme toleransı ile kontrol et
      const canDeliver = currentMinutes >= windowStart && 
                         currentMinutes <= (windowEnd + maxDelay);
      
      // Servis süresi ve tahmini seyahat süresi ekle
      currentMinutes += (wp.serviceTime || 10) + 15;
      
      return canDeliver;
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

  // Öncelik bazlı rota önerisi
  suggestRouteWithPriorities(
    depot: LatLng,
    customers: Customer[]
  ): {
    suggestedOrder: Customer[];
    estimatedTime: number;
    priorityBreakdown: {
      high: number;
      normal: number;
      low: number;
    };
  } {
    const prioritySettings = this.getPrioritySettings();
    
    // Müşterileri önceliğe göre grupla
    const highPriority = customers.filter(c => c.priority === 'high');
    const normalPriority = customers.filter(c => c.priority === 'normal');
    const lowPriority = customers.filter(c => c.priority === 'low');
    
    // Önerilen sıralama: önce yüksek, sonra normal, en son düşük
    const suggestedOrder = [...highPriority, ...normalPriority, ...lowPriority];
    
    // Tahmini süre hesapla
    let estimatedTime = 0;
    suggestedOrder.forEach(customer => {
      estimatedTime += customer.estimatedServiceTime || 10; // Servis süresi
      estimatedTime += 15; // Ortalama seyahat süresi
    });
    
    return {
      suggestedOrder,
      estimatedTime,
      priorityBreakdown: {
        high: highPriority.length,
        normal: normalPriority.length,
        low: lowPriority.length
      }
    };
  }
}

// Singleton instance
export const googleMapsService = new GoogleMapsService();