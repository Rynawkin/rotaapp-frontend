import { Route, Customer, Driver, Vehicle, Depot, Journey } from '@/types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    code: 'MUS001',
    name: 'Bakkal Mehmet',
    address: 'Kadıköy, Moda Cad. No:45',
    phone: '0532 111 2233',
    email: 'mehmet@example.com',
    latitude: 40.9869,
    longitude: 29.0252,
    timeWindow: { start: '09:00', end: '12:00' },
    priority: 'high',
    estimatedServiceTime: 15,
    notes: 'Kapı zili bozuk, telefon et',
    tags: ['bakkal', 'vip'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    code: 'MUS002',
    name: 'Market 24',
    address: 'Üsküdar, Çarşı Sok. No:12',
    phone: '0533 444 5566',
    latitude: 41.0227,
    longitude: 29.0173,
    priority: 'normal',
    estimatedServiceTime: 20,
    tags: ['market'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    code: 'MUS003',
    name: 'Şarküteri Ayşe',
    address: 'Beşiktaş, Barbaros Bulvarı No:78',
    phone: '0534 777 8899',
    latitude: 41.0442,
    longitude: 29.0061,
    timeWindow: { start: '14:00', end: '17:00' },
    priority: 'normal',
    estimatedServiceTime: 10,
    tags: ['şarküteri'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '4',
    code: 'MUS004',
    name: 'Tekel Büfe Ali',
    address: 'Sarıyer, Rumeli Hisarı Mah. No:23',
    phone: '0535 222 3344',
    latitude: 41.0853,
    longitude: 29.0568,
    priority: 'low',
    estimatedServiceTime: 5,
    tags: ['büfe'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  },
  {
    id: '5',
    code: 'MUS005',
    name: 'Gross Market',
    address: 'Ataşehir, Atatürk Mah. No:90',
    phone: '0536 555 6677',
    latitude: 40.9826,
    longitude: 29.1276,
    priority: 'high',
    estimatedServiceTime: 30,
    notes: 'Büyük sipariş, kamyonet gerekli',
    tags: ['market', 'vip'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  }
];

// Mock Drivers
export const mockDrivers: Driver[] = [
  {
    id: '1',
    name: 'Mehmet Öz',
    phone: '0531 123 4567',
    email: 'mehmet@rotaapp.com',
    licenseNumber: 'B-123456',
    status: 'available',
    rating: 4.8,
    totalDeliveries: 1250,
    createdAt: new Date('2023-06-15')
  },
  {
    id: '2',
    name: 'Ali Yılmaz',
    phone: '0532 234 5678',
    licenseNumber: 'B-234567',
    status: 'busy',
    rating: 4.6,
    totalDeliveries: 980,
    createdAt: new Date('2023-07-20')
  },
  {
    id: '3',
    name: 'Ayşe Kaya',
    phone: '0533 345 6789',
    email: 'ayse@rotaapp.com',
    licenseNumber: 'B-345678',
    status: 'available',
    rating: 4.9,
    totalDeliveries: 1450,
    createdAt: new Date('2023-05-10')
  },
  {
    id: '4',
    name: 'Fatma Demir',
    phone: '0534 456 7890',
    licenseNumber: 'B-456789',
    status: 'offline',
    rating: 4.7,
    totalDeliveries: 850,
    createdAt: new Date('2023-08-01')
  }
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    plateNumber: '34 ABC 123',
    type: 'van',
    brand: 'Ford',
    model: 'Transit',
    year: 2021,
    capacity: 1500,
    status: 'active',
    fuelType: 'diesel'
  },
  {
    id: '2',
    plateNumber: '34 DEF 456',
    type: 'car',
    brand: 'Fiat',
    model: 'Doblo',
    year: 2020,
    capacity: 800,
    status: 'active',
    fuelType: 'gasoline'
  },
  {
    id: '3',
    plateNumber: '34 GHI 789',
    type: 'truck',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2022,
    capacity: 3000,
    status: 'active',
    fuelType: 'diesel'
  }
];

// Mock Depots
export const mockDepots: Depot[] = [
  {
    id: '1',
    name: 'Ana Depo - Kadıköy',
    address: 'Kadıköy, Rıhtım Cad. No:1',
    latitude: 40.9913,
    longitude: 29.0236,
    isDefault: true,
    workingHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '14:00' },
      sunday: { open: 'closed', close: 'closed' }
    }
  },
  {
    id: '2',
    name: 'Depo 2 - Ataşehir',
    address: 'Ataşehir, Kayışdağı Cad. No:45',
    latitude: 40.9826,
    longitude: 29.1276,
    isDefault: false
  }
];

// Mock Routes - İLK ROUTE'UN STATUS'U PLANNED OLARAK DEĞİŞTİRİLDİ
export const mockRoutes: Route[] = [
  {
    id: '1',
    name: 'Kadıköy Bölgesi - Sabah',
    date: new Date(),
    driverId: '1',
    driver: mockDrivers[0],
    vehicleId: '1',
    vehicle: mockVehicles[0],
    depotId: '1',
    status: 'planned',  // 'in_progress' yerine 'planned' - Sefer başlatılabilir durumda
    stops: [
      {
        id: '1-1',
        routeId: '1',
        customerId: '1',
        customer: mockCustomers[0],
        order: 1,
        status: 'pending',
        estimatedArrival: new Date(),
        duration: 15,
        distance: 5.2
      },
      {
        id: '1-2',
        routeId: '1',
        customerId: '2',
        customer: mockCustomers[1],
        order: 2,
        status: 'pending',
        estimatedArrival: new Date(),
        duration: 10,
        distance: 3.8
      },
      {
        id: '1-3',
        routeId: '1',
        customerId: '5',
        customer: mockCustomers[4],
        order: 3,
        status: 'pending',
        estimatedArrival: new Date(),
        distance: 7.5
      }
    ],
    totalDistance: 16.5,
    totalDuration: 75,
    totalDeliveries: 3,
    completedDeliveries: 0,
    optimized: true,
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Beşiktaş - Sarıyer Hattı',
    date: new Date(),
    driverId: '2',
    driver: mockDrivers[1],
    vehicleId: '2',
    vehicle: mockVehicles[1],
    depotId: '1',
    status: 'planned',
    stops: [
      {
        id: '2-1',
        routeId: '2',
        customerId: '3',
        customer: mockCustomers[2],
        order: 1,
        status: 'pending',
        estimatedArrival: new Date(),
        distance: 8.2
      },
      {
        id: '2-2',
        routeId: '2',
        customerId: '4',
        customer: mockCustomers[3],
        order: 2,
        status: 'pending',
        estimatedArrival: new Date(),
        distance: 5.5
      }
    ],
    totalDistance: 13.7,
    totalDuration: 60,
    totalDeliveries: 2,
    completedDeliveries: 0,
    optimized: false,
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Üsküdar Express',
    date: new Date(Date.now() - 86400000),
    driverId: '3',
    driver: mockDrivers[2],
    vehicleId: '3',
    vehicle: mockVehicles[2],
    depotId: '1',
    status: 'completed',
    stops: [
      {
        id: '3-1',
        routeId: '3',
        customerId: '2',
        customer: mockCustomers[1],
        order: 1,
        status: 'completed',
        actualArrival: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 86400000),
        duration: 12,
        distance: 4.5
      }
    ],
    totalDistance: 9.2,
    totalDuration: 45,
    totalDeliveries: 1,
    completedDeliveries: 1,
    optimized: true,
    createdAt: new Date(Date.now() - 172800000),
    startedAt: new Date(Date.now() - 86400000),
    completedAt: new Date(Date.now() - 82800000)
  }
];

// Helper functions with fake delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Route Service - GÜNCELLENMİŞ create() ve update() metodları
export const routeService = {
  async getAll(): Promise<Route[]> {
    await delay(500);
    const savedRoutes = localStorage.getItem('routes');
    if (savedRoutes) {
      return JSON.parse(savedRoutes);
    }
    localStorage.setItem('routes', JSON.stringify(mockRoutes));
    return mockRoutes;
  },

  async getById(id: string): Promise<Route | null> {
    await delay(300);
    const routes = await this.getAll();
    return routes.find(r => r.id === id) || null;
  },

  async create(route: Partial<Route>): Promise<Route> {
    await delay(500);
    const routes = await this.getAll();
    
    // Driver ve Vehicle bilgilerini al
    let driver = route.driver;
    let vehicle = route.vehicle;
    
    if (!driver && route.driverId) {
      driver = await driverService.getById(route.driverId) || undefined;
    }
    
    if (!vehicle && route.vehicleId) {
      vehicle = await vehicleService.getById(route.vehicleId) || undefined;
    }
    
    const newRoute: Route = {
      id: Date.now().toString(),
      name: route.name || 'Yeni Rota',
      date: route.date || new Date(),
      depotId: route.depotId || '1',
      status: route.status || 'draft',
      stops: route.stops || [],
      totalDistance: route.totalDistance || 0,
      totalDuration: route.totalDuration || 0,
      totalDeliveries: route.stops?.length || 0,
      completedDeliveries: 0,
      optimized: route.optimized || false,
      createdAt: new Date(),
      driverId: route.driverId,
      driver: driver,  // Driver objesini ekle
      vehicleId: route.vehicleId,
      vehicle: vehicle,  // Vehicle objesini ekle
      ...route
    };
    
    routes.push(newRoute);
    localStorage.setItem('routes', JSON.stringify(routes));
    return newRoute;
  },

  async update(id: string, updates: Partial<Route>): Promise<Route | null> {
    await delay(400);
    const routes = await this.getAll();
    const index = routes.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    // Driver ve Vehicle bilgilerini güncelle
    let driver = updates.driver;
    let vehicle = updates.vehicle;
    
    if (!driver && updates.driverId && updates.driverId !== routes[index].driverId) {
      driver = await driverService.getById(updates.driverId) || undefined;
    }
    
    if (!vehicle && updates.vehicleId && updates.vehicleId !== routes[index].vehicleId) {
      vehicle = await vehicleService.getById(updates.vehicleId) || undefined;
    }
    
    routes[index] = { 
      ...routes[index], 
      ...updates,
      driver: driver || routes[index].driver,
      vehicle: vehicle || routes[index].vehicle
    };
    
    localStorage.setItem('routes', JSON.stringify(routes));
    return routes[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const routes = await this.getAll();
    const filtered = routes.filter(r => r.id !== id);
    
    if (filtered.length === routes.length) return false;
    
    localStorage.setItem('routes', JSON.stringify(filtered));
    return true;
  },

  async optimize(id: string): Promise<Route | null> {
    await delay(1500);
    const route = await this.getById(id);
    
    if (!route) return null;
    
    const optimizedStops = [...route.stops].sort(() => Math.random() - 0.5);
    const optimizedRoute = {
      ...route,
      stops: optimizedStops.map((stop, index) => ({
        ...stop,
        order: index + 1
      })),
      optimized: true,
      totalDistance: Math.round(route.totalDistance * 0.85 * 10) / 10
    };
    
    return this.update(id, optimizedRoute);
  },

  // REPORT İÇİN YENİ METODLAR
  async getByDateRange(startDate: Date, endDate: Date): Promise<Route[]> {
    await delay(300);
    const routes = await this.getAll();
    return routes.filter(r => {
      const routeDate = new Date(r.date);
      return routeDate >= startDate && routeDate <= endDate;
    });
  },

  async getByStatus(status: Route['status']): Promise<Route[]> {
    await delay(300);
    const routes = await this.getAll();
    return routes.filter(r => r.status === status);
  },

  async getByDriverId(driverId: string): Promise<Route[]> {
    await delay(300);
    const routes = await this.getAll();
    return routes.filter(r => r.driverId === driverId);
  },

  async getStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    planned: number;
    cancelled: number;
    totalDistance: number;
    totalDuration: number;
    avgDeliveryTime: number;
    successRate: number;
  }> {
    await delay(400);
    const routes = await this.getAll();
    
    const total = routes.length;
    const completed = routes.filter(r => r.status === 'completed').length;
    const inProgress = routes.filter(r => r.status === 'in_progress').length;
    const planned = routes.filter(r => r.status === 'planned').length;
    const cancelled = routes.filter(r => r.status === 'cancelled').length;
    
    const totalDistance = routes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
    const totalDuration = routes.reduce((acc, r) => acc + (r.totalDuration || 0), 0);
    
    const completedRoutes = routes.filter(r => r.status === 'completed');
    const avgDeliveryTime = completedRoutes.length > 0
      ? totalDuration / completedRoutes.length
      : 0;
    
    const totalDeliveries = routes.reduce((acc, r) => acc + r.totalDeliveries, 0);
    const completedDeliveries = routes.reduce((acc, r) => acc + r.completedDeliveries, 0);
    const successRate = totalDeliveries > 0
      ? Math.round((completedDeliveries / totalDeliveries) * 100)
      : 0;
    
    return {
      total,
      completed,
      inProgress,
      planned,
      cancelled,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
      avgDeliveryTime: Math.round(avgDeliveryTime),
      successRate
    };
  }
};

// Customer Service
export const customerService = {
  async getAll(): Promise<Customer[]> {
    await delay(400);
    const saved = localStorage.getItem('customers');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('customers', JSON.stringify(mockCustomers));
    return mockCustomers;
  },

  async getById(id: string): Promise<Customer | null> {
    await delay(300);
    const customers = await this.getAll();
    return customers.find(c => c.id === id) || null;
  },

  async search(query: string): Promise<Customer[]> {
    await delay(300);
    const customers = await this.getAll();
    const lowQuery = query.toLowerCase();
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowQuery) ||
      c.code.toLowerCase().includes(lowQuery) ||
      c.address.toLowerCase().includes(lowQuery) ||
      c.phone.toLowerCase().includes(lowQuery)
    );
  },

  async create(customer: Partial<Customer>): Promise<Customer> {
    await delay(500);
    const customers = await this.getAll();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      code: customer.code || `MUS${String(customers.length + 1).padStart(3, '0')}`,
      name: customer.name || '',
      address: customer.address || '',
      phone: customer.phone || '',
      latitude: customer.latitude || 40.9869,
      longitude: customer.longitude || 29.0252,
      priority: customer.priority || 'normal',
      tags: customer.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customer
    };
    
    customers.push(newCustomer);
    localStorage.setItem('customers', JSON.stringify(customers));
    return newCustomer;
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    await delay(400);
    const customers = await this.getAll();
    const index = customers.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    customers[index] = { 
      ...customers[index], 
      ...updates,
      updatedAt: new Date() 
    };
    localStorage.setItem('customers', JSON.stringify(customers));
    return customers[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const customers = await this.getAll();
    const filtered = customers.filter(c => c.id !== id);
    
    if (filtered.length === customers.length) return false;
    
    localStorage.setItem('customers', JSON.stringify(filtered));
    return true;
  },

  async bulkImport(customers: Partial<Customer>[]): Promise<Customer[]> {
    await delay(1000);
    const existingCustomers = await this.getAll();
    const newCustomers: Customer[] = [];
    
    for (const customer of customers) {
      const newCustomer: Customer = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        code: customer.code || `MUS${String(existingCustomers.length + newCustomers.length + 1).padStart(3, '0')}`,
        name: customer.name || '',
        address: customer.address || '',
        phone: customer.phone || '',
        latitude: customer.latitude || 40.9869,
        longitude: customer.longitude || 29.0252,
        priority: customer.priority || 'normal',
        tags: customer.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...customer
      };
      newCustomers.push(newCustomer);
    }
    
    const allCustomers = [...existingCustomers, ...newCustomers];
    localStorage.setItem('customers', JSON.stringify(allCustomers));
    return newCustomers;
  },

  // REPORT İÇİN YENİ METODLAR
  async getByPriority(priority: Customer['priority']): Promise<Customer[]> {
    await delay(300);
    const customers = await this.getAll();
    return customers.filter(c => c.priority === priority);
  },

  async getStats(): Promise<{
    total: number;
    highPriority: number;
    normalPriority: number;
    lowPriority: number;
    withTimeWindow: number;
    avgServiceTime: number;
  }> {
    await delay(400);
    const customers = await this.getAll();
    
    const total = customers.length;
    const highPriority = customers.filter(c => c.priority === 'high').length;
    const normalPriority = customers.filter(c => c.priority === 'normal').length;
    const lowPriority = customers.filter(c => c.priority === 'low').length;
    const withTimeWindow = customers.filter(c => c.timeWindow).length;
    
    const totalServiceTime = customers.reduce((acc, c) => acc + (c.estimatedServiceTime || 15), 0);
    const avgServiceTime = total > 0 ? Math.round(totalServiceTime / total) : 0;
    
    return {
      total,
      highPriority,
      normalPriority,
      lowPriority,
      withTimeWindow,
      avgServiceTime
    };
  }
};

// Driver Service
export const driverService = {
  async getAll(): Promise<Driver[]> {
    await delay(400);
    const saved = localStorage.getItem('drivers');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('drivers', JSON.stringify(mockDrivers));
    return mockDrivers;
  },

  async getById(id: string): Promise<Driver | null> {
    await delay(300);
    const drivers = await this.getAll();
    return drivers.find(d => d.id === id) || null;
  },

  async getAvailable(): Promise<Driver[]> {
    await delay(300);
    const drivers = await this.getAll();
    return drivers.filter(d => d.status === 'available');
  },

  async search(query: string): Promise<Driver[]> {
    await delay(300);
    const drivers = await this.getAll();
    const lowQuery = query.toLowerCase();
    
    return drivers.filter(d => 
      d.name.toLowerCase().includes(lowQuery) ||
      d.phone.toLowerCase().includes(lowQuery) ||
      (d.email && d.email.toLowerCase().includes(lowQuery)) ||
      d.licenseNumber.toLowerCase().includes(lowQuery)
    );
  },

  async create(driver: Partial<Driver>): Promise<Driver> {
    await delay(500);
    const drivers = await this.getAll();
    const newDriver: Driver = {
      id: Date.now().toString(),
      name: driver.name || '',
      phone: driver.phone || '',
      email: driver.email,
      licenseNumber: driver.licenseNumber || '',
      status: driver.status || 'available',
      rating: driver.rating || 0,
      totalDeliveries: driver.totalDeliveries || 0,
      createdAt: new Date(),
      ...driver
    };
    
    drivers.push(newDriver);
    localStorage.setItem('drivers', JSON.stringify(drivers));
    return newDriver;
  },

  async update(id: string, updates: Partial<Driver>): Promise<Driver | null> {
    await delay(400);
    const drivers = await this.getAll();
    const index = drivers.findIndex(d => d.id === id);
    
    if (index === -1) return null;
    
    drivers[index] = { 
      ...drivers[index], 
      ...updates
    };
    localStorage.setItem('drivers', JSON.stringify(drivers));
    return drivers[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const drivers = await this.getAll();
    const filtered = drivers.filter(d => d.id !== id);
    
    if (filtered.length === drivers.length) return false;
    
    localStorage.setItem('drivers', JSON.stringify(filtered));
    return true;
  },

  async updateStatus(id: string, status: 'available' | 'busy' | 'offline'): Promise<Driver | null> {
    return this.update(id, { status });
  },

  // REPORT İÇİN YENİ METODLAR
  async getPerformanceStats(): Promise<Array<{
    driver: Driver;
    completedRoutes: number;
    totalDeliveries: number;
    avgRating: number;
    totalDistance: number;
    avgDeliveryTime: number;
  }>> {
    await delay(500);
    const drivers = await this.getAll();
    const routes = await routeService.getAll();
    
    return drivers.map(driver => {
      const driverRoutes = routes.filter(r => r.driverId === driver.id);
      const completedRoutes = driverRoutes.filter(r => r.status === 'completed').length;
      const totalDeliveries = driverRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
      const totalDistance = driverRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      const totalDuration = driverRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0);
      const avgDeliveryTime = completedRoutes > 0 ? totalDuration / completedRoutes : 0;
      
      return {
        driver,
        completedRoutes,
        totalDeliveries,
        avgRating: driver.rating || 0,
        totalDistance: Math.round(totalDistance),
        avgDeliveryTime: Math.round(avgDeliveryTime)
      };
    });
  }
};

// Vehicle Service
export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    await delay(400);
    const saved = localStorage.getItem('vehicles');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('vehicles', JSON.stringify(mockVehicles));
    return mockVehicles;
  },

  async getById(id: string): Promise<Vehicle | null> {
    await delay(300);
    const vehicles = await this.getAll();
    return vehicles.find(v => v.id === id) || null;
  },

  async getAvailable(): Promise<Vehicle[]> {
    await delay(300);
    const vehicles = await this.getAll();
    return vehicles.filter(v => v.status === 'active');
  },

  async search(query: string): Promise<Vehicle[]> {
    await delay(300);
    const vehicles = await this.getAll();
    const lowQuery = query.toLowerCase();
    
    return vehicles.filter(v => 
      v.plateNumber.toLowerCase().includes(lowQuery) ||
      v.brand.toLowerCase().includes(lowQuery) ||
      v.model.toLowerCase().includes(lowQuery) ||
      v.type.toLowerCase().includes(lowQuery)
    );
  },

  async create(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    await delay(500);
    const vehicles = await this.getAll();
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      plateNumber: vehicle.plateNumber || '',
      type: vehicle.type || 'car',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      capacity: vehicle.capacity || 1000,
      status: vehicle.status || 'active',
      fuelType: vehicle.fuelType || 'diesel',
      ...vehicle
    };
    
    vehicles.push(newVehicle);
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    return newVehicle;
  },

  async update(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
    await delay(400);
    const vehicles = await this.getAll();
    const index = vehicles.findIndex(v => v.id === id);
    
    if (index === -1) return null;
    
    vehicles[index] = { 
      ...vehicles[index], 
      ...updates
    };
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    return vehicles[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const vehicles = await this.getAll();
    const filtered = vehicles.filter(v => v.id !== id);
    
    if (filtered.length === vehicles.length) return false;
    
    localStorage.setItem('vehicles', JSON.stringify(filtered));
    return true;
  },

  async updateStatus(id: string, status: 'active' | 'maintenance' | 'inactive'): Promise<Vehicle | null> {
    return this.update(id, { status });
  },

  // REPORT İÇİN YENİ METODLAR
  async getUtilizationStats(): Promise<Array<{
    vehicle: Vehicle;
    totalRoutes: number;
    totalDistance: number;
    totalDuration: number;
    utilizationRate: number;
    avgDistancePerRoute: number;
  }>> {
    await delay(500);
    const vehicles = await this.getAll();
    const routes = await routeService.getAll();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return vehicles.map(vehicle => {
      const vehicleRoutes = routes.filter(r => r.vehicleId === vehicle.id);
      const recentRoutes = vehicleRoutes.filter(r => new Date(r.date) >= thirtyDaysAgo);
      
      const totalRoutes = vehicleRoutes.length;
      const totalDistance = vehicleRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      const totalDuration = vehicleRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0);
      const utilizationRate = Math.min(100, Math.round((recentRoutes.length / 30) * 100));
      const avgDistancePerRoute = totalRoutes > 0 ? totalDistance / totalRoutes : 0;
      
      return {
        vehicle,
        totalRoutes,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        utilizationRate,
        avgDistancePerRoute: Math.round(avgDistancePerRoute)
      };
    });
  }
};

// Depot Service
export const depotService = {
  async getAll(): Promise<Depot[]> {
    await delay(400);
    const saved = localStorage.getItem('depots');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('depots', JSON.stringify(mockDepots));
    return mockDepots;
  },

  async getById(id: string): Promise<Depot | null> {
    await delay(300);
    const depots = await this.getAll();
    return depots.find(d => d.id === id) || null;
  },

  async search(query: string): Promise<Depot[]> {
    await delay(300);
    const depots = await this.getAll();
    const lowQuery = query.toLowerCase();
    
    return depots.filter(d => 
      d.name.toLowerCase().includes(lowQuery) ||
      d.address.toLowerCase().includes(lowQuery)
    );
  },

  async create(depot: Partial<Depot>): Promise<Depot> {
    await delay(500);
    const depots = await this.getAll();
    
    // Eğer default olarak işaretlenmişse, diğerlerinin default'unu kaldır
    if (depot.isDefault) {
      depots.forEach(d => d.isDefault = false);
    }
    
    const newDepot: Depot = {
      id: Date.now().toString(),
      name: depot.name || '',
      address: depot.address || '',
      latitude: depot.latitude || 40.9869,
      longitude: depot.longitude || 29.0252,
      isDefault: depot.isDefault || false,
      workingHours: depot.workingHours || {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: { open: 'closed', close: 'closed' }
      },
      ...depot
    };
    
    depots.push(newDepot);
    localStorage.setItem('depots', JSON.stringify(depots));
    return newDepot;
  },

  async update(id: string, updates: Partial<Depot>): Promise<Depot | null> {
    await delay(400);
    const depots = await this.getAll();
    const index = depots.findIndex(d => d.id === id);
    
    if (index === -1) return null;
    
    // Eğer default olarak işaretlenmişse, diğerlerinin default'unu kaldır
    if (updates.isDefault) {
      depots.forEach(d => d.isDefault = false);
    }
    
    depots[index] = { 
      ...depots[index], 
      ...updates
    };
    localStorage.setItem('depots', JSON.stringify(depots));
    return depots[index];
  },

  async delete(id: string): Promise<boolean> {
    await delay(300);
    const depots = await this.getAll();
    const depotToDelete = depots.find(d => d.id === id);
    
    // Ana depo silinemez
    if (depotToDelete?.isDefault) {
      throw new Error('Ana depo silinemez. Önce başka bir depoyu ana depo olarak belirleyin.');
    }
    
    const filtered = depots.filter(d => d.id !== id);
    
    if (filtered.length === depots.length) return false;
    
    localStorage.setItem('depots', JSON.stringify(filtered));
    return true;
  },

  async setDefault(id: string): Promise<Depot | null> {
    await delay(400);
    const depots = await this.getAll();
    
    // Tüm depoların default'unu kaldır
    depots.forEach(d => d.isDefault = false);
    
    // Seçilen depoyu default yap
    const depot = depots.find(d => d.id === id);
    if (depot) {
      depot.isDefault = true;
      localStorage.setItem('depots', JSON.stringify(depots));
      return depot;
    }
    
    return null;
  },

  async getDefault(): Promise<Depot | null> {
    await delay(200);
    const depots = await this.getAll();
    return depots.find(d => d.isDefault) || null;
  }
};

// Mock Journeys - BOŞ ARRAY İLE BAŞLA
export const mockJourneys: Journey[] = [];

// Journey Service - GÜNCELLENMİŞ startFromRoute() metodu
export const journeyService = {
  async getAll(): Promise<Journey[]> {
    await delay(400);
    const saved = localStorage.getItem('journeys');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('journeys', JSON.stringify(mockJourneys));
    return mockJourneys;
  },

  async getById(id: string): Promise<Journey | null> {
    await delay(300);
    const journeys = await this.getAll();
    return journeys.find(j => j.id === id) || null;
  },

  async getActive(): Promise<Journey[]> {
    await delay(300);
    const journeys = await this.getAll();
    // preparing, started ve in_progress durumlarındaki journey'leri döndür
    return journeys.filter(j => 
      j.status === 'started' || 
      j.status === 'in_progress' || 
      j.status === 'preparing'
    );
  },

  async getByRouteId(routeId: string): Promise<Journey | null> {
    await delay(300);
    const journeys = await this.getAll();
    return journeys.find(j => j.routeId === routeId && j.status !== 'completed') || null;
  },

  async startFromRoute(routeId: string): Promise<Journey> {
    await delay(500);
    
    // Rotayı al
    const route = await routeService.getById(routeId);
    if (!route) {
      throw new Error('Rota bulunamadı');
    }

    // Sürücü ve araç kontrolü
    if (!route.driverId || !route.vehicleId) {
      throw new Error('Rotaya sürücü ve araç ataması yapılmamış');
    }

    // Durak kontrolü
    if (!route.stops || route.stops.length === 0) {
      throw new Error('Rotada durak bulunmuyor');
    }

    // Bu rota için aktif bir journey var mı kontrol et
    const existingJourney = await this.getByRouteId(routeId);
    if (existingJourney) {
      throw new Error('Bu rota için zaten aktif bir sefer var');
    }

    // Sürücü ve araç bilgilerini al
    const driver = await driverService.getById(route.driverId);
    const vehicle = await vehicleService.getById(route.vehicleId);

    // Rotayı in_progress durumuna güncelle
    const updatedRoute = await routeService.update(routeId, { 
      status: 'in_progress',
      startedAt: new Date(),
      driver: driver || undefined,  // Driver bilgisini ekle
      vehicle: vehicle || undefined  // Vehicle bilgisini ekle
    });

    // Yeni journey oluştur - GÜNCELLENMİŞ ROUTE'U KULLAN
    const journeys = await this.getAll();
    const newJourney: Journey = {
      id: Date.now().toString(),
      routeId,
      route: updatedRoute || route,  // Güncellenmiş route'u kullan
      status: 'in_progress',  // Direkt 'in_progress' olarak başlat
      currentStopIndex: 0,
      startedAt: new Date(),
      totalDistance: 0,
      totalDuration: 0,
      liveLocation: {
        latitude: route.stops[0]?.customer?.latitude || 40.9869,
        longitude: route.stops[0]?.customer?.longitude || 29.0252,
        speed: Math.random() * 30 + 20,  // 20-50 km/h arası başlangıç hızı
        heading: 0,
        timestamp: new Date()
      }
    };

    journeys.push(newJourney);
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return newJourney;
  },

  async updateStatus(id: string, status: Journey['status']): Promise<Journey | null> {
    await delay(400);
    const journeys = await this.getAll();
    const index = journeys.findIndex(j => j.id === id);
    
    if (index === -1) return null;
    
    const updates: Partial<Journey> = { status };
    
    if (status === 'completed') {
      updates.completedAt = new Date();
      
      // Rotayı da tamamlandı olarak güncelle
      await routeService.update(journeys[index].routeId, {
        status: 'completed',
        completedAt: new Date(),
        completedDeliveries: journeys[index].route.totalDeliveries
      });
    } else if (status === 'cancelled') {
      // Rotayı iptal edildi olarak güncelle
      await routeService.update(journeys[index].routeId, {
        status: 'cancelled'
      });
    }
    
    journeys[index] = { ...journeys[index], ...updates };
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return journeys[index];
  },

  async checkInStop(journeyId: string, stopId: string): Promise<Journey | null> {
    await delay(500);
    const journeys = await this.getAll();
    const journey = journeys.find(j => j.id === journeyId);
    
    if (!journey) return null;
    
    // Stop'u güncelle
    const stopIndex = journey.route.stops.findIndex(s => s.id === stopId);
    if (stopIndex !== -1) {
      journey.route.stops[stopIndex].status = 'arrived';
      journey.route.stops[stopIndex].actualArrival = new Date();
      journey.currentStopIndex = stopIndex;
      journey.status = 'in_progress';
      
      // Mesafe ve süre güncelle
      journey.totalDistance += journey.route.stops[stopIndex].distance || 0;
      journey.totalDuration += journey.route.stops[stopIndex].duration || 0;
    }
    
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return journey;
  },

  async completeStop(
    journeyId: string, 
    stopId: string, 
    proof?: { signature?: string; photo?: string; notes?: string }
  ): Promise<Journey | null> {
    await delay(500);
    const journeys = await this.getAll();
    const journey = journeys.find(j => j.id === journeyId);
    
    if (!journey) return null;
    
    // Stop'u tamamla
    const stopIndex = journey.route.stops.findIndex(s => s.id === stopId);
    if (stopIndex !== -1) {
      journey.route.stops[stopIndex].status = 'completed';
      journey.route.stops[stopIndex].completedAt = new Date();
      if (proof) {
        journey.route.stops[stopIndex].deliveryProof = proof;
      }
      
      // Tamamlanan teslimat sayısını güncelle
      journey.route.completedDeliveries++;
      
      // Eğer son duraksa, journey'i tamamla
      const remainingStops = journey.route.stops.filter(s => s.status === 'pending' || s.status === 'arrived');
      if (remainingStops.length === 0) {
        journey.status = 'completed';
        journey.completedAt = new Date();
        
        // Rotayı da tamamla
        await routeService.update(journey.routeId, {
          status: 'completed',
          completedAt: new Date(),
          completedDeliveries: journey.route.totalDeliveries
        });
      }
    }
    
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return journey;
  },

  async failStop(journeyId: string, stopId: string, reason: string): Promise<Journey | null> {
    await delay(500);
    const journeys = await this.getAll();
    const journey = journeys.find(j => j.id === journeyId);
    
    if (!journey) return null;
    
    // Stop'u başarısız olarak işaretle
    const stopIndex = journey.route.stops.findIndex(s => s.id === stopId);
    if (stopIndex !== -1) {
      journey.route.stops[stopIndex].status = 'failed';
      journey.route.stops[stopIndex].failureReason = reason;
      
      // Bir sonraki durağa geç
      journey.currentStopIndex = stopIndex + 1;
    }
    
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return journey;
  },

  async updateLocation(journeyId: string, location: Journey['liveLocation']): Promise<Journey | null> {
    await delay(200);
    const journeys = await this.getAll();
    const journey = journeys.find(j => j.id === journeyId);
    
    if (!journey) return null;
    
    journey.liveLocation = location;
    localStorage.setItem('journeys', JSON.stringify(journeys));
    return journey;
  },

  async simulateMovement(journeyId: string): Promise<void> {
    const journey = await this.getById(journeyId);
    if (!journey || !journey.liveLocation) return;
    
    // Mevcut durak
    const currentStop = journey.route.stops[journey.currentStopIndex];
    if (!currentStop || !currentStop.customer) return;
    
    // Hedef koordinatlar
    const targetLat = currentStop.customer.latitude;
    const targetLng = currentStop.customer.longitude;
    
    // Mevcut koordinatlar
    let currentLat = journey.liveLocation.latitude;
    let currentLng = journey.liveLocation.longitude;
    
    // Hareket simülasyonu (hedefin %10'u kadar yaklaş)
    const latDiff = (targetLat - currentLat) * 0.1;
    const lngDiff = (targetLng - currentLng) * 0.1;
    
    await this.updateLocation(journeyId, {
      latitude: currentLat + latDiff,
      longitude: currentLng + lngDiff,
      speed: Math.random() * 30 + 20, // 20-50 km/h arası
      heading: Math.atan2(lngDiff, latDiff) * 180 / Math.PI,
      timestamp: new Date()
    });
  },

  // REPORT İÇİN YENİ METODLAR
  async getByDateRange(startDate: Date, endDate: Date): Promise<Journey[]> {
    await delay(300);
    const journeys = await this.getAll();
    return journeys.filter(j => {
      const journeyDate = j.startedAt ? new Date(j.startedAt) : new Date();
      return journeyDate >= startDate && journeyDate <= endDate;
    });
  },

  async getStats(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    cancelled: number;
    avgDuration: number;
    avgDistance: number;
  }> {
    await delay(400);
    const journeys = await this.getAll();
    
    const total = journeys.length;
    const completed = journeys.filter(j => j.status === 'completed').length;
    const inProgress = journeys.filter(j => 
      j.status === 'in_progress' || j.status === 'started' || j.status === 'preparing'
    ).length;
    const cancelled = journeys.filter(j => j.status === 'cancelled').length;
    
    const completedJourneys = journeys.filter(j => j.status === 'completed');
    const totalDuration = completedJourneys.reduce((acc, j) => acc + j.totalDuration, 0);
    const totalDistance = completedJourneys.reduce((acc, j) => acc + j.totalDistance, 0);
    
    const avgDuration = completedJourneys.length > 0 
      ? Math.round(totalDuration / completedJourneys.length)
      : 0;
    const avgDistance = completedJourneys.length > 0
      ? Math.round(totalDistance / completedJourneys.length)
      : 0;
    
    return {
      total,
      completed,
      inProgress,
      cancelled,
      avgDuration,
      avgDistance
    };
  }
};

// REPORT SERVICE - YENİ
export const reportService = {
  async getDeliveryTrends(days: number = 7): Promise<Array<{
    date: string;
    completed: number;
    failed: number;
    total: number;
  }>> {
    await delay(500);
    const routes = await routeService.getAll();
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRoutes = routes.filter(r => {
        const routeDate = new Date(r.date).toISOString().split('T')[0];
        return routeDate === dateStr;
      });
      
      const completed = dayRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
      const total = dayRoutes.reduce((acc, r) => acc + r.totalDeliveries, 0);
      const failed = total - completed;
      
      trends.push({
        date: dateStr,
        completed,
        failed,
        total
      });
    }
    
    return trends;
  },

  async getDriverPerformance(): Promise<Array<{
    driverId: string;
    driverName: string;
    totalDeliveries: number;
    completedDeliveries: number;
    avgDeliveryTime: number;
    totalDistance: number;
    rating: number;
  }>> {
    await delay(500);
    const drivers = await driverService.getAll();
    const routes = await routeService.getAll();
    
    return drivers.map(driver => {
      const driverRoutes = routes.filter(r => r.driverId === driver.id);
      const completedRoutes = driverRoutes.filter(r => r.status === 'completed');
      
      const totalDeliveries = driverRoutes.reduce((acc, r) => acc + r.totalDeliveries, 0);
      const completedDeliveries = driverRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
      const totalDistance = driverRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      const totalDuration = completedRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0);
      const avgDeliveryTime = completedRoutes.length > 0 
        ? totalDuration / completedRoutes.length
        : 0;
      
      return {
        driverId: driver.id,
        driverName: driver.name,
        totalDeliveries,
        completedDeliveries,
        avgDeliveryTime: Math.round(avgDeliveryTime),
        totalDistance: Math.round(totalDistance),
        rating: driver.rating || 0
      };
    });
  },

  async getVehicleUtilization(): Promise<Array<{
    vehicleId: string;
    plateNumber: string;
    totalRoutes: number;
    totalDistance: number;
    utilizationRate: number;
  }>> {
    await delay(500);
    const vehicles = await vehicleService.getAll();
    const routes = await routeService.getAll();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return vehicles.map(vehicle => {
      const vehicleRoutes = routes.filter(r => r.vehicleId === vehicle.id);
      const recentRoutes = vehicleRoutes.filter(r => new Date(r.date) >= thirtyDaysAgo);
      const totalDistance = vehicleRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      const utilizationRate = Math.min(100, Math.round((recentRoutes.length / 30) * 100));
      
      return {
        vehicleId: vehicle.id,
        plateNumber: vehicle.plateNumber,
        totalRoutes: vehicleRoutes.length,
        totalDistance: Math.round(totalDistance),
        utilizationRate
      };
    });
  },

  async getSummaryStats(): Promise<{
    totalDeliveries: number;
    successRate: number;
    avgDeliveryTime: number;
    totalDistance: number;
    activeDrivers: number;
    activeVehicles: number;
    totalCustomers: number;
  }> {
    await delay(500);
    const [routeStats, drivers, vehicles, customers] = await Promise.all([
      routeService.getStats(),
      driverService.getAll(),
      vehicleService.getAll(),
      customerService.getAll()
    ]);
    
    const activeDrivers = drivers.filter(d => 
      d.status === 'available' || d.status === 'busy'
    ).length;
    
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    
    return {
      totalDeliveries: routeStats.completed,
      successRate: routeStats.successRate,
      avgDeliveryTime: routeStats.avgDeliveryTime,
      totalDistance: routeStats.totalDistance,
      activeDrivers,
      activeVehicles,
      totalCustomers: customers.length
    };
  }
};