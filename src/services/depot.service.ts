// frontend/src/services/depot.service.ts

import { api } from './api'; // Named import olarak düzeltildi
import { Depot } from '@/types';

const basePath = '/workspace/depots';

export const depotService = {
  // Tüm depoları getir
  async getAll(searchTerm?: string): Promise<Depot[]> {
    const params = searchTerm ? { searchTerm } : {};
    const response = await api.get(basePath, { params });
    return response.data;
  },

  // Belirli bir depoyu getir
  async getById(id: string | number): Promise<Depot> {
    const response = await api.get(`${basePath}/${id}`);
    return response.data;
  },

  // Yeni depo oluştur
  async create(data: Partial<Depot>): Promise<Depot> {
    const response = await api.post(basePath, {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault || false,
      workingHours: data.workingHours || getDefaultWorkingHours()
    });
    return response.data;
  },

  // Depoyu güncelle
  async update(id: string | number, data: Partial<Depot>): Promise<Depot> {
    const response = await api.put(`${basePath}/${id}`, {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.isDefault || false,
      workingHours: data.workingHours || getDefaultWorkingHours()
    });
    return response.data;
  },

  // Depoyu sil
  async delete(id: string | number): Promise<void> {
    await api.delete(`${basePath}/${id}`);
  },

  // Ana depo olarak ayarla
  async setDefault(id: string | number): Promise<Depot> {
    const response = await api.post(`${basePath}/${id}/set-default`);
    return response.data;
  }
};

// Varsayılan çalışma saatleri
function getDefaultWorkingHours() {
  return {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '09:00', close: '14:00' },
    sunday: { open: 'closed', close: 'closed' }
  };
}