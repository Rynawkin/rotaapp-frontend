import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Building, Calendar, Eye, Edit, User } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface MarketingLead {
  id: number;
  name: string;
  email: string;
  company: string;
  phone?: string;
  vehicleCount?: string;
  message?: string;
  source: string;
  selectedPlan?: string;
  status: number;
  adminNotes?: string;
  contactedAt?: string;
  closedAt?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt?: string;
}

interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  thisMonthLeads: number;
  conversionRate: number;
}

const MarketingLeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const leadStatuses = {
    0: { name: 'Yeni', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
    1: { name: 'İletişime Geçildi', color: 'bg-yellow-100 text-yellow-800', icon: '📞' },
    2: { name: 'Nitelikli', color: 'bg-purple-100 text-purple-800', icon: '⭐' },
    3: { name: 'Demo', color: 'bg-indigo-100 text-indigo-800', icon: '🎯' },
    4: { name: 'Teklif', color: 'bg-orange-100 text-orange-800', icon: '📄' },
    5: { name: 'Kazanıldı', color: 'bg-green-100 text-green-800', icon: '🎉' },
    6: { name: 'Kaybedildi', color: 'bg-red-100 text-red-800', icon: '❌' },
    7: { name: 'Arşivlendi', color: 'bg-gray-100 text-gray-800', icon: '📦' }
  };

  const planNames = {
    'pilot': 'Pilot',
    'kaptan': 'Kaptan',
    'amiral': 'Amiral',
    'filo': 'Filo'
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, sourceFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;

      // Load leads data
      const leadsData = await adminService.getMarketingLeads(params);
      setLeads(leadsData);

      // Try to load stats, but don't fail if it errors
      try {
        const statsData = await adminService.getMarketingLeadStats();
        setStats(statsData);
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
        // Set default stats if API fails
        setStats({
          totalLeads: leadsData.length || 0,
          newLeads: 0,
          qualifiedLeads: 0,
          wonLeads: 0,
          thisMonthLeads: 0,
          conversionRate: 0
        });
        toast.error('İstatistikler yüklenemedi, varsayılan değerler gösteriliyor');
      }
    } catch (error) {
      console.error('Error loading marketing leads:', error);
      toast.error('Marketing lead\'leri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: number) => {
    try {
      await adminService.updateMarketingLead(leadId, {
        status: newStatus,
        adminNotes: adminNotes,
        assignedTo: assignedTo
      });
      toast.success('Lead durumu güncellendi');
      loadData();
      setModalVisible(false);
      setSelectedLead(null);
      setAdminNotes('');
      setAssignedTo('');
    } catch (error) {
      toast.error('Lead güncellenemedi');
    }
  };

  const getStatusBadge = (status: number) => {
    const statusInfo = leadStatuses[status as keyof typeof leadStatuses] || leadStatuses[0];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <span>{statusInfo.icon}</span>
        {statusInfo.name}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceColors: any = {
      'website': 'bg-blue-100 text-blue-800',
      'pricing_page': 'bg-purple-100 text-purple-800',
      'contact_form': 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sourceColors[source] || 'bg-gray-100 text-gray-800'}`}>
        {source}
      </span>
    );
  };

  if (loading && !leads.length) {
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
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Toplam Lead</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Yeni</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newLeads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Nitelikli</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualifiedLeads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Kazanılan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.wonLeads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonthLeads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-pink-600">%</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Dönüşüm</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Marketing Lead'leri</h2>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              {Object.entries(leadStatuses).map(([value, status]) => (
                <option key={value} value={value}>{status.name}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Kaynaklar</option>
              <option value="website">Website</option>
              <option value="pricing_page">Pricing Page</option>
              <option value="contact_form">Contact Form</option>
            </select>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">Yükleniyor...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Marketing lead bulunamadı</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.company}</div>
                        {lead.vehicleCount && (
                          <div className="text-xs text-gray-400">{lead.vehicleCount} araç</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-3 h-3 mr-1" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="w-3 h-3 mr-1" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.selectedPlan ? (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                          {planNames[lead.selectedPlan as keyof typeof planNames] || lead.selectedPlan}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(lead.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500" title={new Date(lead.createdAt).toLocaleString('tr-TR')}>
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: tr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setAdminNotes(lead.adminNotes || '');
                          setAssignedTo(lead.assignedTo || '');
                          setModalVisible(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {modalVisible && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Lead Detayı #{selectedLead.id}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ad Soyad:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Şirket:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.company}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.phone || '-'}</p>
                  </div>
                </div>

                {selectedLead.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mesaj:</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Araç Sayısı:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.vehicleCount || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Seçilen Plan:</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedLead.selectedPlan ? planNames[selectedLead.selectedPlan as keyof typeof planNames] || selectedLead.selectedPlan : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kaynak:</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLead.source}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Atanan Kişi:</label>
                  <input
                    type="email"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="admin@yolpilot.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notları:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Notlarınızı buraya yazın..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durum Güncelle:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(leadStatuses).map(([value, status]) => (
                      <button
                        key={value}
                        onClick={() => handleStatusChange(selectedLead.id, parseInt(value))}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                          selectedLead.status === parseInt(value)
                            ? status.color
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className="block">{status.icon}</span>
                        {status.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedLead(null);
                    setAdminNotes('');
                    setAssignedTo('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingLeadsManagement;