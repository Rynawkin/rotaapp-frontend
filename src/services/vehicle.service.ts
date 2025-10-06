import { api } from './api';
import { Vehicle } from '@/types';

export interface CreateVehicleDto {
  plateNumber: string;
  type: 'car' | 'van' | 'truck' | 'motorcycle';
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status?: 'active' | 'maintenance' | 'inactive';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  currentKm?: number; // ✅ Başlangıç kilometresi (opsiyonel)
}

export interface UpdateVehicleDto {
  plateNumber?: string;
  type?: 'car' | 'van' | 'truck' | 'motorcycle';
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status?: 'active' | 'maintenance' | 'inactive';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  currentKm?: number; // ✅ Kilometre bilgisi
}

export interface UpdateVehicleStatusDto {
  status: 'active' | 'maintenance' | 'inactive';
}

export interface BulkImportVehiclesDto {
  vehicles: CreateVehicleDto[];
}

class VehicleService {
  private readonly basePath = '/workspace/vehicles'; // Backend ile uyumlu path

  // Get all vehicles
  async getAll(): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>(this.basePath);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  // Get vehicle by ID
  async getById(id: number): Promise<Vehicle | null> {
    try {
      const response = await api.get<Vehicle>(`${this.basePath}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      return null;
    }
  }

  // Create new vehicle
  async create(data: CreateVehicleDto): Promise<Vehicle> {
    try {
      const response = await api.post<Vehicle>(this.basePath, data);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  // Update vehicle
  async update(id: number, data: UpdateVehicleDto): Promise<Vehicle> {
    try {
      const response = await api.put<Vehicle>(`${this.basePath}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  }

  // Delete vehicle
  async delete(id: number): Promise<void> {
    try {
      await api.delete(`${this.basePath}/${id}`);
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  }

  // Update vehicle status
  async updateStatus(id: number, status: 'active' | 'maintenance' | 'inactive'): Promise<Vehicle> {
    try {
      const response = await api.put<Vehicle>(`${this.basePath}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id} status:`, error);
      throw error;
    }
  }

  // Bulk import vehicles (Backend'e eklenecek)
  async bulkImport(vehicles: CreateVehicleDto[]): Promise<Vehicle[]> {
    try {
      const response = await api.post<Vehicle[]>(`${this.basePath}/bulk-import`, { vehicles });
      return response.data;
    } catch (error) {
      console.error('Error bulk importing vehicles:', error);
      // Fallback: Create vehicles one by one
      const results: Vehicle[] = [];
      for (const vehicle of vehicles) {
        try {
          const created = await this.create(vehicle);
          results.push(created);
        } catch (err) {
          console.error('Error creating vehicle in bulk import:', err);
        }
      }
      return results;
    }
  }

  // Search vehicles (İleride backend'e eklenebilir)
  async search(query: string): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>(`${this.basePath}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      // Fallback: Client-side filtering
      const vehicles = await this.getAll();
      const lowerQuery = query.toLowerCase();
      return vehicles.filter(v => 
        v.plateNumber.toLowerCase().includes(lowerQuery) ||
        v.brand.toLowerCase().includes(lowerQuery) ||
        v.model.toLowerCase().includes(lowerQuery)
      );
    }
  }

  // Get available vehicles (status = active)
  async getAvailable(): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>(`${this.basePath}/available`);
      return response.data;
    } catch (error) {
      // Fallback: Client-side filtering
      const vehicles = await this.getAll();
      return vehicles.filter(v => v.status === 'active');
    }
  }

  // Get vehicles by type
  async getByType(type: 'car' | 'van' | 'truck' | 'motorcycle'): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>(`${this.basePath}/by-type/${type}`);
      return response.data;
    } catch (error) {
      // Fallback: Client-side filtering
      const vehicles = await this.getAll();
      return vehicles.filter(v => v.type === type);
    }
  }

  // Get vehicles in maintenance
  async getInMaintenance(): Promise<Vehicle[]> {
    try {
      const response = await api.get<Vehicle[]>(`${this.basePath}/maintenance`);
      return response.data;
    } catch (error) {
      // Fallback: Client-side filtering
      const vehicles = await this.getAll();
      return vehicles.filter(v => v.status === 'maintenance');
    }
  }

  // Export vehicles to CSV
  exportToCSV(vehicles: Vehicle[]): string {
    const headers = ['ID', 'Plaka', 'Tip', 'Marka', 'Model', 'Yıl', 'Kapasite (kg)', 'Durum', 'Yakıt Tipi'];
    const rows = vehicles.map(vehicle => [
      vehicle.id,
      vehicle.plateNumber,
      vehicle.type,
      vehicle.brand,
      vehicle.model,
      vehicle.year,
      vehicle.capacity,
      vehicle.status,
      vehicle.fuelType
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Parse CSV for import
  parseCSV(csvContent: string): CreateVehicleDto[] {
    const lines = csvContent.split('\n');
    const vehicles: CreateVehicleDto[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 8) {
        vehicles.push({
          plateNumber: values[1]?.trim(),
          type: (values[2]?.trim() as any) || 'car',
          brand: values[3]?.trim(),
          model: values[4]?.trim(),
          year: parseInt(values[5]) || new Date().getFullYear(),
          capacity: parseInt(values[6]) || 1000,
          status: (values[7]?.trim() as any) || 'active',
          fuelType: (values[8]?.trim() as any) || 'diesel'
        });
      }
    }
    
    return vehicles;
  }
}

export const vehicleService = new VehicleService();