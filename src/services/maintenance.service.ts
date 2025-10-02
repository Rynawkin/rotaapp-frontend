import { api } from './api';
import { VehicleMaintenance, CreateMaintenanceDto, UpdateMaintenanceDto, MaintenanceReminder } from '@/types';

class MaintenanceService {
  private readonly basePath = '/workspace/vehicles/maintenance';

  /**
   * Bir araç için tüm bakım kayıtlarını getir
   */
  async getByVehicle(vehicleId: number): Promise<VehicleMaintenance[]> {
    const response = await api.get<VehicleMaintenance[]>(`${this.basePath}/vehicle/${vehicleId}`);
    return response.data;
  }

  /**
   * Tüm bakım kayıtlarını getir (tüm araçlar için)
   */
  async getAll(): Promise<VehicleMaintenance[]> {
    const response = await api.get<VehicleMaintenance[]>(this.basePath);
    return response.data;
  }

  /**
   * Belirli bir bakım kaydını getir
   */
  async getById(id: number): Promise<VehicleMaintenance> {
    const response = await api.get<VehicleMaintenance>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Yeni bakım kaydı oluştur
   */
  async create(data: CreateMaintenanceDto): Promise<VehicleMaintenance> {
    const response = await api.post<VehicleMaintenance>(this.basePath, data);
    return response.data;
  }

  /**
   * Bakım kaydını güncelle
   */
  async update(id: number, data: UpdateMaintenanceDto): Promise<VehicleMaintenance> {
    const response = await api.put<VehicleMaintenance>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Bakım kaydını sil
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Yaklaşan bakımları getir (X gün içinde bakımı gelen araçlar)
   */
  async getUpcoming(days: number = 30): Promise<VehicleMaintenance[]> {
    const response = await api.get<VehicleMaintenance[]>(`${this.basePath}/upcoming`, {
      params: { days }
    });
    return response.data;
  }

  /**
   * Bir araç için aktif hatırlatıcıları getir
   */
  async getReminders(vehicleId: number): Promise<MaintenanceReminder[]> {
    const response = await api.get<MaintenanceReminder[]>(`${this.basePath}/reminders/vehicle/${vehicleId}`);
    return response.data;
  }

  /**
   * Hatırlatıcı oluştur veya güncelle
   */
  async setReminder(data: {
    vehicleId: number;
    maintenanceId?: number;
    reminderDays: number;
    nextMaintenanceDate: Date;
  }): Promise<MaintenanceReminder> {
    const response = await api.post<MaintenanceReminder>(`${this.basePath}/reminders`, data);
    return response.data;
  }

  /**
   * Hatırlatıcıyı deaktif et
   */
  async deactivateReminder(reminderId: number): Promise<void> {
    await api.patch(`${this.basePath}/reminders/${reminderId}/deactivate`);
  }

  /**
   * Bakım geçmişi istatistikleri
   */
  async getStats(vehicleId: number): Promise<{
    totalCost: number;
    totalMaintenance: number;
    lastMaintenance?: VehicleMaintenance;
    nextMaintenance?: VehicleMaintenance;
    avgCost: number;
  }> {
    const response = await api.get(`${this.basePath}/stats/${vehicleId}`);
    return response.data;
  }
}

export const maintenanceService = new MaintenanceService();
