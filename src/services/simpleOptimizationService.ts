import { Customer } from '@/types';

interface Location {
  lat: number;
  lng: number;
}

class SimpleOptimizationService {
  // Haversine formülü ile iki nokta arası mesafe (km)
  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * 
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degree: number): number {
    return degree * (Math.PI / 180);
  }

  // Mesafe matrisi oluştur
  private createDistanceMatrix(locations: Location[]): number[][] {
    const n = locations.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = this.calculateDistance(locations[i], locations[j]);
        }
      }
    }
    
    return matrix;
  }

  // Nearest Neighbor algoritması ile TSP çözümü
  private nearestNeighborTSP(distanceMatrix: number[][], startIndex: number = 0): number[] {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const tour: number[] = [];
    
    // Başlangıç noktasından başla
    let current = startIndex;
    visited[current] = true;
    tour.push(current);
    
    // En yakın komşuyu bul ve ekle
    while (tour.length < n) {
      let nearest = -1;
      let minDistance = Infinity;
      
      for (let i = 0; i < n; i++) {
        if (!visited[i] && distanceMatrix[current][i] < minDistance) {
          minDistance = distanceMatrix[current][i];
          nearest = i;
        }
      }
      
      if (nearest !== -1) {
        visited[nearest] = true;
        tour.push(nearest);
        current = nearest;
      } else {
        break;
      }
    }
    
    return tour;
  }

  // 2-opt optimizasyonu
  private twoOptImprovement(tour: number[], distanceMatrix: number[][]): number[] {
    let improved = true;
    let bestTour = [...tour];
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < bestTour.length - 2; i++) {
        for (let j = i + 1; j < bestTour.length; j++) {
          // Mevcut mesafe
          const currentDistance = 
            distanceMatrix[bestTour[i - 1]][bestTour[i]] +
            distanceMatrix[bestTour[j - 1]][bestTour[j]];
          
          // Değişim sonrası mesafe
          const newDistance = 
            distanceMatrix[bestTour[i - 1]][bestTour[j - 1]] +
            distanceMatrix[bestTour[i]][bestTour[j]];
          
          // Eğer daha kısa ise değiştir
          if (newDistance < currentDistance) {
            // i ve j-1 arasını ters çevir
            const newTour = [
              ...bestTour.slice(0, i),
              ...bestTour.slice(i, j).reverse(),
              ...bestTour.slice(j)
            ];
            bestTour = newTour;
            improved = true;
          }
        }
      }
    }
    
    return bestTour;
  }

  // Ana optimizasyon fonksiyonu
  optimizeRoute(
    depot: Location,
    customers: Customer[],
    mode: 'distance' | 'priority' = 'distance'
  ): {
    optimizedOrder: number[];
    totalDistance: number;
    estimatedDuration: number;
    routePoints: Location[];
  } {
    // Öncelik modunda önce yüksek öncelikli müşteriler
    if (mode === 'priority') {
      const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
      customers.sort((a, b) => {
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        return aPriority - bPriority;
      });
    }
    
    // Tüm konumları birleştir (depot + müşteriler)
    const locations: Location[] = [
      depot,
      ...customers.map(c => ({ lat: c.latitude, lng: c.longitude }))
    ];
    
    // Mesafe matrisi oluştur
    const distanceMatrix = this.createDistanceMatrix(locations);
    
    // TSP çözümü (depot'dan başla)
    let tour = this.nearestNeighborTSP(distanceMatrix, 0);
    
    // 2-opt iyileştirmesi
    tour = this.twoOptImprovement(tour, distanceMatrix);
    
    // Depot'yu çıkar (ilk eleman)
    const customerOrder = tour.slice(1).map(i => i - 1);
    
    // Toplam mesafe hesapla
    let totalDistance = 0;
    for (let i = 0; i < tour.length - 1; i++) {
      totalDistance += distanceMatrix[tour[i]][tour[i + 1]];
    }
    // Depoya dönüş
    totalDistance += distanceMatrix[tour[tour.length - 1]][0];
    
    // Tahmini süre (ortalama 30 km/saat hız)
    const estimatedDuration = Math.round((totalDistance / 30) * 60); // dakika
    
    // Rota noktaları
    const routePoints = tour.map(i => locations[i]);
    routePoints.push(depot); // Depoya dönüş
    
    return {
      optimizedOrder: customerOrder,
      totalDistance: Math.round(totalDistance * 10) / 10,
      estimatedDuration,
      routePoints
    };
  }

  // Zaman pencereli optimizasyon
  optimizeWithTimeWindows(
    depot: Location,
    customers: Customer[],
    startTime: string = '09:00'
  ): {
    optimizedOrder: number[];
    totalDistance: number;
    estimatedDuration: number;
    violations: string[];
  } {
    // Zaman penceresi kontrolü ile sıralama
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(startTime);
    const violations: string[] = [];
    
    // Müşterileri zaman pencerelerine göre grupla
    const timeGroups: { [key: string]: Customer[] } = {};
    
    customers.forEach(customer => {
      if (customer.timeWindow) {
        const windowStart = customer.timeWindow.start;
        if (!timeGroups[windowStart]) {
          timeGroups[windowStart] = [];
        }
        timeGroups[windowStart].push(customer);
      } else {
        if (!timeGroups['anytime']) {
          timeGroups['anytime'] = [];
        }
        timeGroups['anytime'].push(customer);
      }
    });
    
    // Zaman sırasına göre grupları birleştir
    const sortedCustomers: Customer[] = [];
    const sortedTimes = Object.keys(timeGroups)
      .filter(t => t !== 'anytime')
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    
    sortedTimes.forEach(time => {
      sortedCustomers.push(...timeGroups[time]);
    });
    
    // Zaman penceresi olmayanları sona ekle
    if (timeGroups['anytime']) {
      sortedCustomers.push(...timeGroups['anytime']);
    }
    
    // Her grup içinde mesafe optimizasyonu yap
    const result = this.optimizeRoute(depot, sortedCustomers, 'distance');
    
    // Zaman penceresi ihlallerini kontrol et
    let currentTime = startMinutes;
    const serviceDuration = 15; // Her durak için ortalama servis süresi (dakika)
    const travelSpeed = 30; // km/saat
    
    result.optimizedOrder.forEach((index, orderIndex) => {
      const customer = sortedCustomers[index];
      
      // Önceki noktadan bu noktaya seyahat süresi
      if (orderIndex > 0) {
        const prevCustomer = sortedCustomers[result.optimizedOrder[orderIndex - 1]];
        const distance = this.calculateDistance(
          { lat: prevCustomer.latitude, lng: prevCustomer.longitude },
          { lat: customer.latitude, lng: customer.longitude }
        );
        currentTime += (distance / travelSpeed) * 60; // dakika
      } else {
        // Depodan ilk müşteriye
        const distance = this.calculateDistance(
          depot,
          { lat: customer.latitude, lng: customer.longitude }
        );
        currentTime += (distance / travelSpeed) * 60;
      }
      
      // Zaman penceresi kontrolü
      if (customer.timeWindow) {
        const windowStart = timeToMinutes(customer.timeWindow.start);
        const windowEnd = timeToMinutes(customer.timeWindow.end);
        
        if (currentTime < windowStart) {
          // Erken varış - bekle
          currentTime = windowStart;
        } else if (currentTime > windowEnd) {
          // Geç varış - ihlal
          violations.push(`${customer.name}: ${Math.round(currentTime - windowEnd)} dakika geç`);
        }
      }
      
      // Servis süresi ekle
      currentTime += customer.estimatedServiceTime || serviceDuration;
    });
    
    return {
      ...result,
      violations
    };
  }
}

// Singleton instance
export const simpleOptimizationService = new SimpleOptimizationService();