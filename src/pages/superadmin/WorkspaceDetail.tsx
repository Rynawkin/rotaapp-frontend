// src/pages/superadmin/WorkspaceDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Users, Package, Car, MapPin, 
  TrendingUp, Calendar, Clock, Mail, Phone, Globe,
  Edit, Power, AlertCircle, CheckCircle, CreditCard,
  Package2, Users2, MessageSquare, RefreshCw
} from 'lucide-react';
import { Workspace } from '@/types';
import { workspaceService } from '@/services/workspace.service';
import { adminService } from '@/services/admin.service';
import { routeService } from '@/services/route.service';
import { driverService } from '@/services/driver.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlanChange, setLoadingPlanChange] = useState(false);
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
      
      // Subscription bilgilerini yükle
      const subscriptionData = await adminService.getWorkspaceSubscription(id);
      setSubscription(subscriptionData);

      const plans = await adminService.getAvailablePlans();
      setAvailablePlans(plans);
      setSelectedPlan(subscriptionData.currentPlan);
      
      // İstatistikleri yükle (Super admin olarak workspace-specific API'lere erişemiyoruz, mock data kullanıyoruz)
      let monthlyRevenue = 0;
      if (subscriptionData?.limits?.monthlyPrice) {
        monthlyRevenue = subscriptionData.limits.monthlyPrice;
      }

      // Gerçek istatistikler yerine subscription verilerini kullan
      setStats({
        totalRoutes: 0, // Backend'den gelmesi gerekiyor
        totalDrivers: subscriptionData?.currentUsage?.currentActiveDrivers || 0,
        totalCustomers: subscriptionData?.currentUsage?.currentActiveCustomers || 0,
        totalVehicles: subscriptionData?.currentUsage?.currentActiveVehicles || 0,
        monthlyRevenue,
        activeRoutes: 0 // Backend'den gelmesi gerekiyor
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

  const handlePlanChange = async () => {
    if (!workspace || !selectedPlan) return;
    
    setLoadingPlanChange(true);
    try {
      await adminService.updateWorkspacePlan(workspace.id, selectedPlan);
      await loadWorkspaceData();
      setShowPlanModal(false);
    } catch (error) {
      console.error('Plan değiştirme hatası:', error);
      alert('Plan değiştirilemedi!');
    } finally {
      setLoadingPlanChange(false);
    }
  };

  const handleResetUsage = async () => {
    if (!workspace) return;
    
    if (window.confirm('Aylık kullanımı sıfırlamak istediğinize emin misiniz?')) {
      try {
        await adminService.resetWorkspaceUsage(workspace.id);
        await loadWorkspaceData();
        alert('Kullanım başarıyla sıfırlandı!');
      } catch (error) {
        console.error('Kullanım sıfırlama hatası:', error);
      }
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
      {/* Plan Değiştirme Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Plan Değiştir</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlans.map((plan) => (
                <div
                  key={plan.planTypeValue}
                  className={`border rounded-lg p-4 cursor-pointer ${
                    selectedPlan == plan.planTypeValue ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.planTypeValue)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{plan.planType}</h4>
                    <span className="text-lg font-bold">₺{plan.limits?.monthlyPrice || 0}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• {plan.limits?.includedMonthlyStops || 0} durak/ay</div>
                    <div>• Ek durak: ₺{plan.limits?.additionalStopPrice || 0}</div>
                    {plan.limits?.hasTimeWindows && <div>✓ Zaman aralıklı teslimat</div>}
                    {plan.limits?.hasCustomerWhatsAppNotifications && (
                      <div>✓ WhatsApp ({plan.limits?.includedWhatsAppMessages || 0} mesaj)</div>
                    )}
                    <div>• Arşiv: {plan.limits?.proofArchiveDays || 0} gün</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handlePlanChange}
                disabled={loadingPlanChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingPlanChange ? 'Değiştiriliyor...' : 'Planı Değiştir'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  subscription?.currentPlan === 'Business' ? 'bg-purple-100 text-purple-800' :
                  subscription?.currentPlan === 'Professional' ? 'bg-blue-100 text-blue-800' :
                  subscription?.currentPlan === 'Growth' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {subscription?.currentPlan}
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
          <p className="text-xs text-gray-600">/ {subscription?.limits?.maxDrivers || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Duraklar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{subscription?.currentUsage?.currentMonthStops || 0}</p>
          <p className="text-xs text-gray-600">/ {subscription?.limits?.includedMonthlyStops || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-gray-500">Müşteriler</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          <p className="text-xs text-gray-600">/ {subscription?.limits?.maxCustomers || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <Car className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-gray-500">Araçlar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
          <p className="text-xs text-gray-600">/ {subscription?.limits?.maxVehicles || '∞'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span className="text-xs text-gray-500">WhatsApp</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{subscription?.currentUsage?.currentMonthWhatsAppMessages || 0}</p>
          <p className="text-xs text-gray-600">/ {subscription?.limits?.includedWhatsAppMessages || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">Aylık Gelir</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₺{stats.monthlyRevenue}</p>
          {subscription?.currentUsage?.currentMonthAdditionalCharges > 0 && (
            <p className="text-xs text-orange-600">+₺{subscription.currentUsage.currentMonthAdditionalCharges}</p>
          )}
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

        {/* Abonelik ve Kullanım - Güncellenmiş */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Abonelik ve Kullanım</h2>
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Plan Değiştir
            </button>
          </div>
          
          {subscription && (
            <div className="space-y-4">
              {/* Mevcut Plan */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Mevcut Plan</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {subscription.currentPlan}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Başlangıç: {new Date(subscription.planStartDate).toLocaleDateString('tr-TR')}
                </div>
              </div>

              {/* Durak Kullanımı */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Aylık Durak Kullanımı</span>
                  <span className="text-sm font-semibold">
                    {subscription.currentUsage?.currentMonthStops} / {subscription.limits?.includedMonthlyStops || '∞'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{
                      width: `${Math.min(100, (subscription.currentUsage?.currentMonthStops / subscription.limits?.includedMonthlyStops) * 100)}%`
                    }}
                  />
                </div>
                {subscription.currentUsage?.currentMonthAdditionalCharges > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Ek ücret: ₺{subscription.currentUsage.currentMonthAdditionalCharges}
                  </p>
                )}
              </div>

              {/* WhatsApp Kullanımı */}
              {subscription.limits?.hasCustomerWhatsAppNotifications && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">WhatsApp Mesajları</span>
                    <span className="text-sm font-semibold">
                      {subscription.currentUsage?.currentMonthWhatsAppMessages} / {subscription.limits?.includedWhatsAppMessages || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{
                        width: `${Math.min(100, (subscription.currentUsage?.currentMonthWhatsAppMessages / subscription.limits?.includedWhatsAppMessages) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Plan Özellikleri */}
              <div className="pt-3 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Plan Özellikleri</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center">
                    {subscription.limits?.hasTimeWindows ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                    )}
                    <span>Zaman Aralıklı Teslimat</span>
                  </div>
                  <div className="flex items-center">
                    {subscription.limits?.hasCustomerSatisfactionReport ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                    )}
                    <span>Memnuniyet Raporu</span>
                  </div>
                </div>
              </div>

              {/* Kullanım Sıfırlama */}
              <div className="pt-3 border-t">
                <button
                  onClick={handleResetUsage}
                  className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Aylık Kullanımı Sıfırla
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Son sıfırlama: {new Date(subscription.currentUsage?.lastResetDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          )}
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