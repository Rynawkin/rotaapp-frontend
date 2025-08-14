// frontend/src/services/driver.service.ts

import { api } from './api';  // ✅ DÜZELTME: Default import yerine named import
import { Driver } from '@/types';

export interface CreateDriverDto {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  vehicleId?: string;
  status?: 'available' | 'busy' | 'offline';
  currentLatitude?: number;
  currentLongitude?: number;
  avatar?: string;
  rating?: number;
  totalDeliveries?: number;
}

export interface UpdateDriverDto extends CreateDriverDto {}

export interface UpdateDriverStatusDto {
  status: 'available' | 'busy' | 'offline';
}

export interface BulkImportDriverDto {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  status?: string;
  rating?: number;
  totalDeliveries?: number;
}

export interface BulkImportResult {
  successCount: number;
  failureCount: number;
  errors: string[];
  importedDrivers: Driver[];
}

class DriverService {
  private readonly basePath = '/workspace/drivers';

  /**
   * Get all drivers
   * @param status - Filter by status (available, busy, offline, all)
   * @param search - Search by name, phone, email or license number
   */
  async getAll(status?: string, search?: string): Promise<Driver[]> {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    if (search) {
      params.append('search', search);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    const response = await api.get<Driver[]>(url);
    return response.data;
  }

  /**
   * Get driver by ID
   */
  async getById(id: string): Promise<Driver> {
    const response = await api.get<Driver>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Get available drivers
   */
  async getAvailable(): Promise<Driver[]> {
    const response = await api.get<Driver[]>(`${this.basePath}/available`);
    return response.data;
  }

  /**
   * Search drivers
   */
  async search(query: string): Promise<Driver[]> {
    const response = await api.get<Driver[]>(`${this.basePath}/search`, {
      params: { query }
    });
    return response.data;
  }

  /**
   * Create a new driver
   */
  async create(data: CreateDriverDto): Promise<Driver> {
    const response = await api.post<Driver>(this.basePath, data);
    return response.data;
  }

  /**
   * Update driver
   */
  async update(id: string, data: UpdateDriverDto): Promise<Driver> {
    const response = await api.put<Driver>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Update driver status
   */
  async updateStatus(id: string, status: 'available' | 'busy' | 'offline'): Promise<Driver> {
    const response = await api.patch<Driver>(`${this.basePath}/${id}/status`, { status });
    return response.data;
  }

  /**
   * Delete driver
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Bulk import drivers
   */
  async bulkImport(drivers: BulkImportDriverDto[]): Promise<BulkImportResult> {
    const response = await api.post<BulkImportResult>(`${this.basePath}/bulk`, drivers);
    return response.data;
  }

  /**
   * Export drivers to CSV
   */
  exportToCsv(drivers: Driver[]): string {
    const headers = ['ID', 'Ad Soyad', 'Telefon', 'Email', 'Ehliyet No', 'Durum', 'Puan', 'Toplam Teslimat', 'Kayıt Tarihi'];
    const rows = drivers.map(driver => [
      driver.id,
      driver.name,
      driver.phone,
      driver.email || '',
      driver.licenseNumber,
      driver.status,
      driver.rating || 0,
      driver.totalDeliveries || 0,
      new Date(driver.createdAt).toLocaleDateString('tr-TR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Parse CSV for import
   */
  parseCsvForImport(csvContent: string): BulkImportDriverDto[] {
    const lines = csvContent.split('\n');
    const drivers: BulkImportDriverDto[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 5) {
        drivers.push({
          name: values[1]?.trim(),
          phone: values[2]?.trim(),
          email: values[3]?.trim() || undefined,
          licenseNumber: values[4]?.trim(),
          status: values[5]?.trim() || 'available',
          rating: parseFloat(values[6]) || undefined,
          totalDeliveries: parseInt(values[7]) || 0
        });
      }
    }

    return drivers;
  }
}

export const driverService = new DriverService();