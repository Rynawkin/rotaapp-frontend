import { api } from './api';
import { Route, OptimizationResponse } from '@/types';


export interface CreateRouteDto {
  name: string;
  date: string;
  depotId: number;
  driverId?: number;
  vehicleId?: number;
  isPermanent?: boolean;
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
    type: number;
    orderType: number;
    proofOfDeliveryRequired: boolean;
    signatureRequired?: boolean;  // ✅ YENİ
    photoRequired?: boolean;       // ✅ YENİ
    arriveBetweenStart?: string | null;
    arriveBetweenEnd?: string | null;
    serviceTime?: string | null;
    estimatedArrivalTime?: string | null;
    estimatedDepartureTime?: string | null;
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
  optimized?: boolean;
  totalDistance?: number;
  totalDuration?: number;
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
    signatureRequired?: boolean;  // ✅ YENİ
    photoRequired?: boolean;       // ✅ YENİ
    arriveBetweenStart?: string | null;
    arriveBetweenEnd?: string | null;
    serviceTime?: string | null;
    estimatedArrivalTime?: string | null;
    estimatedDepartureTime?: string | null;
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

  private async loadCustomersSafely(): Promise<any[]> {
    try {
      const { customerService } = await import('./customer.service');
      const customers = await customerService.getAll();
      return customers;
    } catch (error: any) {
      console.log('Müşteri verileri yüklenemedi (yetki sorunu olabilir)');
      return [];
    }
  }

  private async waitForOptimizationJob(jobId: string, timeoutMs: number): Promise<any> {
    const startedAt = Date.now();
    const pollIntervalMs = 2000;

    while (Date.now() - startedAt < timeoutMs) {
      const response = await api.get(`${this.baseUrl}/optimization-jobs/${jobId}`);
      const job = response.data;

      if (job?.status === 'completed' || job?.status === 'failed') {
        return job;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Optimization timed out.');
  }

  private buildOptimizationResponse(data: any, customers: any[]): OptimizationResponse {
    const optimizedStops = data.optimizedStops?.map((stop: any) => {
      const customer = customers.find(c => c.id.toString() === stop.customerId.toString());

      return {
        ...stop,
        serviceTime: this.timeSpanToMinutes(stop.serviceTime),
        estimatedArrivalTime: stop.estimatedArrivalTime,
        estimatedDepartureTime: stop.estimatedDepartureTime,
        customer: customer || undefined
      };
    }) || [];

    const excludedStops = data.excludedStops?.map((excluded: any) => ({
      stop: {
        ...excluded.stop,
        serviceTime: this.timeSpanToMinutes(excluded.stop.serviceTime),
        customer: customers.find(c => c.id.toString() === excluded.stop.customerId.toString())
      },
      reason: excluded.reason,
      timeWindowConflict: excluded.timeWindowConflict
    })) || [];

    return {
      success: data.success,
      message: data.message || '',
      optimizedStops: optimizedStops,
      excludedStops: excludedStops,
      totalDistance: data.totalDistance || 0,
      totalDuration: data.totalDuration || 0,
      hasExclusions: data.hasExclusions || false,
      endDetails: data.endDetails || undefined
    };
  }

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

  private timeSpanToMinutes(timeSpan: string | null | undefined): number | undefined {
    if (!timeSpan) return undefined;
    const parts = timeSpan.split(':');
    if (parts.length !== 3) return undefined;
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }

  private getCurrentTimeAsTimeSpan(): string {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private getTimeSpanAfterHours(hoursToAdd: number): string {
    const now = new Date();
    now.setHours(now.getHours() + hoursToAdd);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private truncateAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 100) return address;
    
    let shortAddress = address.replace(', Türkiye', '');
    
    if (shortAddress.length > 100) {
      shortAddress = shortAddress.replace(/,?\s*\d{5}\s*/g, ' ');
    }
    
    if (shortAddress.length > 100) {
      shortAddress = shortAddress.substring(0, 97) + '...';
    }
    
    return shortAddress.trim();
  }

  async getAll(): Promise<Route[]> {
    try {
      const response = await api.get(this.baseUrl);

      const customers = await this.loadCustomersSafely();

      const routes = response.data.map((route: any) => ({
        ...route,
        currentKm: route.currentKm,
        stops: route.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
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
      
      const customers = await this.loadCustomersSafely();
      
      const route = {
        ...response.data,
        currentKm: response.data.currentKm,
        stops: response.data.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());

          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
        totalDistance: response.data.totalDistance || 0,
        totalDuration: response.data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
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
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      let depotInfo = data.depot;
      
      const createDto: any = {
        Name: data.name || `Rota ${new Date().toLocaleDateString('tr-TR')}`,
        Date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        DepotId: data.depotId ? Number(data.depotId) : 0,
        DriverId: data.driverId ? Number(data.driverId) : undefined,
        VehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        CurrentKm: data.currentKm !== undefined ? Number(data.currentKm) : undefined,
        Optimized: data.optimized || false,
        AvoidTolls: false, // Default to false for new routes
        TotalDistance: data.totalDistance || 0,
        TotalDuration: data.totalDuration || 0,
        Notes: data.notes || '',
        Stops: data.stops?.map((stop, index) => {
          let customerId: number;
          
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
          
          if (isNaN(customerId) || customerId <= 0) {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          const customer = stop.customer || originalCustomers[index];
          const serviceTimeSpan = this.minutesToTimeSpan(stop.serviceTime);
          
          return {
            CustomerId: customerId,
            Name: customer?.name || '',
            Address: this.truncateAddress(customer?.address || ''),
            Latitude: customer?.latitude || 0,
            Longitude: customer?.longitude || 0,
            Notes: stop.stopNotes || '',
            ContactFullName: customer?.name || '',
            ContactPhone: customer?.phone || '',
            ContactEmail: customer?.email || '',
            Type: 10,
            OrderType: stop.orderType || 20, // Use orderType from stop data
            ProofOfDeliveryRequired: stop.proofOfDeliveryRequired || false,  // ✅ DÜZELTME
            SignatureRequired: stop.signatureRequired || false,              // ✅ YENİ
            PhotoRequired: stop.photoRequired || false,                      // ✅ YENİ
            ArriveBetweenStart: stop.arriveBetweenStart ?
              (stop.arriveBetweenStart.includes(':') ? `${stop.arriveBetweenStart}:00` : stop.arriveBetweenStart) :
              (stop.overrideTimeWindow?.start ? `${stop.overrideTimeWindow.start}:00` : null),
            ArriveBetweenEnd: stop.arriveBetweenEnd ?
              (stop.arriveBetweenEnd.includes(':') ? `${stop.arriveBetweenEnd}:00` : stop.arriveBetweenEnd) :
              (stop.overrideTimeWindow?.end ? `${stop.overrideTimeWindow.end}:00` : null),
            ServiceTime: serviceTimeSpan,
            EstimatedArrivalTime: stop.estimatedArrivalTime || null,
            EstimatedDepartureTime: stop.estimatedDepartureTime || null
          };
        }) || [],
        StartDetails: depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'),
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0,
          StartTime: data.startDetails?.startTime || this.getCurrentTimeAsTimeSpan()
        } : null,
        EndDetails: depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'),
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0
        } : null
      };

      if (!createDto.DepotId || createDto.DepotId === 0) {
        throw new Error('Depo seçimi zorunludur!');
      }

      if (!createDto.Name) {
        throw new Error('Rota adı zorunludur!');
      }

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
      
      const createdRoute = {
        ...response.data,
        currentKm: response.data.currentKm || data.currentKm,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          estimatedArrivalTime: stop.estimatedArrivalTime,
          estimatedDepartureTime: stop.estimatedDepartureTime,
          customer: originalCustomers[index] || undefined
        })) || [],
        totalDistance: response.data.totalDistance || data.totalDistance || 0,
        totalDuration: response.data.totalDuration || data.totalDuration || 0,
        completedDeliveries: response.data.completedDeliveries || 0,
        totalDeliveries: response.data.totalDeliveries || response.data.stops?.length || 0,
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
      const originalCustomers = data.stops?.map(s => s.customer) || [];
      
      let depotInfo = data.depot;
      
      const updateDto: any = {
        Name: data.name,
        Date: data.date ? new Date(data.date).toISOString() : undefined,
        DepotId: data.depotId ? Number(data.depotId) : undefined,
        DriverId: data.driverId ? Number(data.driverId) : undefined,
        VehicleId: data.vehicleId ? Number(data.vehicleId) : undefined,
        CurrentKm: data.currentKm !== undefined ? Number(data.currentKm) : undefined,
        Optimized: data.optimized,
        TotalDistance: data.totalDistance,
        TotalDuration: data.totalDuration,
        Stops: data.stops?.map((stop, index) => {
          let customerId: number;
          
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
          
          if (isNaN(customerId) || customerId <= 0) {
            throw new Error(`Durak ${index + 1} için geçersiz müşteri ID`);
          }
          
          const customer = stop.customer || originalCustomers[index];
          
          return {
            CustomerId: customerId,
            Name: customer?.name || '',
            Address: this.truncateAddress(customer?.address || ''),
            Latitude: customer?.latitude || 0,
            Longitude: customer?.longitude || 0,
            Notes: stop.stopNotes || '',
            ContactFullName: customer?.name || '',
            ContactPhone: customer?.phone || '',
            ContactEmail: customer?.email || '',
            Type: 10,
            OrderType: stop.orderType || 20, // Use existing orderType from stop
            ProofOfDeliveryRequired: stop.proofOfDeliveryRequired || false,  // ✅ DÜZELTME
            SignatureRequired: stop.signatureRequired || false,              // ✅ YENİ
            PhotoRequired: stop.photoRequired || false,                      // ✅ YENİ
            ArriveBetweenStart: stop.arriveBetweenStart ?
              (stop.arriveBetweenStart.includes(':') ? `${stop.arriveBetweenStart}:00` : stop.arriveBetweenStart) :
              (stop.overrideTimeWindow?.start ? `${stop.overrideTimeWindow.start}:00` : null),
            ArriveBetweenEnd: stop.arriveBetweenEnd ?
              (stop.arriveBetweenEnd.includes(':') ? `${stop.arriveBetweenEnd}:00` : stop.arriveBetweenEnd) :
              (stop.overrideTimeWindow?.end ? `${stop.overrideTimeWindow.end}:00` : null),
            ServiceTime: this.minutesToTimeSpan(stop.serviceTime),
            EstimatedArrivalTime: stop.estimatedArrivalTime || null,
            EstimatedDepartureTime: stop.estimatedDepartureTime || null
          };
        }),
        StartDetails: data.startDetails || (depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'),
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0,
          StartTime: data.startDetails?.startTime || this.getCurrentTimeAsTimeSpan()
        } : undefined),
        EndDetails: data.endDetails || (depotInfo ? {
          Name: depotInfo.name || 'Ana Depo',
          Address: this.truncateAddress(depotInfo.address || 'Depo Adresi'),
          Latitude: depotInfo.latitude || 0,
          Longitude: depotInfo.longitude || 0
        } : undefined)
      };

      const response = await api.put(`${this.baseUrl}/${id}`, updateDto);
      
      const updatedRoute = {
        ...response.data,
        currentKm: response.data.currentKm || data.currentKm,
        stops: response.data.stops?.map((stop: any, index: number) => ({
          ...stop,
          serviceTime: this.timeSpanToMinutes(stop.serviceTime),
          estimatedArrivalTime: stop.estimatedArrivalTime,
          estimatedDepartureTime: stop.estimatedDepartureTime,
          customer: originalCustomers[index] || undefined
        })) || [],
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

  async optimize(routeId: string | number, mode: 'distance' | 'duration' = 'distance', avoidTolls: boolean = false): Promise<OptimizationResponse> {
    try {
      console.log('=== OPTIMIZE ROUTE (Backend) ===');
      console.log('1. Optimizing route ID:', routeId);
      console.log('2. Optimization mode:', mode);
      console.log('3. Avoid tolls:', avoidTolls);

      // Optimization with time windows - queued async job
      const response = await api.post(`${this.baseUrl}/${routeId}/optimize`, {
        optimizationMode: mode,
        avoidTolls: avoidTolls
      }, {
        timeout: 300000 // 5 minutes timeout (backend may take longer for large routes)
      });
      
      console.log('3. Optimize response:', response.data);

      const customers = await this.loadCustomersSafely();
      const responseData = response.data;

      if (responseData?.jobId) {
        const jobResult = await this.waitForOptimizationJob(responseData.jobId, 10 * 60 * 1000);

        if (jobResult?.status === 'failed') {
          return {
            success: false,
            message: jobResult.message || 'Optimization failed.',
            optimizedStops: [],
            excludedStops: [],
            totalDistance: 0,
            totalDuration: 0,
            hasExclusions: false
          };
        }

        if (!jobResult?.result) {
          return {
            success: false,
            message: jobResult.message || 'Optimization result not ready.',
            optimizedStops: [],
            excludedStops: [],
            totalDistance: 0,
            totalDuration: 0,
            hasExclusions: false
          };
        }

        const optimizationResponse = this.buildOptimizationResponse(jobResult.result, customers);
        console.log('4. Final optimization response:', optimizationResponse);
        return optimizationResponse;
      }

      const optimizationResponse = this.buildOptimizationResponse(responseData, customers);
      console.log('4. Final optimization response:', optimizationResponse);
      return optimizationResponse;
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw error;
    }
  }

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

  async getByVehicleId(vehicleId: string | number): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}?vehicleId=${vehicleId}`);
      
      const customers = await this.loadCustomersSafely();
      
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
        totalDistance: route.totalDistance || 0,
        totalDuration: route.totalDuration || 0,
        completedDeliveries: route.completedDeliveries || 0,
        totalDeliveries: route.totalDeliveries || route.stops?.length || 0
      }));
      
      return routes;
    } catch (error) {
      console.error('Error fetching routes by vehicle ID:', error);
      return []; // Return empty array instead of throwing for better UX
    }
  }

  async getByDepot(depotId: string | number): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}?depotId=${depotId}`);
      
      const customers = await this.loadCustomersSafely();
      
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: route.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
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

  async getByDriver(driverId: string | number): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}?driverId=${driverId}`);
      
      const customers = await this.loadCustomersSafely();
      
      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
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

  async getByDateRange(startDate: Date, endDate: Date): Promise<Route[]> {
    try {
      const response = await api.get(`${this.baseUrl}`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      const customers = await this.loadCustomersSafely();

      const routes = response.data.map((route: any) => ({
        ...route,
        stops: response.data.stops?.map((stop: any) => {
          const customer = customers.find(c => c.id.toString() === stop.customerId.toString());
          return {
            ...stop,
            serviceTime: this.timeSpanToMinutes(stop.serviceTime),
            estimatedArrivalTime: stop.estimatedArrivalTime,
            estimatedDepartureTime: stop.estimatedDepartureTime,
            customer: customer || undefined
          };
        }) || [],
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

  async updateStop(routeId: number, stopId: number, updates: {
    customerId?: number;
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    contactFullName?: string;
    contactPhone?: string;
    contactEmail?: string;
    type?: number;
    orderType?: number;
    proofOfDeliveryRequired?: boolean;
    signatureRequired?: boolean;
    photoRequired?: boolean;
    arriveBetweenStart?: string;
    arriveBetweenEnd?: string;
    serviceTime?: string;
  }): Promise<boolean> {
    try {
      console.log('=== UPDATING ROUTE STOP ===');
      console.log('RouteId:', routeId);
      console.log('StopId:', stopId);
      console.log('Updates:', updates);

      const updateData = {
        StopId: stopId,
        RouteId: routeId,
        CustomerId: updates.customerId,
        Name: updates.name,
        Address: updates.address,
        Latitude: updates.latitude,
        Longitude: updates.longitude,
        Notes: updates.notes,
        ContactFullName: updates.contactFullName,
        ContactPhone: updates.contactPhone,
        ContactEmail: updates.contactEmail,
        Type: updates.type,
        OrderType: updates.orderType,
        ProofOfDeliveryRequired: updates.proofOfDeliveryRequired,
        SignatureRequired: updates.signatureRequired,
        PhotoRequired: updates.photoRequired,
        ArriveBetweenStart: updates.arriveBetweenStart ? `${updates.arriveBetweenStart}:00` : null,
        ArriveBetweenEnd: updates.arriveBetweenEnd ? `${updates.arriveBetweenEnd}:00` : null,
        ServiceTime: updates.serviceTime
      };

      console.log('Sending to UpdateStop API:', updateData);

      const response = await api.put(`${this.baseUrl}/${routeId}/stops/${stopId}`, updateData);

      console.log('UpdateStop response:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error updating route stop:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }
}

export const routeService = new RouteService();
