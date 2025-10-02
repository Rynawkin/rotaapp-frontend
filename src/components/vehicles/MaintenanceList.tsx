import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { VehicleMaintenance, Vehicle } from '@/types';
import { maintenanceService } from '@/services/maintenance.service';
import MaintenanceForm from './MaintenanceForm';

interface MaintenanceListProps {
  vehicle: Vehicle;
  onUpdate?: () => void;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({ vehicle, onUpdate }) => {
  const [maintenances, setMaintenances] = useState<VehicleMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleMaintenance | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [vehicle.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [maintenanceData, statsData] = await Promise.all([
        maintenanceService.getByVehicle(vehicle.id),
        maintenanceService.getStats(vehicle.id)
      ]);
      setMaintenances(maintenanceData);
      setStats(statsData);
    } catch (error) {
      console.error('Bakım verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu bakım kaydını silmek istediğinize emin misiniz?')) return;

    try {
      await maintenanceService.delete(id);
      await loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Bakım kaydı silinirken hata:', error);
      alert('Bakım kaydı silinirken bir hata oluştu.');
    }
  };

  const handleEdit = (maintenance: VehicleMaintenance) => {
    setEditingMaintenance(maintenance);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMaintenance(null);
  };

  const handleFormSuccess = async () => {
    await loadData();
    onUpdate?.();
    handleFormClose();
  };

  const getMaintenanceTypeLabel = (type: VehicleMaintenance['type']) => {
    const labels = {
      routine: 'Rutin Bakım',
      repair: 'Tamir',
      inspection: 'Muayene',
      tire_change: 'Lastik Değişimi',
      oil_change: 'Yağ Değişimi',
      other: 'Diğer'
    };
    return labels[type] || type;
  };

  const getMaintenanceTypeColor = (type: VehicleMaintenance['type']) => {
    const colors = {
      routine: 'bg-blue-100 text-blue-700',
      repair: 'bg-red-100 text-red-700',
      inspection: 'bg-green-100 text-green-700',
      tire_change: 'bg-purple-100 text-purple-700',
      oil_change: 'bg-yellow-100 text-yellow-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || colors.other;
  };

  const isMaintenanceDue = (maintenance: VehicleMaintenance) => {
    if (!maintenance.nextMaintenanceDate) return false;
    const daysUntil = Math.floor((new Date(maintenance.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  };

  const isMaintenanceOverdue = (maintenance: VehicleMaintenance) => {
    if (!maintenance.nextMaintenanceDate) return false;
    return new Date(maintenance.nextMaintenanceDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Bakım</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMaintenance}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Maliyet</p>
                <p className="text-2xl font-bold text-gray-900">₺{stats.totalCost?.toLocaleString('tr-TR')}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Maliyet</p>
                <p className="text-2xl font-bold text-gray-900">₺{stats.avgCost?.toLocaleString('tr-TR')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Son Bakım</p>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lastMaintenance
                    ? new Date(stats.lastMaintenance.performedAt).toLocaleDateString('tr-TR')
                    : 'Yok'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Yaklaşan Bakım Uyarısı */}
      {stats?.nextMaintenance && isMaintenanceDue(stats.nextMaintenance) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-semibold text-yellow-900">Yaklaşan Bakım</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.nextMaintenance.title} - {' '}
                {new Date(stats.nextMaintenance.nextMaintenanceDate!).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gecikmiş Bakım Uyarısı */}
      {stats?.nextMaintenance && isMaintenanceOverdue(stats.nextMaintenance) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h4 className="font-semibold text-red-900">Gecikmiş Bakım!</h4>
              <p className="text-sm text-red-700 mt-1">
                {stats.nextMaintenance.title} - {' '}
                {new Date(stats.nextMaintenance.nextMaintenanceDate!).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Başlık ve Yeni Bakım Butonu */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Bakım Geçmişi</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Bakım Ekle
        </button>
      </div>

      {/* Bakım Listesi */}
      {maintenances.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Henüz bakım kaydı bulunmuyor.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            İlk bakım kaydını ekleyin
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Başlık
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maliyet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sonraki Bakım
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Atölye
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenances.map((maintenance) => (
                  <tr key={maintenance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(maintenance.performedAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMaintenanceTypeColor(maintenance.type)}`}>
                        {getMaintenanceTypeLabel(maintenance.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{maintenance.title}</div>
                        {maintenance.description && (
                          <div className="text-gray-500 text-xs mt-1">{maintenance.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₺{maintenance.cost.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {maintenance.nextMaintenanceDate ? (
                        <div className="flex items-center">
                          {isMaintenanceOverdue(maintenance) ? (
                            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                          ) : isMaintenanceDue(maintenance) ? (
                            <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          )}
                          <span className={
                            isMaintenanceOverdue(maintenance) ? 'text-red-600 font-medium' :
                            isMaintenanceDue(maintenance) ? 'text-yellow-600 font-medium' :
                            'text-gray-600'
                          }>
                            {new Date(maintenance.nextMaintenanceDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {maintenance.workshop || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(maintenance)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(maintenance.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bakım Formu Modal */}
      {showForm && (
        <MaintenanceForm
          vehicle={vehicle}
          maintenance={editingMaintenance}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default MaintenanceList;
