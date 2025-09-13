import React, { useState, useEffect } from 'react';
import {
  Bell,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { 
  notificationRoleMappingService, 
  NotificationRoleMapping, 
  RoleOption, 
  NotificationTypeOption 
} from '@/services/notification-role-mapping.service';

const NotificationRoleSettings: React.FC = () => {
  const [mappings, setMappings] = useState<NotificationRoleMapping[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [notificationTypes, setNotificationTypes] = useState<NotificationTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsData, rolesData, notificationTypesData] = await Promise.all([
        notificationRoleMappingService.getAll(),
        notificationRoleMappingService.getRoles(),
        notificationRoleMappingService.getNotificationTypes()
      ]);

      setMappings(mappingsData);
      setRoles(rolesData);
      setNotificationTypes(notificationTypesData);
    } catch (error) {
      console.error('Error loading notification role settings:', error);
      setErrorMessage('Bildirim ayarları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (roleKey: string, notificationTypeKey: string): boolean => {
    return mappings.some(m => 
      m.contactRole === roleKey && 
      m.notificationType === notificationTypeKey && 
      m.isEnabled
    );
  };

  const toggleMapping = (roleKey: string, notificationTypeKey: string, enabled: boolean) => {
    setMappings(prev => {
      const existing = prev.find(m => 
        m.contactRole === roleKey && m.notificationType === notificationTypeKey
      );

      if (existing) {
        return prev.map(m => 
          m.contactRole === roleKey && m.notificationType === notificationTypeKey
            ? { ...m, isEnabled: enabled }
            : m
        );
      } else {
        return [
          ...prev,
          {
            contactRole: roleKey,
            notificationType: notificationTypeKey,
            isEnabled: enabled
          }
        ];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await notificationRoleMappingService.bulkUpdate(mappings);
      setSuccessMessage('Bildirim ayarları başarıyla kaydedildi');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification role settings:', error);
      setErrorMessage('Bildirim ayarları kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Tüm bildirim ayarları varsayılan değerlere sıfırlanacak. Emin misiniz?')) {
      return;
    }

    setResetting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await notificationRoleMappingService.resetToDefaults();
      await loadData();
      setSuccessMessage('Bildirim ayarları varsayılan değerlere sıfırlandı');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error resetting notification role settings:', error);
      setErrorMessage('Bildirim ayarları sıfırlanırken hata oluştu');
    } finally {
      setResetting(false);
    }
  };

  const getRoleColor = (roleKey: string) => {
    switch (roleKey) {
      case 'DepoSorumlusu': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SatinalmasorumluSu': return 'bg-green-100 text-green-800 border-green-200';
      case 'MuhasebeSorumlusu': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Diger': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Bildirim ayarları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 mr-3" />
            Bildirim Rol Eşleştirme
          </h2>
          <p className="text-gray-600 mt-1">
            Hangi rollerdeki kişilerin hangi bildirimleri alacağını belirleyin. 
            Bu ayarlar yeni eklenen müşteri kişileri için varsayılan olarak kullanılır.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleResetToDefaults}
            disabled={resetting}
            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            {resetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Varsayılana Sıfırla
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Kaydet
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 w-48">
                  Rol
                </th>
                {notificationTypes.map(type => (
                  <th key={type.key} className="px-4 py-4 text-center text-sm font-medium text-gray-900">
                    <div className="min-w-32">
                      {type.value}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roles.map(role => (
                <tr key={role.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.key)}`}>
                      <Settings className="w-4 h-4 mr-2" />
                      {role.value}
                    </div>
                  </td>
                  {notificationTypes.map(type => (
                    <td key={`${role.key}-${type.key}`} className="px-4 py-4 text-center">
                      <label className="inline-flex items-center justify-center w-full">
                        <input
                          type="checkbox"
                          checked={isEnabled(role.key, type.key)}
                          onChange={(e) => toggleMapping(role.key, type.key, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Nasıl Çalışır:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Yukarıdaki tabloda hangi rollerin hangi bildirimleri alacağını seçebilirsiniz</li>
          <li>• İşaretlenen kutular için bildirimler gönderilir, işaretlenmeyenler için gönderilmez</li>
          <li>• Bu ayarlar yeni eklenen müşteri kişileri için varsayılan olarak kullanılır</li>
          <li>• Mevcut müşteri kişilerinin ayarları değişmez, sadece yeni eklenenleri etkiler</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationRoleSettings;