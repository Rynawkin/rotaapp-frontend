// src/pages/superadmin/WorkspaceDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Users, Package, Car, MapPin, 
  TrendingUp, Calendar, Clock, Mail, Phone, Globe,
  Edit, Power, AlertCircle, CheckCircle
} from 'lucide-react';
import { Workspace } from '@/types';
import { workspaceService } from '@/services/workspace.service';
import { routeService } from '@/services/route.service';
import { driverService } from '@/services/driver.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalDrivers: 0,
    totalCustomers: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    activeRoutes: 0
  });

  useEffect(() => {
    loadWorkspaceData();
  }, [id]);

  const loadWorkspaceData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const workspaceData = await workspaceService.getById(id);
      setWorkspace(workspaceData);
      
      // İstatistikleri yükle (gerçekte workspace'e göre filtrelenecek)
      const [routes, drivers, customers, vehicles] = await Promise.all([
        routeService.getAll(),
        driverService.getAll(), 
        customerService.getAll(),
        vehicleService.getAll()
      ]);
      
      let monthlyRevenue = 0;
      if (workspaceData?.subscription?.plan === 'basic') monthlyRevenue = 999;
      if (workspaceData?.subscription?.plan === 'premium') monthlyRevenue = 2999;
      if (workspaceData?.subscription?.plan === 'enterprise') monthlyRevenue = 9999;
      
      setStats({
        totalRoutes: Math.floor(Math.random() * 100) + 20,
        totalDrivers: Math.floor(Math.random() * 15) + 3,
        totalCustomers: Math.floor(Math.random() * 200) + 50,
        totalVehicles: Math.floor(Math.random() * 20) + 5,
        monthlyRevenue,
        activeRoutes: Math.floor(Math.random() * 10) + 1
      });
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!workspace) return;
    
    const newStatus = !workspace.active;
    const message = newStatus 
      ? 'Bu firmayı aktif hale getirmek istediğinize emin misiniz?' 
      : 'Bu firmayı pasif hale getirmek istediğinize emin misiniz? Firma sisteme giriş yapamayacak.';
    
    if (window.confirm(message)) {
      await workspaceService.updateStatus(workspace.id, newStatus);
      await loadWorkspaceData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Firma bulunamadı!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/super-admin')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Super Admin Panel'e Dön
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  workspace.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {workspace.active ? 'Aktif' : 'Pasif'}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  workspace.subscription?.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                  workspace.subscription?.plan === 'basic' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {workspace.subscription?.plan?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(`/super-admin/workspace/${id}/edit`)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-lg flex items-center ${
                workspace.active 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Power className="w-4 h-4 mr-2" />
              {workspace.active ? 'Pasif Yap' : 'Aktif Yap'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">Sürücüler</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
          <p className="text-xs text-gray-600">/ {workspace.subscription?.maxDrivers || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Rotalar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRoutes}</p>
          <p className="text-xs text-gray-600">/ {workspace.subscription?.maxRoutes || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Müşteriler</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          <p className="text-xs text-gray-600">/ {workspace.subscription?.maxCustomers || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Car className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-gray-500">Araçlar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-gray-500">Aktif Rota</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeRoutes}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Aylık Gelir</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₺{stats.monthlyRevenue}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firma Bilgileri */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Firma Bilgileri</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">E-posta</p>
                <p className="text-sm text-gray-900">{workspace.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Telefon</p>
                <p className="text-sm text-gray-900">{workspace.phoneNumber || '-'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Zaman Dilimi</p>
                <p className="text-sm text-gray-900">{workspace.timeZone}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Kayıt Tarihi</p>
                <p className="text-sm text-gray-900">
                  {new Date(workspace.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Abonelik Bilgileri */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Abonelik Bilgileri</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Plan</span>
              <span className="text-sm text-gray-900">{workspace.subscription?.plan?.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Durum</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                workspace.subscription?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {workspace.subscription?.status === 'active' ? 'Aktif' : 'Süresi Dolmuş'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Başlangıç</span>
              <span className="text-sm text-gray-900">
                {workspace.subscription?.startDate 
                  ? new Date(workspace.subscription.startDate).toLocaleDateString('tr-TR')
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Bitiş</span>
              <span className="text-sm text-gray-900">
                {workspace.subscription?.endDate 
                  ? new Date(workspace.subscription.endDate).toLocaleDateString('tr-TR')
                  : '-'}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Max Sürücü</span>
                <span className="text-sm font-medium">{workspace.subscription?.maxDrivers || '∞'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Max Rota</span>
                <span className="text-sm font-medium">{workspace.subscription?.maxRoutes || '∞'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Müşteri</span>
                <span className="text-sm font-medium">{workspace.subscription?.maxCustomers || '∞'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Yeni rota oluşturuldu</p>
                <p className="text-xs text-gray-500">{i} saat önce</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetail;