import { api } from './api';
import { Route, RouteStop } from '@/types';

export interface CreateRouteDto {
  name: string;
  date: string;
  depotId: number;
  driverId?: number;
  vehicleId?: number;
  optimized?: boolean;
  totalDistance?: number;
  totalDuration?: number;
  notes?: string;
  stops: Array<{
    customerId: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
    contactFullName?: string;
    contactPhone?: string;
    contactEmail?: string;
    type: number; // 10 = Delivery, 20 = Pickup
    orderType: number; // 10 = First, 20 = Auto, 30 = Last
    proofOfDeliveryRequired: boolean;
    arriveBetweenStart?: string | null;
    arriveBetweenEnd?: string | null;
    serviceTime?: string | null;
  }>;
  startDetails?: {
    startTime: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  endDetails?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface UpdateRouteDto {
  name?: string;
  date?: string;
  depotId?: number;
  driverId?: number;
  vehicleId?: number;
  stops?: Array<{
    customerId: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    notes?: string;
    contactFullName?: string;
    contactPhone?: string;
    contactEmail?: string;
    type: number;
    orderType: number;
    proofOfDeliveryRequired: boolean;
    arriveBetweenStart?: string | null;
    arriveBetweenEnd?: string | null;
    serviceTime?: string | null;
  }>;
  startDetails?: {
    startTime: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  endDetails?: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

class RouteService {
  private baseUrl = '/workspace/routes';

  // ✅ YENİ: Customer verilerini güvenli şekilde yükle
  private async loadCustomersSafely(): Promise<any[]> {
    try {
      const { customerService } = await import('./customer.service');
      const customers = await customerService.getAll();
      return customers;
    } catch (error: any) {
      // 403 hatası veya başka bir hata durumunda boş array dön
      console.log('Müşteri verileri yüklenemedi (yetki sorunu olabilir)');
      return [];
    }
  }

  // Helper method: Dakikayı TimeSpan formatına çevir
  private minutesToTimeSpan(minutes: number | undefined): string | null {
    if (minutes === undefined || minutes === null) {
      return null;
    }
    
    if (minutes === 0) {
      return "00:00:00";
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
  }

  // Helper method: TimeSpan'ı dakikaya çevir (read için)
  private timeSpanToMinutes(timeSpan: string | null | undefined): number | undefined {
    if (!timeSpan) return undefined;
    const parts = timeSpan.split(':');
    if (parts.length !== 3) return undefined;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }

  // Helper method: Mevcut saati TimeSpan formatına çevir
  private getCurrentTimeAsTimeSpan(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Helper method: X saat sonrasını TimeSpan formatında al
  private getTimeSpanAfterHours(hoursToAdd: number): string {
    const now = new Date();
    now.setHours(now.getHours() + hoursToAdd);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // Helper method: Adresi maksimum 100 karaktere kısalt
  private truncateAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 100) return address;
    
    // Türkiye'yi kaldır (genelde sonda)
    let shortAddress = address.replace(', Türkiye', '');
    
    // Hala uzunsa, posta kodunu ve il/ilçe bilgisini sadeleştir
    if (shortAddress.length > 100) {
      // Posta kodunu bul ve kaldır
      shortAddress = shortAddress.replace(/,?\s*\d{5}\s*/g, ' ');
    }
    
    // Hala uzunsa, ilk 97 karakteri al ve ... ekle
    if (shortAddress.length > 100) {
      shortAddress = shortAddress.substring(0, 97) + '...';
    }
    
    return shortAddress.trim();
  }

  async getAll(): Promise<Route[]> {
    try {
      const response = await api.get(this.baseUrl);
      
      // ✅ Müşteri listesini güvenli şekilde al
      const customers = await this.loadCustomersSafely();
      
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: route.totalDistance || 0,
        totalDuration: route.totalDuration || 0,
        completedDeliveries: route.completedDeliveries || 0,
        totalDeliveries: route.totalDeliveries || route.stops?.length || 0
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }

  async getById(id: string | number): Promise<Route> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      
      // ✅ Müşteri bilgilerini güvenli şekilde yükle
      const customers = await this.loadCustomersSafely();
      
      // ServiceTime'ları dakikaya çevir ve customer objelerini ekle
      const route = {
        ...response.data,
        stops: response.data.stops?.map((stop: any) => {
          // Customer objesini bul
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: response.data.totalDistance || 0,
        totalDuration: response.data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
        // Optimized durumu kesinlikle al
        optimized: response.data.optimized === true
      };
      
      return route;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  }

  async create(data: Partial<Route>): Promise<Route> {
    try {
      // Frontend'den gelen customer objelerini sakla
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      
      // Depot bilgisini al
      let depotInfo = data.depot;
      
      // Transform frontend Route format to backend CreateRouteDto - PascalCase kullan!
      const createDto: any = {
        Name: data.name || `Rota ${new Date().toLocaleDateString('tr-TR')}`,
        Date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        DepotId: data.depotId ? Number(data.depotId) : 0,
        DriverId: data.driverId ? Number(data.driverId) : undefined,
        VehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        Optimized: data.optimized || false,
        TotalDistance: data.totalDistance || 0,
        TotalDuration: data.totalDuration || 0,
        Notes: data.notes || '',
        Stops: data.stops?.map((stop, index) => {
          let customerId: number;
          
          // Customer objesinden ID al
          if (stop.customer && typeof stop.customer.id === 'number') {
            customerId = stop.customer.id;
          } else if (stop.customer && typeof stop.customer.id === 'string' && !stop.customer.id.startsWith('google-')) {
            customerId = parseInt(stop.customer.id);
          } else if (typeof stop.customerId === 'string' && !stop.customerId.startsWith('google-')) {
            customerId = parseInt(stop.customerId);
          } else if (typeof stop.customerId === 'number') {
            customerId = stop.customerId;
          } else {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          // NaN kontrolü
          if (isNaN(customerId) || customerId <= 0) {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          const customer = stop.customer || originalCustomers[index];
          const serviceTimeSpan = this.minutesToTimeSpan(stop.serviceTime);
          
          // PascalCase kullan ve Address'i 100 karaktere kısalt!
          return {
            CustomerId: customerId,
            Name: customer?.name || '',
            Address: this.truncateAddress(customer?.address || ''), // ✅ 100 karakter sınırı
            Latitude: customer?.latitude || 0,
            Longitude: customer?.longitude || 0,
            Notes: stop.stopNotes || '',
            ContactFullName: customer?.name || '',
            ContactPhone: customer?.phone || '',
            ContactEmail: customer?.email || '',
            Type: 10, // Delivery
            OrderType: 20, // Auto
            ProofOfDeliveryRequired: false,
            ArriveBetweenStart: stop.overrideTimeWindow?.start ? `${stop.overrideTimeWindow.start}:00` : null,
            ArriveBetweenEnd: stop.overrideTimeWindow?.end ? `${stop.overrideTimeWindow.end}:00` : null,
            ServiceTime: serviceTimeSpan
          };
        }) || [],
        // StartDetails - PascalCase ve Address kısaltması
        StartDetails: depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'), // ✅ 100 karakter sınırı
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0,
          StartTime: this.getCurrentTimeAsTimeSpan()
        } : null,
        // EndDetails - PascalCase ve Address kısaltması
        EndDetails: depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'), // ✅ 100 karakter sınırı
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0
        } : null
      };

      // Validation
      if (!createDto.DepotId || createDto.DepotId === 0) {
        throw new Error('Depo seçimi zorunludur!');
      }

      if (!createDto.Name) {
        throw new Error('Rota adı zorunludur!');
      }

      // NaN kontrolü
      if (isNaN(createDto.DepotId)) {
        throw new Error('Geçersiz depo ID!');
      }

      if (createDto.DriverId && isNaN(createDto.DriverId)) {
        throw new Error('Geçersiz sürücü ID!');
      }

      if (createDto.VehicleId && isNaN(createDto.VehicleId)) {
        throw new Error('Geçersiz araç ID!');
      }
      
      console.log('Sending to backend:', JSON.stringify(createDto, null, 2));
      
      const response = await api.post(this.baseUrl, createDto);
      
      // Response'daki serviceTime'ları dakikaya çevir ve customer bilgilerini ekle
      const createdRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          // Frontend'den gelen customer objesini ekle
          customer: originalCustomers[index] || undefined
        })) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: response.data.totalDistance || data.totalDistance || 0,
        totalDuration: response.data.totalDuration || data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
        // Optimized durumunu koru
        optimized: response.data.optimized || data.optimized || false
      };
      
      return createdRoute;
    } catch (error: any) {
      console.error('Error creating route:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  async update(id: string | number, data: Partial<Route>): Promise<Route> {
    try {
      // Frontend'den gelen customer objelerini sakla
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      
      // Depot bilgisini al
      let depotInfo = data.depot;
      
      // PascalCase kullan!
      const updateDto: any = {
        Name: data.name,
        Date: data.date ? new Date(data.date).toISOString() : undefined,
        DepotId: data.depotId ? Number(data.depotId) : undefined,
        DriverId: data.driverId ? Number(data.driverId) : undefined,
        VehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        Stops: data.stops?.map((stop, index) => {
          let customerId: number;
          
          // Customer objesinden ID al
          if (stop.customer && typeof stop.customer.id === 'number') {
            customerId = stop.customer.id;
          } else if (stop.customer && typeof stop.customer.id === 'string' && !stop.customer.id.startsWith('google-')) {
            customerId = parseInt(stop.customer.id);
          } else if (typeof stop.customerId === 'string' && !stop.customerId.startsWith('google-')) {
            customerId = parseInt(stop.customerId);
          } else if (typeof stop.customerId === 'number') {
            customerId = stop.customerId;
          } else {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          // NaN kontrolü
          if (isNaN(customerId) || customerId <= 0) {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          const customer = stop.customer || originalCustomers[index];
          
          return {
            CustomerId: customerId,
            Name: customer?.name || '',
            Address: this.truncateAddress(customer?.address || ''), // ✅ 100 karakter sınırı
            Latitude: customer?.latitude || 0,
            Longitude: customer?.longitude || 0,
            Notes: stop.stopNotes || '',
            ContactFullName: customer?.name || '',
            ContactPhone: customer?.phone || '',
            ContactEmail: customer?.email || '',
            Type: 10, // Delivery
            OrderType: 20, // Auto
            ProofOfDeliveryRequired: false,
            ArriveBetweenStart: stop.overrideTimeWindow?.start ? `${stop.overrideTimeWindow.start}:00` : null,
            ArriveBetweenEnd: stop.overrideTimeWindow?.end ? `${stop.overrideTimeWindow.end}:00` : null,
            ServiceTime: this.minutesToTimeSpan(stop.serviceTime)
          };
        }),
        // startDetails ve endDetails'e depo bilgilerini ekle
        StartDetails: data.startDetails || (depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'), // ✅ 100 karakter sınırı
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0,
          StartTime: this.getCurrentTimeAsTimeSpan()
        } : undefined),
        EndDetails: data.endDetails || (depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'), // ✅ 100 karakter sınırı
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0
        } : undefined)
      };

      const response = await api.put(`${this.baseUrl}/${id}`, updateDto);
      
      // Response'daki serviceTime'ları dakikaya çevir ve customer bilgilerini ekle
      const updatedRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          // Frontend'den gelen customer objesini ekle
          customer: originalCustomers[index] || undefined
        })) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: response.data.totalDistance || data.totalDistance || 0,
        totalDuration: response.data.totalDuration || data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
        optimized: response.data.optimized || data.optimized || false
      };
      
      return updatedRoute;
    } catch (error: any) {
      console.error('Error updating route:', error);
      throw error;
    }
  }

  async delete(id: string | number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }

  // ✅ YENİ - Backend'de optimize et
  async optimize(routeId: string | number, mode: 'distance' | 'duration' = 'distance'): Promise<Route> {
    try {
      console.log('=== OPTIMIZE ROUTE (Backend) ===');
      console.log('1. Optimizing route ID:', routeId);
      console.log('2. Optimization mode:', mode);
      
      const response = await api.post(`${this.baseUrl}/${routeId}/optimize`, {
        optimizationMode: mode
      });
      
      console.log('3. Optimize response:', response.data);
      
      // ✅ Müşteri bilgilerini güvenli şekilde yükle
      const customers = await this.loadCustomersSafely();
      
      // Response'daki serviceTime'ları dakikaya çevir ve customer objelerini ekle
      const optimizedRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any) => {
          // Customer objesini bul
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen değerler
        totalDistance: response.data.totalDistance || 0,
        totalDuration: response.data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
        optimized: true // Optimize edildi
      };
      
      console.log('4. Final optimized route:', optimizedRoute);
      
      return optimizedRoute;
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  }

  // Duplicate route
  async duplicate(route: Route): Promise<Route> {
    const newRoute = {
      ...route,
      name: `${route.name} (Kopya)`,
      date: new Date(),
      status: 'draft' as const,
      driverId: undefined,
      vehicleId: undefined
    };
    return this.create(newRoute);
  }

  // Get routes by depot
  async getByDepot(depotId: string | number): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}?depotId=${depotId}`);
      
      // ✅ Müşteri listesini güvenli şekilde al
      const customers = await this.loadCustomersSafely();
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: route.totalDistance || 0,
        totalDuration: route.totalDuration || 0,
        completedDeliveries: route.completedDeliveries || 0
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes by depot:', error);
      throw error;
    }
  }

  // Get routes by driver
  async getByDriver(driverId: string | number): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}?driverId=${driverId}`);
      
      // ✅ Müşteri listesini güvenli şekilde al
      const customers = await this.loadCustomersSafely();
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: route.totalDistance || 0,
        totalDuration: route.totalDuration || 0,
        completedDeliveries: route.completedDeliveries || 0
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes by driver:', error);
      throw error;
    }
  }

  // Get routes by date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      
      // ✅ Müşteri listesini güvenli şekilde al
      const customers = await this.loadCustomersSafely();
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            customer: customer || undefined
          };
        }) || [],
        // Backend'den gelen null değerleri için varsayılan değerler
        totalDistance: route.totalDistance || 0,
        totalDuration: route.totalDuration || 0,
        completedDeliveries: route.completedDeliveries || 0
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes by date range:', error);
      throw error;
    }
  }
}

export const routeService = new RouteService();