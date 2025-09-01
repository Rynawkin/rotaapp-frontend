// frontend/src/pages/superadmin/IssuesManagement.tsx

import React, { useState, useEffect } from 'react';
import { Bug, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const IssuesManagement: React.FC = () => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await adminService.getIssues(params);
      setIssues(response);
    } catch (error) {
      toast.error('Sorun bildirimleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    try {
      await adminService.updateIssueStatus(issueId, {
        status: newStatus,
        adminNotes: adminNotes
      });
      toast.success('Durum güncellendi');
      loadIssues();
      setModalVisible(false);
      setSelectedIssue(null);
      setAdminNotes('');
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'Open': { color: 'bg-red-100 text-red-800', icon: <Clock className="w-3 h-3" />, text: 'Açık' },
      'InProgress': { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-3 h-3" />, text: 'İşlemde' },
      'Resolved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, text: 'Çözüldü' },
      'Closed': { color: 'bg-gray-100 text-gray-800', icon: <XCircle className="w-3 h-3" />, text: 'Kapalı' }
    };
    
    const config = statusConfig[status] || statusConfig['Open'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: any = {
      'Low': 'bg-blue-100 text-blue-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800',
      'Critical': 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const getIssueTypeIcon = (type: string) => {
    const icons: any = {
      'bug': '🐛',
      'feature': '💡',
      'performance': '⚡',
      'other': '📋'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sorun Bildirimleri</h2>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="Open">Açık</option>
              <option value="InProgress">İşlemde</option>
              <option value="Resolved">Çözüldü</option>
              <option value="Closed">Kapalı</option>
            </select>
            <button
              onClick={loadIssues}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Konu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öncelik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Yükleniyor...</td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Sorun bildirimi bulunamadı</td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{getIssueTypeIcon(issue.issueType)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{issue.subject}</div>
                        <div className="text-xs text-gray-500">
                          {issue.reportedByName} • {issue.workspaceName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(issue.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(issue.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500" title={new Date(issue.createdAt).toLocaleString('tr-TR')}>
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true, locale: tr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setAdminNotes(issue.adminNotes || '');
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

      {/* Modal */}
      {modalVisible && selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Sorun Detayı #{selectedIssue.id}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Konu:</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedIssue.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama:</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedIssue.description}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bildiren:</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedIssue.reportedByName} ({selectedIssue.reportedBy})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Workspace:</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedIssue.workspaceName} (ID: {selectedIssue.workspaceId})
                  </p>
                </div>

                {selectedIssue.deviceInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cihaz Bilgileri:</label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(selectedIssue.deviceInfo), null, 2)}
                    </pre>
                  </div>
                )}

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
                  <select
                    value={selectedIssue.status}
                    onChange={(e) => handleStatusChange(selectedIssue.id, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Open">Açık</option>
                    <option value="InProgress">İşlemde</option>
                    <option value="Resolved">Çözüldü</option>
                    <option value="Closed">Kapalı</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setModalVisible(false);
                    setSelectedIssue(null);
                    setAdminNotes('');
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

export default IssuesManagement;