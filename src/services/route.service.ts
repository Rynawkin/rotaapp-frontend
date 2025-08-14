import { api } from './api';
import { Route, RouteStop } from '@/types';

export interface CreateRouteDto {
  name: string;
  date: string;
  depotId: number;
  driverId?: number;
  vehicleId?: number;
  stops: Array<{
    customerId: number;
    order: number;
    overrideTimeWindow?: {
      start: string;
      end: string;
    };
    overridePriority?: 'high' | 'normal' | 'low';
    serviceTime?: string | null; // TimeSpan format: "HH:mm:ss" veya null
    stopNotes?: string;
  }>;
  startDetails?: {
    name: string;      // Depo adı
    address: string;   // Depo adresi
    latitude: number;  // Depo enlemi
    longitude: number; // Depo boylamı
    startTime: string; // TimeSpan format: "HH:mm:ss"
    notes?: string;
  };
  endDetails?: {
    name: string;      // Depo adı
    address: string;   // Depo adresi
    latitude: number;  // Depo enlemi
    longitude: number; // Depo boylamı
    endTime: string;   // TimeSpan format: "HH:mm:ss"
    notes?: string;
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
    order: number;
    overrideTimeWindow?: {
      start: string;
      end: string;
    };
    overridePriority?: 'high' | 'normal' | 'low';
    serviceTime?: string | null; // TimeSpan format: "HH:mm:ss" veya null
    stopNotes?: string;
  }>;
  startDetails?: {
    name: string;      // Depo adı
    address: string;   // Depo adresi
    latitude: number;  // Depo enlemi
    longitude: number; // Depo boylamı
    startTime: string; // TimeSpan format: "HH:mm:ss"
    notes?: string;
  };
  endDetails?: {
    name: string;      // Depo adı
    address: string;   // Depo adresi
    latitude: number;  // Depo enlemi
    longitude: number; // Depo boylamı
    endTime: string;   // TimeSpan format: "HH:mm:ss"
    notes?: string;
  };
}

class RouteService {
  private baseUrl = '/workspace/journeys/routes';

  // Helper method: Dakikayı TimeSpan formatına çevir
  private minutesToTimeSpan(minutes: number | undefined): string | null {
    // undefined veya 0 ise null döndür
    if (minutes === undefined || minutes === null) {
      return null;
    }
    
    // 0 değeri için de bir TimeSpan döndür
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

  async getAll(): Promise<Route[]> {
    try {
      const response = await api.get(this.baseUrl);
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
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
      // ServiceTime'ları dakikaya çevir
      const route = {
        ...response.data,
        stops: response.data.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
      };
      return route;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  }

  async create(data: Partial<Route> | CreateRouteDto): Promise<Route> {
    try {
      // Debug için gelen veriyi logla
      console.log('=== CREATE ROUTE DEBUG ===');
      console.log('1. Input data:', data);
      console.log('2. Stops with customers:', data.stops?.map(s => ({
        customerId: s.customerId,
        customerName: s.customer?.name,
        customerObject: s.customer
      })));
      
      // Frontend'den gelen customer objelerini sakla
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      
      // Depot bilgisini al
      let depotInfo = null;
      if (data.depot) {
        depotInfo = data.depot;
      } else if (data.depotId) {
        console.warn('Depot object not provided, only depotId available');
      }
      
      // Transform frontend Route format to backend CreateRouteDto
      const createDto: CreateRouteDto = {
        name: data.name || `Rota ${new Date().toLocaleDateString('tr-TR')}`,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        depotId: data.depotId ? Number(data.depotId) : 0,
        driverId: data.driverId ? Number(data.driverId) : undefined,
        vehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        stops: data.stops?.map((stop, index) => {
          let customerId: number;
          
          // Customer objesinden ID al
          if (stop.customer && typeof stop.customer.id === 'number') {
            customerId = stop.customer.id;
            console.log(`Stop ${index}: Using customer.id = ${customerId}, name = ${stop.customer.name}`);
          } else if (stop.customer && typeof stop.customer.id === 'string' && !stop.customer.id.startsWith('google-')) {
            customerId = parseInt(stop.customer.id);
            console.log(`Stop ${index}: Parsing customer.id = ${customerId}, name = ${stop.customer.name}`);
          } else if (typeof stop.customerId === 'string' && !stop.customerId.startsWith('google-')) {
            customerId = parseInt(stop.customerId);
            console.log(`Stop ${index}: Using customerId field = ${customerId}`);
          } else if (typeof stop.customerId === 'number') {
            customerId = stop.customerId;
            console.log(`Stop ${index}: Using numeric customerId = ${customerId}`);
          } else {
            console.error(`Invalid customer at stop ${index}:`, stop);
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          // NaN kontrolü
          if (isNaN(customerId) || customerId <= 0) {
            console.error(`Invalid customerId at stop ${index}:`, customerId);
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          const serviceTimeSpan = this.minutesToTimeSpan(stop.serviceTime);
          
          return {
            customerId: customerId,
            order: stop.order || index + 1,
            overrideTimeWindow: stop.overrideTimeWindow,
            overridePriority: stop.overridePriority,
            serviceTime: serviceTimeSpan,
            stopNotes: stop.stopNotes
          };
        }) || [],
        // startDetails'e depo bilgilerini ekle
        startDetails: depotInfo ? {
          name: depotInfo.name || 'Ana Depo',
          address: depotInfo.address || 'Depo Adresi',
          latitude: depotInfo.latitude || 0,
          longitude: depotInfo.longitude || 0,
          startTime: this.getCurrentTimeAsTimeSpan(),
          notes: data.notes || ''
        } : undefined,
        // endDetails'e de depo bilgilerini ekle
        endDetails: depotInfo ? {
          name: depotInfo.name || 'Ana Depo',
          address: depotInfo.address || 'Depo Adresi',
          latitude: depotInfo.latitude || 0,
          longitude: depotInfo.longitude || 0,
          endTime: this.getTimeSpanAfterHours(8),
          notes: ''
        } : undefined
      };

      // Validation
      if (!createDto.depotId || createDto.depotId === 0) {
        console.error('DepotId is missing or zero!');
        throw new Error('Depo seçimi zorunludur!');
      }

      if (!createDto.name) {
        console.error('Name is missing!');
        throw new Error('Rota adı zorunludur!');
      }

      // NaN kontrolü
      if (isNaN(createDto.depotId)) {
        console.error('DepotId is NaN!', data.depotId);
        throw new Error('Geçersiz depo ID!');
      }

      if (createDto.driverId && isNaN(createDto.driverId)) {
        console.error('DriverId is NaN!', data.driverId);
        throw new Error('Geçersiz sürücü ID!');
      }

      if (createDto.vehicleId && isNaN(createDto.vehicleId)) {
        console.error('VehicleId is NaN!', data.vehicleId);
        throw new Error('Geçersiz araç ID!');
      }

      console.log('3. Final CreateRouteDto:', JSON.stringify(createDto, null, 2));
      
      const response = await api.post(this.baseUrl, createDto);
      console.log('4. Success response:', response.data);
      
      // Response'daki serviceTime'ları dakikaya çevir ve customer bilgilerini ekle
      const createdRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          // Frontend'den gelen customer objesini ekle
          customer: originalCustomers[index] || undefined
        })) || []
      };
      
      console.log('5. Route with customers:', createdRoute);
      
      return createdRoute;
    } catch (error: any) {
      console.error('=== CREATE ROUTE ERROR ===');
      console.error('Error creating route:', error);
      
      // Axios error detayları
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Validation errors'ı parse et
        if (error.response.data?.errors) {
          console.error('Validation errors:');
          if (Array.isArray(error.response.data.errors)) {
            error.response.data.errors.forEach((err: any, index: number) => {
              console.error(`  ${index}:`, err);
            });
          } else {
            Object.entries(error.response.data.errors).forEach(([field, errors]) => {
              console.error(`  ${field}:`, errors);
            });
          }
        }
      }
      
      throw error;
    }
  }

  async update(id: string | number, data: Partial<Route> | UpdateRouteDto): Promise<Route> {
    try {
      console.log('=== UPDATE ROUTE DEBUG ===');
      console.log('1. Route ID:', id);
      console.log('2. Input data:', data);
      
      // Frontend'den gelen customer objelerini sakla
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      
      // Depot bilgisini al
      let depotInfo = null;
      if (data.depot) {
        depotInfo = data.depot;
      }
      
      const updateDto: UpdateRouteDto = {
        name: data.name,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        depotId: data.depotId ? Number(data.depotId) : undefined,
        driverId: data.driverId ? Number(data.driverId) : undefined,
        vehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        stops: data.stops?.map((stop, index) => {
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
            console.error(`Invalid customer at stop ${index}:`, stop);
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          // NaN kontrolü
          if (isNaN(customerId) || customerId <= 0) {
            console.error(`Invalid customerId at stop ${index}:`, customerId);
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          return {
            customerId: customerId,
            order: stop.order || index + 1,
            overrideTimeWindow: stop.overrideTimeWindow,
            overridePriority: stop.overridePriority,
            serviceTime: this.minutesToTimeSpan(stop.serviceTime),
            stopNotes: stop.stopNotes
          };
        }),
        // startDetails ve endDetails'e depo bilgilerini ekle
        startDetails: data.startDetails || (depotInfo ? {
          name: depotInfo.name || 'Ana Depo',
          address: depotInfo.address || 'Depo Adresi',
          latitude: depotInfo.latitude || 0,
          longitude: depotInfo.longitude || 0,
          startTime: this.getCurrentTimeAsTimeSpan(),
          notes: data.notes || ''
        } : undefined),
        endDetails: data.endDetails || (depotInfo ? {
          name: depotInfo.name || 'Ana Depo',
          address: depotInfo.address || 'Depo Adresi',
          latitude: depotInfo.latitude || 0,
          longitude: depotInfo.longitude || 0,
          endTime: this.getTimeSpanAfterHours(8),
          notes: ''
        } : undefined)
      };

      console.log('3. Final UpdateRouteDto:', JSON.stringify(updateDto, null, 2));

      const response = await api.put(`${this.baseUrl}/${id}`, updateDto);
      
      // Response'daki serviceTime'ları dakikaya çevir ve customer bilgilerini ekle
      const updatedRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          // Frontend'den gelen customer objesini ekle
          customer: originalCustomers[index] || undefined
        })) || []
      };
      
      return updatedRoute;
    } catch (error: any) {
      console.error('=== UPDATE ROUTE ERROR ===');
      console.error('Error updating route:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
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

  // Optimize route
  async optimize(routeId: string | number): Promise<Route> {
    try {
      const response = await api.post(`/workspace/journeys/${routeId}/optimize`);
      
      // Response'daki serviceTime'ları dakikaya çevir
      const optimizedRoute = {
        ...response.data,
        stops: response.data.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
      };
      
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
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
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
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
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
      
      // ServiceTime'ları dakikaya çevir
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime)
        })) || []
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes by date range:', error);
      throw error;
    }
  }
}

export const routeService = new RouteService();