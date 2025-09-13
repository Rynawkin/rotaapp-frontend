import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Mail,
  Phone,
  User,
  AlertCircle,
  UserCheck,
  Users,
  Save,
  Loader2,
  Edit3
} from 'lucide-react';
import { customerContactService } from '@/services/customer-contact.service';
import { notificationRoleMappingService } from '@/services/notification-role-mapping.service';
import { CustomerContact } from '@/types';

interface CustomerContactsFormProps {
  contacts: CustomerContact[];
  onChange: (contacts: CustomerContact[]) => void;
  errors?: Record<string, string>;
  viewMode?: boolean;
  customerId?: number;
  onContactSaved?: () => void;
}

const CONTACT_ROLES = [
  { value: 'DepoSorumlusu', label: 'Depo Sorumlusu' },
  { value: 'SatinalmasorumluSu', label: 'Satınalma Sorumlusu' },
  { value: 'MuhasebeSorumlusu', label: 'Muhasebe Sorumlusu' },
  { value: 'Diger', label: 'Diğer' }
];

const getDefaultNotificationSettings = async (role: string) => {
  try {
    // Global ayarları getir
    const mappings = await notificationRoleMappingService.getAll();
    
    // Bu rol için etkin olan bildirimleri bul
    const roleSettings = {
      receiveJourneyStart: mappings.some(m => m.contactRole === role && m.notificationType === 'JourneyStart' && m.isEnabled),
      receiveJourneyCheckIn: mappings.some(m => m.contactRole === role && m.notificationType === 'JourneyCheckIn' && m.isEnabled),
      receiveDeliveryCompleted: mappings.some(m => m.contactRole === role && m.notificationType === 'DeliveryCompleted' && m.isEnabled),
      receiveDeliveryFailed: mappings.some(m => m.contactRole === role && m.notificationType === 'DeliveryFailed' && m.isEnabled),
      receiveJourneyAssigned: mappings.some(m => m.contactRole === role && m.notificationType === 'JourneyAssigned' && m.isEnabled),
      receiveJourneyCancelled: mappings.some(m => m.contactRole === role && m.notificationType === 'JourneyCancelled' && m.isEnabled)
    };
    
    return roleSettings;
  } catch (error) {
    console.error('Error loading global settings, using fallback:', error);
    
    // Fallback: Eski hardcoded ayarlar
    switch (role) {
      case 'DepoSorumlusu':
      case 'SatinalmasorumluSu':
        return {
          receiveJourneyStart: true,
          receiveJourneyCheckIn: true,
          receiveDeliveryCompleted: true,
          receiveDeliveryFailed: true,
          receiveJourneyAssigned: true,
          receiveJourneyCancelled: true
        };
      case 'MuhasebeSorumlusu':
        return {
          receiveJourneyStart: false,
          receiveJourneyCheckIn: false,
          receiveDeliveryCompleted: true,
          receiveDeliveryFailed: true,
          receiveJourneyAssigned: false,
          receiveJourneyCancelled: true
        };
      default: // Diger
        return {
          receiveJourneyStart: true,
          receiveJourneyCheckIn: false,
          receiveDeliveryCompleted: true,
          receiveDeliveryFailed: true,
          receiveJourneyAssigned: false,
          receiveJourneyCancelled: false
        };
    }
  }
};

const CustomerContactsForm: React.FC<CustomerContactsFormProps> = ({
  contacts,
  onChange,
  errors = {},
  viewMode = false,
  customerId,
  onContactSaved
}) => {
  const [expandedContact, setExpandedContact] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const addContact = async (role: string = 'DepoSorumlusu') => {
    try {
      const defaultSettings = await getDefaultNotificationSettings(role);
      
      const newContact: CustomerContact = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role,
        isPrimary: false,
        ...defaultSettings
      };

      onChange([...contacts, newContact]);
    } catch (error) {
      console.warn('Failed to load default notification settings, using fallback:', error);
      // Fallback: temel ayarları kullan
      const newContact: CustomerContact = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role,
        isPrimary: false,
        emailEnabled: true,
        whatsappEnabled: true,
        journeyStart: true,
        driverApproaching: true,
        deliveryCompleted: true,
        deliveryFailed: true
      };

      onChange([...contacts, newContact]);
    }
  };

  const removeContact = async (index: number) => {
    if (viewMode && customerId) {
      const contact = contacts[index];
      if (contact.id) {
        setDeleting(index);
        try {
          await customerContactService.delete(contact.id);
          const updatedContacts = contacts.filter((_, i) => i !== index);
          onChange(updatedContacts);
        } catch (error) {
          console.error('Error deleting contact:', error);
          alert('Kişi silinirken bir hata oluştu');
        } finally {
          setDeleting(null);
        }
      } else {
        const updatedContacts = contacts.filter((_, i) => i !== index);
        onChange(updatedContacts);
      }
    } else {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      onChange(updatedContacts);
    }
  };

  const saveContact = async (index: number) => {
    const contact = contacts[index];
    if (!contact.firstName || !contact.lastName || !contact.email) {
      alert('Lütfen tüm zorunlu alanları doldurun (Ad, Soyad, Email)');
      return;
    }

    // Eğer customerId yoksa sadece local state'i güncelleyelim
    if (!customerId) {
      alert('Kişi bilgileri kaydedildi (müşteri kaydedildikten sonra veritabanına kaydedilecek)');
      return;
    }

    setSaving(index);
    try {
      const contactData = {
        ...contact,
        customerId,
        isActive: true
      };

      if (contact.id) {
        // Update existing contact
        await customerContactService.update(contact.id, contactData);
        alert('Kişi başarıyla güncellendi');
      } else {
        // Create new contact
        const newContact = await customerContactService.create(contactData);
        const updatedContacts = [...contacts];
        updatedContacts[index] = newContact;
        onChange(updatedContacts);
        alert('Kişi başarıyla kaydedildi');
      }
      
      // Parent'a kaydetme işleminin tamamlandığını bildir
      if (onContactSaved) {
        onContactSaved();
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Kişi kaydedilirken bir hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const updateContact = async (index: number, field: keyof CustomerContact, value: any) => {
    const updatedContacts = [...contacts];
    
    // Rol değiştiğinde bildirim ayarlarını güncelle
    if (field === 'role') {
      try {
        const defaultSettings = await getDefaultNotificationSettings(value);
        updatedContacts[index] = {
          ...updatedContacts[index],
          [field]: value,
          ...defaultSettings
        };
      } catch (error) {
        console.warn('Failed to load default notification settings, using fallback:', error);
        // Fallback: temel ayarları kullan
        updatedContacts[index] = {
          ...updatedContacts[index],
          [field]: value,
          emailEnabled: true,
          whatsappEnabled: true,
          journeyStart: true,
          driverApproaching: true,
          deliveryCompleted: true,
          deliveryFailed: true
        };
      }
    } else {
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };
    }
    
    onChange(updatedContacts);
  };


  const getRoleLabel = (value: string) => {
    return CONTACT_ROLES.find(r => r.value === value)?.label || value;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DepoSorumlusu': return 'bg-blue-100 text-blue-800';
      case 'SatinalmasorumluSu': return 'bg-green-100 text-green-800';
      case 'MuhasebeSorumlusu': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          İletişim Kişileri ({contacts.length})
        </h2>
        
        <button
          type="button"
          onClick={() => addContact()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Kişi Ekle
        </button>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Henüz iletişim kişisi eklenmemiş</p>
          <p className="text-sm text-gray-500 mb-4">
            Yukarıdaki "Kişi Ekle" butonuna tıklayarak başlayın
          </p>
        </div>
      )}

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4"
          >
            {/* Contact Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(contact.role)}`}>
                  {getRoleLabel(contact.role)}
                </span>
                {contact.firstName && contact.lastName && (
                  <span className="text-sm font-medium text-gray-700">
                    {contact.firstName} {contact.lastName}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedContact(expandedContact === index ? null : index)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {expandedContact === index ? 'Kapat' : 'Detay'}
                </button>
                <button
                  type="button"
                  onClick={() => saveContact(index)}
                  disabled={saving === index}
                  className="p-1 text-green-600 hover:text-green-700 mr-2"
                  title="Kaydet"
                >
                  {saving === index ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeContact(index)}
                  disabled={deleting === index}
                  className="p-1 text-red-600 hover:text-red-700"
                  title="Sil"
                >
                  {deleting === index ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.firstName}
                  onChange={(e) => updateContact(index, 'firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[`contacts[${index}].firstName`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Adı"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.lastName}
                  onChange={(e) => updateContact(index, 'lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[`contacts[${index}].lastName`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Soyadı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`contacts[${index}].email`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>
            </div>

            {/* Role and Primary Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={contact.role}
                  onChange={(e) => updateContact(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTACT_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Expanded Notification Settings */}
            {expandedContact === index && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Bildirim Tercihleri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveJourneyStart}
                      onChange={(e) => updateContact(index, 'receiveJourneyStart', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Seyahat Başladı</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveJourneyCheckIn}
                      onChange={(e) => updateContact(index, 'receiveJourneyCheckIn', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Sürücü Yaklaştı</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveDeliveryCompleted}
                      onChange={(e) => updateContact(index, 'receiveDeliveryCompleted', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Teslimat Tamamlandı</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveDeliveryFailed}
                      onChange={(e) => updateContact(index, 'receiveDeliveryFailed', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Teslimat Başarısız</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveJourneyAssigned}
                      onChange={(e) => updateContact(index, 'receiveJourneyAssigned', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Seyahat Atandı</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contact.receiveJourneyCancelled}
                      onChange={(e) => updateContact(index, 'receiveJourneyCancelled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Seyahat İptal Edildi</span>
                  </label>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {(errors[`contacts[${index}].firstName`] || 
              errors[`contacts[${index}].lastName`] || 
              errors[`contacts[${index}].email`]) && (
              <div className="mt-2 p-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  {errors[`contacts[${index}].firstName`] && (
                    <div>{errors[`contacts[${index}].firstName`]}</div>
                  )}
                  {errors[`contacts[${index}].lastName`] && (
                    <div>{errors[`contacts[${index}].lastName`]}</div>
                  )}
                  {errors[`contacts[${index}].email`] && (
                    <div>{errors[`contacts[${index}].email`]}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerContactsForm;