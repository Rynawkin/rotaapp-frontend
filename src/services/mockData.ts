import { Route, Customer, Driver, Vehicle, Depot } from '@/types';

// Mock Customers
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

// Mock Routes
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
    status: 'in_progress',
    stops: [
      {
        id: '1-1',
        routeId: '1',
        customerId: '1',
        customer: mockCustomers[0],
        order: 1,
        status: 'completed',
        estimatedArrival: new Date(),
        actualArrival: new Date(),
        duration: 15,
        distance: 5.2
      },
      {
        id: '1-2',
        routeId: '1',
        customerId: '2',
        customer: mockCustomers[1],
        order: 2,
        status: 'arrived',
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
    completedDeliveries: 1,
    optimized: true,
    createdAt: new Date(),
    startedAt: new Date()
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
    date: new Date(Date.now() - 86400000), // Yesterday
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

// Route Service
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
    const newRoute: Route = {
      id: Date.now().toString(),
      name: route.name || 'Yeni Rota',
      date: route.date || new Date(),
      depotId: route.depotId || '1',
      status: 'draft',
      stops: route.stops || [],
      totalDistance: 0,
      totalDuration: 0,
      totalDeliveries: route.stops?.length || 0,
      completedDeliveries: 0,
      optimized: false,
      createdAt: new Date(),
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
    
    routes[index] = { ...routes[index], ...updates };
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
    await delay(1500); // Optimization takes time
    const route = await this.getById(id);
    
    if (!route) return null;
    
    // Fake optimization - just shuffle stops and mark as optimized
    const optimizedStops = [...route.stops].sort(() => Math.random() - 0.5);
    const optimizedRoute = {
      ...route,
      stops: optimizedStops.map((stop, index) => ({
        ...stop,
        order: index + 1
      })),
      optimized: true,
      totalDistance: Math.round(route.totalDistance * 0.85 * 10) / 10 // 15% improvement
    };
    
    return this.update(id, optimizedRoute);
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

  async search(query: string): Promise<Customer[]> {
    await delay(300);
    const customers = await this.getAll();
    const lowQuery = query.toLowerCase();
    
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowQuery) ||
      c.code.toLowerCase().includes(lowQuery) ||
      c.address.toLowerCase().includes(lowQuery)
    );
  },

  async create(customer: Partial<Customer>): Promise<Customer> {
    await delay(500);
    const customers = await this.getAll();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      code: `MUS${String(customers.length + 1).padStart(3, '0')}`,
      name: customer.name || '',
      address: customer.address || '',
      phone: customer.phone || '',
      latitude: customer.latitude || 0,
      longitude: customer.longitude || 0,
      priority: customer.priority || 'normal',
      tags: customer.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...customer
    };
    
    customers.push(newCustomer);
    localStorage.setItem('customers', JSON.stringify(customers));
    return newCustomer;
  }
};

// Driver Service
export const driverService = {
  async getAll(): Promise<Driver[]> {
    await delay(300);
    const saved = localStorage.getItem('drivers');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('drivers', JSON.stringify(mockDrivers));
    return mockDrivers;
  },

  async getAvailable(): Promise<Driver[]> {
    const drivers = await this.getAll();
    return drivers.filter(d => d.status === 'available');
  }
};

// Vehicle Service
export const vehicleService = {
  async getAll(): Promise<Vehicle[]> {
    await delay(300);
    const saved = localStorage.getItem('vehicles');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('vehicles', JSON.stringify(mockVehicles));
    return mockVehicles;
  },

  async getAvailable(): Promise<Vehicle[]> {
    const vehicles = await this.getAll();
    return vehicles.filter(v => v.status === 'active');
  }
};

// Depot Service
export const depotService = {
  async getAll(): Promise<Depot[]> {
    await delay(200);
    const saved = localStorage.getItem('depots');
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem('depots', JSON.stringify(mockDepots));
    return mockDepots;
  }
};