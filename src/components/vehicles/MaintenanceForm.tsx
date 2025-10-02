import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Wrench, FileText, Bell } from 'lucide-react';
import { Vehicle, VehicleMaintenance, CreateMaintenanceDto } from '@/types';
import { maintenanceService } from '@/services/maintenance.service';

interface MaintenanceFormProps {
  vehicle: Vehicle;
  maintenance?: VehicleMaintenance | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  vehicle,
  maintenance,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMaintenanceDto>({
    vehicleId: vehicle.id,
    type: 'routine',
    title: '',
    description: '',
    cost: 0,
    performedAt: new Date(),
    nextMaintenanceDate: undefined,
    nextMaintenanceKm: undefined,
    currentKm: undefined,
    workshop: '',
    parts: '',
    notes: '',
    reminderDays: 7,
    reminderKm: undefined
  });

  useEffect(() => {
    if (maintenance) {
      setFormData({
        vehicleId: vehicle.id,
        type: maintenance.type,
        title: maintenance.title,
        description: maintenance.description || '',
        cost: maintenance.cost,
        performedAt: new Date(maintenance.performedAt),
        nextMaintenanceDate: maintenance.nextMaintenanceDate ? new Date(maintenance.nextMaintenanceDate) : undefined,
        nextMaintenanceKm: maintenance.nextMaintenanceKm,
        currentKm: maintenance.currentKm,
        workshop: maintenance.workshop || '',
        parts: maintenance.parts || '',
        notes: maintenance.notes || '',
        reminderDays: 7,
        reminderKm: undefined
      });
    }
  }, [maintenance, vehicle.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (maintenance) {
        await maintenanceService.update(maintenance.id, formData);
      } else {
        await maintenanceService.create(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Bakım kaydı kaydedilirken hata:', error);
      alert('Bakım kaydı kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) :
              type === 'date' ? (value ? new Date(value) : undefined) :
              value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-blue-600" />
            {maintenance ? 'Bakım Kaydını Düzenle' : 'Yeni Bakım Kaydı'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Araç Bilgisi */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Araç</p>
            <p className="font-semibold text-gray-900">
              {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
            </p>
          </div>

          {/* Bakım Türü ve Başlık */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bakım Türü *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="routine">Rutin Bakım</option>
                <option value="repair">Tamir</option>
                <option value="inspection">Muayene</option>
                <option value="tire_change">Lastik Değişimi</option>
                <option value="oil_change">Yağ Değişimi</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlık *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Örn: Motor yağı değişimi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Bakım detayları..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tarih ve Maliyet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Bakım Tarihi *
              </label>
              <input
                type="date"
                name="performedAt"
                value={formData.performedAt instanceof Date ? formData.performedAt.toISOString().split('T')[0] : ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Maliyet (₺) *
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost || ''}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Kilometre Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mevcut Kilometre
              </label>
              <input
                type="number"
                name="currentKm"
                value={formData.currentKm || ''}
                onChange={handleChange}
                min="0"
                placeholder="Örn: 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sonraki Bakım Kilometresi
              </label>
              <input
                type="number"
                name="nextMaintenanceKm"
                value={formData.nextMaintenanceKm || ''}
                onChange={handleChange}
                min="0"
                placeholder="Örn: 60000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sonraki Bakım Tarihi ve Hatırlatma */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Bell className="w-4 h-4 mr-2 text-blue-600" />
              Sonraki Bakım ve Hatırlatma
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sonraki Bakım Tarihi
                </label>
                <input
                  type="date"
                  name="nextMaintenanceDate"
                  value={formData.nextMaintenanceDate instanceof Date ? formData.nextMaintenanceDate.toISOString().split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kaç Gün Önceden Hatırlatma (Tarih Bazlı)
                </label>
                <select
                  name="reminderDays"
                  value={formData.reminderDays || 7}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Hatırlatma yok</option>
                  <option value={3}>3 gün önce</option>
                  <option value={7}>7 gün önce</option>
                  <option value={14}>14 gün önce</option>
                  <option value={30}>30 gün önce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kaç KM Önceden Hatırlatma (KM Bazlı)
                </label>
                <select
                  name="reminderKm"
                  value={formData.reminderKm || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Hatırlatma yok</option>
                  <option value={1000}>1.000 km önce</option>
                  <option value={3000}>3.000 km önce</option>
                  <option value={5000}>5.000 km önce</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-blue-700 bg-blue-100 rounded p-3">
              <p className="font-medium mb-1">Hatırlatma Sistemi:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Tarih veya KM bazlı hatırlatma seçebilirsiniz (veya her ikisi)</li>
                <li>Hangisi önce gerçekleşirse hatırlatma o zaman gönderilir</li>
                <li>Mail alacaklar: Workspace Admin, Dispatcher, Araca atanmış sürücü</li>
              </ul>
            </div>
          </div>

          {/* Atölye ve Parçalar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atölye/Servis
              </label>
              <input
                type="text"
                name="workshop"
                value={formData.workshop}
                onChange={handleChange}
                placeholder="Örn: ABC Oto Servis"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Değiştirilen Parçalar
              </label>
              <input
                type="text"
                name="parts"
                value={formData.parts}
                onChange={handleChange}
                placeholder="Örn: Motor yağı, yağ filtresi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Ek notlar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {maintenance ? 'Güncelle' : 'Kaydet'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
