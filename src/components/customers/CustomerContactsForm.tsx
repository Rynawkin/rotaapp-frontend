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
import { CustomerContact } from '@/types';

interface CustomerContactsFormProps {
  contacts: CustomerContact[];
  onChange: (contacts: CustomerContact[]) => void;
  errors?: Record<string, string>;
  viewMode?: boolean;
  customerId?: number;
}

const CONTACT_ROLES = [
  { value: 'DepoSorumlusu', label: 'Depo Sorumlusu' },
  { value: 'SatinalmasorumluSu', label: 'Satınalma Sorumlusu' },
  { value: 'MuhasebeSorumlusu', label: 'Muhasebe Sorumlusu' },
  { value: 'Diger', label: 'Diğer' }
];

const getDefaultNotificationSettings = (role: string) => {
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
};

const CustomerContactsForm: React.FC<CustomerContactsFormProps> = ({
  contacts,
  onChange,
  errors = {},
  viewMode = false,
  customerId
}) => {
  const [expandedContact, setExpandedContact] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const addContact = (role: string = 'DepoSorumlusu') => {
    const newContact: CustomerContact = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role,
      isPrimary: contacts.length === 0, // İlk kişi otomatik primary
      ...getDefaultNotificationSettings(role)
    };

    onChange([...contacts, newContact]);
  };

  const removeContact = async (index: number) => {
    if (viewMode && customerId) {
      const contact = contacts[index];
      if (contact.id) {
        setDeleting(index);
        try {
          await customerContactService.delete(contact.id);
          const updatedContacts = contacts.filter((_, i) => i !== index);
          // Eğer silinen kişi primary ise ve başka kişi varsa, ilk kişiyi primary yap
          if (contact.isPrimary && updatedContacts.length > 0) {
            updatedContacts[0].isPrimary = true;
          }
          onChange(updatedContacts);
        } catch (error) {
          console.error('Error deleting contact:', error);
          alert('Kişi silinirken bir hata oluştu');
        } finally {
          setDeleting(null);
        }
      } else {
        const updatedContacts = contacts.filter((_, i) => i !== index);
        if (contacts[index].isPrimary && updatedContacts.length > 0) {
          updatedContacts[0].isPrimary = true;
        }
        onChange(updatedContacts);
      }
    } else {
      const updatedContacts = contacts.filter((_, i) => i !== index);
      if (contacts[index].isPrimary && updatedContacts.length > 0) {
        updatedContacts[0].isPrimary = true;
      }
      onChange(updatedContacts);
    }
  };

  const saveContact = async (index: number) => {
    if (!viewMode || !customerId) return;

    const contact = contacts[index];
    if (!contact.firstName || !contact.lastName || !contact.email || !contact.phone) {
      alert('Lütfen tüm zorunlu alanları doldurun');
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
      } else {
        // Create new contact
        const newContact = await customerContactService.create(contactData);
        const updatedContacts = [...contacts];
        updatedContacts[index] = newContact;
        onChange(updatedContacts);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Kişi kaydedilirken bir hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const updateContact = (index: number, field: keyof CustomerContact, value: any) => {
    const updatedContacts = [...contacts];
    
    // Rol değiştiğinde bildirim ayarlarını güncelle
    if (field === 'role') {
      const defaultSettings = getDefaultNotificationSettings(value);
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
        ...defaultSettings
      };
    } else if (field === 'isPrimary' && value) {
      // Yeni primary seçildiğinde diğerlerini false yap
      updatedContacts.forEach((contact, i) => {
        contact.isPrimary = i === index;
      });
    } else {
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };
    }
    
    onChange(updatedContacts);
  };

  // Varsayılan kişiler oluştur
  const addDefaultContacts = () => {
    const defaultContacts: CustomerContact[] = [
      {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'DepoSorumlusu',
        isPrimary: true,
        ...getDefaultNotificationSettings('DepoSorumlusu')
      },
      {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'SatinalmasorumluSu',
        isPrimary: false,
        ...getDefaultNotificationSettings('SatinalmasorumluSu')
      }
    ];
    
    onChange(defaultContacts);
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
        
        <div className="flex gap-2">
          {contacts.length === 0 && (
            <button
              type="button"
              onClick={addDefaultContacts}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Varsayılan Ekle
            </button>
          )}
          
          <button
            type="button"
            onClick={() => addContact()}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Kişi Ekle
          </button>
        </div>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">Henüz iletişim kişisi eklenmedi</p>
          <p className="text-sm text-gray-500 mb-4">
            Depo Sorumlusu ve Satınalma Sorumlusu varsayılan olarak tüm bildirimleri alır
          </p>
        </div>
      )}

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              contact.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
          >
            {/* Contact Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleColor(contact.role)}`}>
                  {getRoleLabel(contact.role)}
                </span>
                {contact.isPrimary && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Ana Kişi
                  </span>
                )}
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
                {viewMode && (
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
                )}
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

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={contact.isPrimary}
                    onChange={(e) => updateContact(index, 'isPrimary', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ana kişi olarak işaretle</span>
                </label>
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