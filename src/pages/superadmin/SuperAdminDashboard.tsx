// src/pages/superadmin/SuperAdminDashboard.tsx - Güvenli silme ile güncelleme
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, TrendingUp, DollarSign, 
  Activity, AlertCircle, Search, Filter,
  ChevronRight, MoreVertical, Calendar,
  Eye, Edit, Trash2, Power, Lock, Unlock,
  Archive, AlertTriangle, Bug
} from 'lucide-react';
import { WorkspaceUsage, WorkspaceStats } from '@/types';
import { workspaceService } from '@/services/workspace.service';
import { adminService } from '@/services/admin.service';

// Silme Onay Modal Componenti
const DeleteConfirmModal: React.FC<{
  workspace: WorkspaceUsage | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ workspace, onConfirm, onCancel }) => {
  const [confirmText, setConfirmText] = useState('');
  
  if (!workspace) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Firma Arşivleme</h3>
            <p className="text-sm text-gray-600">Bu işlem geri alınabilir</p>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            <strong>{workspace.workspaceName}</strong> firmasını arşivlemek üzeresiniz.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Arşivlenen firma:
            </p>
            <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
              <li>Sisteme giriş yapamaz</li>
              <li>Yeni rota oluşturamaz</li>
              <li>Verileri korunur ve geri getirilebilir</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Onaylamak için <strong>"{workspace.workspaceName}"</strong> yazın:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Firma adını yazın"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== workspace.workspaceName}
            className={`px-4 py-2 rounded-lg ${
              confirmText === workspace.workspaceName
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Arşivle
          </button>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkspaceStats>({
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    trialWorkspaces: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalRoutes: 0
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceUsage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [deleteModalWorkspace, setDeleteModalWorkspace] = useState<WorkspaceUsage | null>(null);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usageData, issuesData] = await Promise.all([
        workspaceService.getStats(),
        workspaceService.getUsageStats(),
        adminService.getIssues({ status: 'Open' })
      ]);
      setStats(statsData);
      setWorkspaces(usageData);
      setOpenIssuesCount(issuesData.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(w => {
    const matchesSearch = w.workspaceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || w.plan.toLowerCase() === filterPlan.toLowerCase();
    return matchesSearch && matchesPlan;
  });

  const handleViewDetails = (workspaceId: string) => {
    navigate(`/super-admin/workspace/${workspaceId}`);
  };

  const handleToggleStatus = async (workspace: WorkspaceUsage) => {
    const newStatus = workspace.status === 'active' ? false : true;
    await workspaceService.updateStatus(workspace.workspaceId, newStatus);
    await loadData();
    setShowActionMenu(null);
  };

  const handleArchiveWorkspace = async () => {
    if (!deleteModalWorkspace) return;
    
    // Arşivleme işlemi (soft delete)
    await workspaceService.updateStatus(deleteModalWorkspace.workspaceId, false);
    await loadData();
    setDeleteModalWorkspace(null);
    setShowActionMenu(null);
  };

  const statCards = [
    {
      title: 'Toplam Firma',
      value: stats.totalWorkspaces,
      change: '+12%',
      icon: Building2,
      color: 'blue',
      onClick: null
    },
    {
      title: 'Aktif Firma',
      value: stats.activeWorkspaces,
      change: '+8%',
      icon: Activity,
      color: 'green',
      onClick: null
    },
    {
      title: 'Aylık Gelir',
      value: `₺${stats.totalRevenue.toLocaleString('tr-TR')}`,
      change: '+23%',
      icon: DollarSign,
      color: 'purple',
      onClick: null
    },
    {
      title: 'Açık Sorunlar',
      value: openIssuesCount,
      change: openIssuesCount > 0 ? `${openIssuesCount} bekliyor` : 'Temiz',
      icon: Bug,
      color: openIssuesCount > 0 ? 'red' : 'gray',
      onClick: () => navigate('/superadmin/issues')
    }
  ];

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

  return (
    <div className="p-6">
      {/* Delete Confirmation Modal */}
      {deleteModalWorkspace && (
        <DeleteConfirmModal
          workspace={deleteModalWorkspace}
          onConfirm={handleArchiveWorkspace}
          onCancel={() => setDeleteModalWorkspace(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
        <p className="text-gray-600 mt-1">RotaApp SaaS platformunu yönetin</p>
      </div>

      {/* Stats Grid - Issues kartı eklendi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${
              stat.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <span className={`text-sm font-medium ${
                stat.color === 'red' ? 'text-red-600' : 
                stat.change.startsWith('+') ? 'text-green-600' : 
                stat.change === 'Temiz' ? 'text-gray-500' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            {stat.onClick && (
              <p className="text-xs text-blue-600 mt-2 hover:text-blue-700">
                Detayları görüntüle →
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Table - aynı */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Table header - aynı */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Firmalar ({filteredWorkspaces.length})</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Firma ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Planlar</option>
                <option value="trial">Trial</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table headers - aynı */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanım
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gelir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Aktivite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWorkspaces.map((workspace) => (
                <tr key={workspace.workspaceId} className="hover:bg-gray-50">
                  {/* Diğer kolonlar aynı */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {workspace.workspaceName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {workspace.userCount} kullanıcı
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${workspace.plan === 'premium' ? 'bg-purple-100 text-purple-800' : ''}
                      ${workspace.plan === 'basic' ? 'bg-blue-100 text-blue-800' : ''}
                      ${workspace.plan === 'trial' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${workspace.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {workspace.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="text-xs">{workspace.driverCount} sürücü</div>
                      <div className="text-xs">{workspace.routeCount} rota</div>
                      <div className="text-xs">{workspace.customerCount} müşteri</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₺{workspace.monthlyRevenue.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workspace.lastActivity).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setShowActionMenu(
                          showActionMenu === workspace.workspaceId ? null : workspace.workspaceId
                        )}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      
                      {showActionMenu === workspace.workspaceId && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowActionMenu(null)}
                          />
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                            <button
                              onClick={() => handleViewDetails(workspace.workspaceId)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Detayları Gör
                            </button>
                            <button
                              onClick={() => navigate(`/super-admin/workspace/${workspace.workspaceId}/edit`)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleToggleStatus(workspace)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              {workspace.status === 'active' ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Pasif Yap
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Aktif Yap
                                </>
                              )}
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => setDeleteModalWorkspace(workspace)}
                              className="flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 w-full text-left"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Arşivle
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;