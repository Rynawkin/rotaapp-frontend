import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit2,
  X
} from 'lucide-react';
import VehicleForm from '@/components/vehicles/VehicleForm';
import { vehicleService } from '@/services/mockData';
import { Vehicle } from '@/types';

// Bakım tipi
interface MaintenanceRecord {
  id: string;
  type: 'scheduled' | 'unscheduled' | 'oil_change' | 'tire_change' | 'inspection' | 'repair';
  date: Date;
  mileage: number;
  description: string;
  cost?: number;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: Date;
  status: 'completed' | 'pending' | 'scheduled';
  notes?: string;
}

const EditVehicle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { tab?: string } };
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'maintenance'>('general');
  
  // Bakım state'leri
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'scheduled' as MaintenanceRecord['type'],
    date: '',
    mileage: '',
    description: '',
    cost: '',
    nextMaintenanceKm: '',
    nextMaintenanceDate: '',
    status: 'scheduled' as MaintenanceRecord['status'],
    notes: ''
  });

  useEffect(() => {
    loadVehicle();
    // URL state'inden tab bilgisini kontrol et
    if (location.state?.tab === 'maintenance') {
      setActiveTab('maintenance');
    }
  }, [id, location.state]);

  const loadVehicle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await vehicleService.getById(id);
      if (data) {
        setVehicle(data);
        // Mock bakım kayıtları - normalde API'den gelecek
        setMaintenanceRecords([
          {
            id: '1',
            type: 'scheduled',
            date: new Date('2024-01-15'),
            mileage: 125000,
            description: 'Periyodik Bakım',
            cost: 2500,
            nextMaintenanceKm: 150000,
            nextMaintenanceDate: new Date('2024-04-15'),
            status: 'completed',
            notes: 'Yağ değişimi, filtre değişimi, genel kontrol yapıldı'
          },
          {
            id: '2',
            type: 'oil_change',
            date: new Date('2024-03-01'),
            mileage: 135000,
            description: 'Yağ Değişimi',
            cost: 800,
            status: 'completed'
          },
          {
            id: '3',
            type: 'scheduled',
            date: new Date('2024-04-15'),
            mileage: 150000,
            description: 'Planlı Periyodik Bakım',
            nextMaintenanceKm: 175000,
            nextMaintenanceDate: new Date('2024-07-15'),
            status: 'scheduled',
            notes: 'Yaklaşan bakım'
          }
        ]);
      } else {
        alert('Araç bulunamadı');
        navigate('/vehicles');
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Araç yüklenirken bir hata oluştu');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Vehicle>) => {
    if (!id) return;
    
    setSaving(true);
    try {
      await vehicleService.update(id, data);
      navigate('/vehicles');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Araç güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaintenance = () => {
    setEditingMaintenance(null);
    setMaintenanceForm({
      type: 'scheduled',
      date: '',
      mileage: '',
      description: '',
      cost: '',
      nextMaintenanceKm: '',
      nextMaintenanceDate: '',
      status: 'scheduled',
      notes: ''
    });
    setShowMaintenanceModal(true);
  };

  const handleEditMaintenance = (record: MaintenanceRecord) => {
    setEditingMaintenance(record);
    setMaintenanceForm({
      type: record.type,
      date: record.date.toISOString().split('T')[0],
      mileage: record.mileage.toString(),
      description: record.description,
      cost: record.cost?.toString() || '',
      nextMaintenanceKm: record.nextMaintenanceKm?.toString() || '',
      nextMaintenanceDate: record.nextMaintenanceDate?.toISOString().split('T')[0] || '',
      status: record.status,
      notes: record.notes || ''
    });
    setShowMaintenanceModal(true);
  };

  const handleSaveMaintenance = () => {
    const newRecord: MaintenanceRecord = {
      id: editingMaintenance?.id || Date.now().toString(),
      type: maintenanceForm.type,
      date: new Date(maintenanceForm.date),
      mileage: parseInt(maintenanceForm.mileage),
      description: maintenanceForm.description,
      cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
      nextMaintenanceKm: maintenanceForm.nextMaintenanceKm ? parseInt(maintenanceForm.nextMaintenanceKm) : undefined,
      nextMaintenanceDate: maintenanceForm.nextMaintenanceDate ? new Date(maintenanceForm.nextMaintenanceDate) : undefined,
      status: maintenanceForm.status,
      notes: maintenanceForm.notes
    };

    if (editingMaintenance) {
      setMaintenanceRecords(prev => prev.map(r => r.id === editingMaintenance.id ? newRecord : r));
    } else {
      setMaintenanceRecords(prev => [...prev, newRecord]);
    }

    setShowMaintenanceModal(false);
    alert('Bakım kaydı başarıyla kaydedildi!');
  };

  const handleDeleteMaintenance = (id: string) => {
    if (window.confirm('Bu bakım kaydını silmek istediğinizden emin misiniz?')) {
      setMaintenanceRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const getMaintenanceTypeLabel = (type: MaintenanceRecord['type']) => {
    const labels = {
      scheduled: 'Periyodik Bakım',
      unscheduled: 'Arıza Bakımı',
      oil_change: 'Yağ Değişimi',
      tire_change: 'Lastik Değişimi',
      inspection: 'Muayene',
      repair: 'Onarım'
    };
    return labels[type];
  };

  const getMaintenanceStatusColor = (status: MaintenanceRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMaintenanceStatusLabel = (status: MaintenanceRecord['status']) => {
    const labels = {
      completed: 'Tamamlandı',
      pending: 'Bekliyor',
      scheduled: 'Planlandı'
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/vehicles"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Araç Düzenle</h1>
            <p className="text-gray-600 mt-1">{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Genel Bilgiler
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bakım Yönetimi
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'general' ? (
        <VehicleForm
          initialData={vehicle}
          onSubmit={handleSubmit}
          loading={saving}
          isEdit={true}
        />
      ) : (
        <div className="space-y-6">
          {/* Bakım Özeti */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Son Bakım</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {maintenanceRecords.filter(r => r.status === 'completed').length > 0
                      ? new Date(Math.max(...maintenanceRecords
                          .filter(r => r.status === 'completed')
                          .map(r => r.date.getTime()))).toLocaleDateString('tr-TR')
                      : 'Kayıt yok'}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sonraki Bakım</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {maintenanceRecords.filter(r => r.status === 'scheduled').length > 0
                      ? new Date(Math.min(...maintenanceRecords
                          .filter(r => r.status === 'scheduled')
                          .map(r => r.date.getTime()))).toLocaleDateString('tr-TR')
                      : 'Planlanmamış'}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Bakım</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {maintenanceRecords.length} kayıt
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Bakım Listesi */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bakım Kayıtları</h2>
              <button
                onClick={handleAddMaintenance}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Bakım Ekle
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maliyet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maintenanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Wrench className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>Henüz bakım kaydı eklenmemiş</p>
                      </td>
                    </tr>
                  ) : (
                    maintenanceRecords
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {record.date.toLocaleDateString('tr-TR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {getMaintenanceTypeLabel(record.type)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {record.description}
                              {record.notes && (
                                <p className="text-xs text-gray-500 mt-1">{record.notes}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {record.mileage.toLocaleString('tr-TR')} km
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {record.cost ? `₺${record.cost.toLocaleString('tr-TR')}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMaintenanceStatusColor(record.status)}`}>
                              {getMaintenanceStatusLabel(record.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditMaintenance(record)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaintenance(record.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yaklaşan Bakımlar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yaklaşan Bakımlar</h3>
            <div className="space-y-3">
              {maintenanceRecords
                .filter(r => r.status === 'scheduled')
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 3)
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.description}</p>
                        <p className="text-xs text-gray-600">
                          {record.date.toLocaleDateString('tr-TR')} - {record.mileage.toLocaleString('tr-TR')} km
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditMaintenance(record)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Düzenle
                    </button>
                  </div>
                ))}
              
              {maintenanceRecords.filter(r => r.status === 'scheduled').length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Yaklaşan bakım bulunmuyor
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bakım Ekleme/Düzenleme Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMaintenance ? 'Bakım Düzenle' : 'Yeni Bakım Ekle'}
                </h3>
                <button
                  onClick={() => setShowMaintenanceModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bakım Tipi
                  </label>
                  <select
                    value={maintenanceForm.type}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, type: e.target.value as MaintenanceRecord['type']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Periyodik Bakım</option>
                    <option value="unscheduled">Arıza Bakımı</option>
                    <option value="oil_change">Yağ Değişimi</option>
                    <option value="tire_change">Lastik Değişimi</option>
                    <option value="inspection">Muayene</option>
                    <option value="repair">Onarım</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={maintenanceForm.status}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, status: e.target.value as MaintenanceRecord['status']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Planlandı</option>
                    <option value="pending">Bekliyor</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={maintenanceForm.date}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kilometre
                  </label>
                  <input
                    type="number"
                    value={maintenanceForm.mileage}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, mileage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150000"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bakım açıklaması"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maliyet (₺)
                  </label>
                  <input
                    type="number"
                    value={maintenanceForm.cost}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, cost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sonraki Bakım KM
                  </label>
                  <input
                    type="number"
                    value={maintenanceForm.nextMaintenanceKm}
                    onChange={(e) => setMaintenanceForm({...maintenanceForm, nextMaintenanceKm: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="175000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sonraki Bakım Tarihi
                </label>
                <input
                  type="date"
                  value={maintenanceForm.nextMaintenanceDate}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, nextMaintenanceDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={maintenanceForm.notes}
                  onChange={(e) => setMaintenanceForm({...maintenanceForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ek notlar..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSaveMaintenance}
                disabled={!maintenanceForm.date || !maintenanceForm.mileage || !maintenanceForm.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingMaintenance ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditVehicle;