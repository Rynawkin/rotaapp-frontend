import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit2, 
  Trash2, 
  Eye,
  Star,
  Clock,
  Navigation,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Depot } from '@/types';
import { depotService } from '@/services/depot.service';

const Depots: React.FC = () => {
  const navigate = useNavigate();
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDepots, setFilteredDepots] = useState<Depot[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; depot: Depot | null }>({
    show: false,
    depot: null
  });

  useEffect(() => {
    loadDepots();
  }, []);

  useEffect(() => {
    filterDepots();
  }, [searchTerm, depots]);

  const loadDepots = async () => {
    try {
      setLoading(true);
      const data = await depotService.getAll();
      setDepots(data);
      setFilteredDepots(data);
    } catch (error) {
      console.error('Depolar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDepots = () => {
    if (!searchTerm) {
      setFilteredDepots(depots);
      return;
    }

    const filtered = depots.filter(depot =>
      depot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depot.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepots(filtered);
  };

  const handleDelete = async () => {
    if (!deleteModal.depot) return;

    try {
      await depotService.delete(deleteModal.depot.id);
      await loadDepots();
      setDeleteModal({ show: false, depot: null });
    } catch (error: any) {
      alert(error.message || 'Depo silinirken bir hata oluştu');
    }
  };

  const handleSetDefault = async (depot: Depot) => {
    try {
      await depotService.setDefault(depot.id);
      await loadDepots();
    } catch (error) {
      console.error('Ana depo ayarlanırken hata:', error);
      alert('Ana depo ayarlanırken bir hata oluştu');
    }
  };

  const formatWorkingHours = (depot: Depot) => {
    if (!depot.workingHours) return 'Belirtilmemiş';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = days[new Date().getDay()];
    const hours = depot.workingHours[todayKey];
    
    if (!hours || hours.open === 'closed') {
      return <span className="text-red-600">Bugün Kapalı</span>;
    }
    
    return (
      <span className="text-green-600">
        Bugün: {hours.open} - {hours.close}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-7 h-7 mr-2 text-blue-600" />
              Depolar
            </h1>
            <p className="text-gray-600 mt-1">
              Toplam {depots.length} depo bulunuyor
            </p>
          </div>
          <Link
            to="/depots/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Depo Ekle
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Depo adı veya adres ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Depo</p>
              <p className="text-2xl font-bold text-gray-900">{depots.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ana Depo</p>
              <p className="text-lg font-semibold text-gray-900">
                {depots.find(d => d.isDefault)?.name || 'Belirtilmemiş'}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Açık Depolar</p>
              <p className="text-2xl font-bold text-green-600">
                {depots.filter(d => {
                  if (!d.workingHours) return false;
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const todayKey = days[new Date().getDay()];
                  const hours = d.workingHours[todayKey];
                  return hours && hours.open !== 'closed';
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Rotalar</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <Navigation className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Depots List */}
      {filteredDepots.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Depo Bulunamadı' : 'Henüz Depo Eklenmemiş'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Arama kriterlerinize uygun depo bulunamadı.' 
              : 'İlk deponuzu ekleyerek başlayın.'}
          </p>
          {!searchTerm && (
            <Link
              to="/depots/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Depo Ekle
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDepots.map((depot) => (
            <div
              key={depot.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {depot.name}
                      </h3>
                      {depot.isDefault && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-yellow-700" />
                          Ana Depo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center mt-2">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {depot.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Çalışma Saatleri:</span>
                    <p className="font-medium mt-1">
                      {formatWorkingHours(depot)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Koordinatlar:</span>
                    <p className="font-medium text-gray-700 mt-1">
                      {depot.latitude.toFixed(6)}, {depot.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {!depot.isDefault && (
                      <button
                        onClick={() => handleSetDefault(depot)}
                        className="px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center"
                        title="Ana depo yap"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={`https://www.google.com/maps?q=${depot.latitude},${depot.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                      title="Google Maps'te göster"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/depots/${depot.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Detaylar"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/depots/${depot.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ show: true, depot })}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                      disabled={depot.isDefault}
                    >
                      <Trash2 className={`w-4 h-4 ${depot.isDefault ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.show && deleteModal.depot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Depoyu Sil</h3>
            </div>
            <p className="text-gray-600 mb-6">
              <strong>{deleteModal.depot.name}</strong> deposunu silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, depot: null })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depots;