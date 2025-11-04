import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2,
  Users,
  User,
  Bell,
  Truck,
  CreditCard,
  Globe,
  FileText,
  Save,
  Upload,
  Download,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  ChevronRight,
  Check,
  X,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Info,
  AlertCircle,
  Crown,
  Zap,
  Star,
  ExternalLink,
  Link,
  Unlink,
  Loader2
} from 'lucide-react';
import { TemplateEditor } from '@/components/templates/TemplateEditor';
import NotificationRoleSettings from '@/components/settings/NotificationRoleSettings';
import { settingsService } from '@/services/settings.service';
import { memberService, type Member, type CreateMemberRequest } from '@/services/member.service';
import { depotService } from '@/services/depot.service';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/services/subscription.service';
import { Package, MessageSquare, Calendar } from 'lucide-react';
import { TrialBanner } from '@/components/payment/TrialBanner';
import { UpgradePlan } from '@/components/payment/UpgradePlan';
import { PaymentHistory } from '@/components/payment/PaymentHistory';
import { UsageStats } from '@/components/payment/UsageStats';
import { paymentService } from '@/services/payment.service';

const Settings: React.FC = () => {
  const { user, canAccessDispatcherFeatures, canAccessAdminFeatures } = useAuth();
  
  // ROL BAZLI SEKME KONTROLÜ
  const getAvailableTabs = () => {
    if (user?.isSuperAdmin) {
      return ['company', 'users', 'delivery', 'notifications', 'templates', 'subscription', 'payment', 'regional', 'data'];
    }
    if (canAccessAdminFeatures()) {
      return ['company', 'users', 'delivery', 'notifications', 'templates', 'subscription', 'payment', 'regional', 'data'];
    }
    if (canAccessDispatcherFeatures()) {
      return ['users', 'delivery', 'notifications', 'templates'];
    }
    return [];
  };

  const availableTabs = getAvailableTabs();
  
  if (availableTabs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-gray-400" />
            <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'delivery' | 'notifications' | 'templates' | 'subscription' | 'regional' | 'payment'>(availableTabs[0] as any);
  
  // Payment related states
  const [showUpgradePlan, setShowUpgradePlan] = useState(false);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingWhatsApp, setConnectingWhatsApp] = useState(false);
  const [disconnectingWhatsApp, setDisconnectingWhatsApp] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'disabled' | 'shared' | 'custom'>('disabled');
  const [twilioStatus, setTwilioStatus] = useState<any>(null);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    memberId: string;
    memberName: string;
  }>({ show: false, memberId: '', memberName: '' });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    name: '',
    logo: '',
    address: '',
    city: '',
    postalCode: '',
    taxNumber: '',
    phoneNumber: '',
    email: '',
    website: '',
    // Twilio/WhatsApp Credentials - YENİ EKLENEN
    twilioConnected: false,
    twilioAccountSid: '',
    twilioWhatsAppNumber: '',
    twilioVerified: false,
    twilioConnectedAt: null as Date | null
  });

  // Users - Updated for member service
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [depots, setDepots] = useState<any[]>([]);
  
  // Modal için yeni member state'i
  const [newMember, setNewMember] = useState<{
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    depotId: number | null;
  }>({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    depotId: null
  });
  
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // Delivery Settings
  const [deliverySettings, setDeliverySettings] = useState({
    defaultServiceTime: 15,
    defaultSignatureRequired: false,  // YENİ
    defaultPhotoRequired: false,      // YENİ
    defaultAvoidTolls: false,         // YENİ - Ücretli yolları varsayılan olarak kullanma
    workingHours: {
      monday: { start: '08:00', end: '18:00', enabled: true },
      tuesday: { start: '08:00', end: '18:00', enabled: true },
      wednesday: { start: '08:00', end: '18:00', enabled: true },
      thursday: { start: '08:00', end: '18:00', enabled: true },
      friday: { start: '08:00', end: '18:00', enabled: true },
      saturday: { start: '09:00', end: '14:00', enabled: true },
      sunday: { start: '09:00', end: '14:00', enabled: false }
    },
    prioritySettings: {
      high: { color: '#EF4444', maxDelay: 30 },
      normal: { color: '#F59E0B', maxDelay: 60 },
      low: { color: '#10B981', maxDelay: 120 }
    },
  });

  // Notification Settings - Multi-tenant WhatsApp
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    notificationEmail: '',
    notificationPhone: '',
    
    // WhatsApp Settings - MULTI-TENANT YAPISINA UYGUN
    whatsAppSettings: {
      enabled: false,
      enableWhatsAppForJourneyStart: false,
      enableWhatsAppForCheckIn: false,
      enableWhatsAppForCompletion: false,
      enableWhatsAppForFailure: false
    },
    
    events: {
      routeCompleted: true,
      deliveryFailed: true,
      driverDelayed: true,
      newCustomer: false,
      dailyReport: true
    }
  });

  // Regional Settings
  const [regionalSettings, setRegionalSettings] = useState({
    language: 'tr' as 'tr' | 'en',
    timezone: 'Europe/Istanbul',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 'monday' as 'monday' | 'sunday'
  });

  // Delay Alert Settings
  const [delayAlertSettings, setDelayAlertSettings] = useState({
    enabled: false,
    thresholdHours: 1,
    alertEmails: ''
  });

  // Load settings from backend
  useEffect(() => {
    loadSettingsFromBackend();
    checkTwilioStatus();
  }, []);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] as typeof activeTab);
    }
  }, [user]);

  
  // Subscription verilerini yükle
  useEffect(() => {
    if (activeTab === 'subscription' && availableTabs.includes('subscription')) {
      loadSubscriptionData();
    }
  }, [activeTab]);

  const loadSubscriptionData = async () => {
    setLoadingSubscription(true);
    try {
      const [planDetails, billingSummary] = await Promise.all([
        subscriptionService.getPlanDetails(),
        subscriptionService.getBillingSummary()
      ]);
      setSubscriptionData(planDetails);
      setBillingData(billingSummary);
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Abonelik verileri yüklenirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
    } finally {
      setLoadingSubscription(false);
    }
  };
  
  // Members ve Depots yükleme
  useEffect(() => {
    if (activeTab === 'users' && canAccessAdminFeatures()) {
      loadMembers();
      loadDepots();
    }
  }, [activeTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const data = await memberService.getMembers();
      setMembers(data);
    } catch (error: any) {
      console.error('Error loading members:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Kullanıcılar yüklenirken hata oluştu';
      setError(errorMessage);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadDepots = async () => {
    try {
      const data = await depotService.getAll(); // getDepots() yerine getAll()
      setDepots(data);
      // İlk depoyu varsayılan olarak seç
      if (data.length > 0 && !newMember.depotId) {
        setNewMember(prev => ({ ...prev, depotId: data[0].id }));
      }
    } catch (error: any) {
      console.error('Error loading depots:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Depolar yüklenirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
    }
  };

  const handleAddMember = () => {
    setNewMember({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      depotId: depots.length > 0 ? depots[0].id : null
    });
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!newMember.fullName || !newMember.email || !newMember.password) {
      setError('Ad Soyad, Email ve Şifre zorunludur');
      return;
    }

    setSavingMember(true);
    try {
      await memberService.createDispatcher({
        fullName: newMember.fullName,
        email: newMember.email,
        password: newMember.password,
        phoneNumber: newMember.phoneNumber || undefined,
        depotId: newMember.depotId || undefined
      });
      
      // Başarılı - listeyi yenile
      await loadMembers();
      setShowMemberModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Form'u temizle
      setNewMember({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        depotId: depots.length > 0 ? depots[0].id : null
      });
    } catch (error: any) {
      console.error('Error creating dispatcher:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Dispatcher oluşturulurken hata oluştu';
      setError(errorMessage);
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = (userId: string, memberName: string) => {
    setDeleteConfirmModal({ show: true, memberId: userId, memberName });
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (deleteConfirmText !== 'SİL') {
      setError('Onaylamak için "SİL" yazmalısınız');
      return;
    }

    try {
      await memberService.deleteMember(deleteConfirmModal.memberId);
      await loadMembers();
      setDeleteConfirmModal({ show: false, memberId: '', memberName: '' });
      setDeleteConfirmText('');
      setError(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error: any) {
      console.error('Error deleting member:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Kullanıcı silinirken hata oluştu';
      setError(errorMessage);
    }
  };


  const getRoleBadgeColor = (member: Member) => {
    if (member.isSuperAdmin) return 'bg-purple-100 text-purple-700';
    if (member.isAdmin) return 'bg-red-100 text-red-700';
    if (member.isDispatcher) return 'bg-blue-100 text-blue-700';
    if (member.isDriver) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (member: Member) => {
    if (member.isSuperAdmin) return 'Super Admin';
    if (member.isAdmin) return 'Admin';
    if (member.isDispatcher) return 'Dispatcher';
    if (member.isDriver) return 'Sürücü';
    return 'Kullanıcı';
  };

  const loadSettingsFromBackend = async () => {
    setLoading(true);
    setError(null);

    try {
      const [workspace, delivery, notifications, delayAlerts] = await Promise.all([
        settingsService.getWorkspaceSettings().catch(() => null),
        settingsService.getDeliverySettings().catch(() => null),
        settingsService.getNotificationSettings().catch(() => null),
        canAccessDispatcherFeatures() ? settingsService.getDelayAlertSettings().catch(() => null) : Promise.resolve(null)
      ]);

      if (workspace) {
        setCompanySettings({
          name: workspace.name || '',
          logo: workspace.logo || '',
          address: workspace.address || '',
          city: workspace.city || '',
          postalCode: workspace.postalCode || '',
          taxNumber: workspace.taxNumber || '',
          phoneNumber: workspace.phoneNumber || '',
          email: workspace.email || '',
          website: workspace.website || '',
          // Twilio/WhatsApp bilgileri
          twilioConnected: workspace.twilioConnected || false,
          twilioAccountSid: workspace.twilioAccountSid || '',
          twilioWhatsAppNumber: workspace.twilioWhatsAppNumber || '',
          twilioVerified: workspace.twilioVerified || false,
          twilioConnectedAt: workspace.twilioConnectedAt ? new Date(workspace.twilioConnectedAt) : null
        });
        
        setRegionalSettings(prev => ({
          ...prev,
          currency: workspace.currency || 'TRY',
          timezone: workspace.timeZone || 'Europe/Istanbul',
          language: (workspace.language?.toLowerCase() || 'tr') as 'tr' | 'en',
          dateFormat: workspace.dateFormat || 'DD/MM/YYYY',
          firstDayOfWeek: (workspace.firstDayOfWeek || 'monday') as 'monday' | 'sunday'
        }));
      }

      if (delivery) {
        setDeliverySettings({
          defaultServiceTime: delivery.defaultServiceTime,
          defaultSignatureRequired: delivery.defaultSignatureRequired || false, // YENİ
          defaultPhotoRequired: delivery.defaultPhotoRequired || false,      // YENİ
          workingHours: delivery.workingHours || deliverySettings.workingHours,
          prioritySettings: delivery.prioritySettings || deliverySettings.prioritySettings
        });
      }

      if (notifications) {
          setNotificationSettings({
              emailNotifications: notifications.emailNotifications,
              notificationEmail: notifications.notificationEmail || '',
              notificationPhone: notifications.notificationPhone || '',
              whatsAppSettings: notifications.whatsAppSettings || notificationSettings.whatsAppSettings,
              events: notifications.events || notificationSettings.events
          });

          // WhatsApp Mode'u ayarla
          if (notifications.whatsAppSettings?.mode) {
              setWhatsAppMode(notifications.whatsAppSettings.mode as any);
          }
      }

      if (delayAlerts) {
          setDelayAlertSettings({
              enabled: delayAlerts.enabled || false,
              thresholdHours: delayAlerts.thresholdHours || 1,
              alertEmails: delayAlerts.alertEmails || ''
          });
      }

    } catch (error: any) {
      console.error('Error loading settings:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Ayarlar yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Connect - Multi-tenant için Twilio Embedded Signup
  const handleConnectWhatsApp = async () => {
    setConnectingWhatsApp(true);
    try {
      const response = await settingsService.connectTwilioWhatsApp();
      
      if (response.signupUrl) {
        // Twilio signup sayfasını yeni sekmede aç
        const popup = window.open(
          response.signupUrl,
          'twilio-signup',
          'width=600,height=700,left=200,top=100'
        );

        // Popup'ı dinle
        const checkInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkInterval);
            checkTwilioStatus();
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('WhatsApp connect error:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'WhatsApp bağlantısı başlatılamadı';
      setError(errorMessage);
    } finally {
      setConnectingWhatsApp(false);
    }
  };

  // WhatsApp Disconnect
  const handleDisconnectWhatsApp = async () => {
    if (!confirm('WhatsApp bağlantısını kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    setDisconnectingWhatsApp(true);
    try {
      await settingsService.disconnectTwilioWhatsApp();
      
      setCompanySettings(prev => ({
        ...prev,
        twilioConnected: false,
        twilioAccountSid: '',
        twilioWhatsAppNumber: '',
        twilioVerified: false,
        twilioConnectedAt: null
      }));

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error: any) {
      console.error('WhatsApp disconnect error:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'WhatsApp bağlantısı kaldırılamadı';
      setError(errorMessage);
    } finally {
      setDisconnectingWhatsApp(false);
    }
  };

  // WhatsApp bağlantı durumunu kontrol et
  const checkTwilioStatus = async () => {
    try {
      const status = await settingsService.getTwilioStatus();
      setTwilioStatus(status);
      setCompanySettings(prev => ({
        ...prev,
        twilioConnected: status.connected,
        twilioWhatsAppNumber: status.phoneNumber || '',
        twilioVerified: status.connected,
        twilioConnectedAt: status.connectedAt
      }));
    } catch (error: any) {
      console.error('Error checking Twilio status:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Twilio durumu kontrol edilirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const promises = [];
      
      if (canAccessAdminFeatures() && availableTabs.includes('company')) {
        promises.push(
          settingsService.updateWorkspaceSettings({
            ...companySettings,
            currency: regionalSettings.currency,
            timeZone: regionalSettings.timezone,
            language: regionalSettings.language.toUpperCase(),
            dateFormat: regionalSettings.dateFormat,
            firstDayOfWeek: regionalSettings.firstDayOfWeek
          })
        );
      }
      
      if (canAccessDispatcherFeatures() && availableTabs.includes('delivery')) {
        promises.push(
          settingsService.updateDeliverySettings(deliverySettings)
        );
      }
      
      if (canAccessDispatcherFeatures() && availableTabs.includes('notifications')) {
        promises.push(
          settingsService.updateNotificationSettings({
            ...notificationSettings,
            whatsAppSettings: {
              ...notificationSettings.whatsAppSettings,
              mode: whatsAppMode
            }
          })
        );

        // Delay Alert Settings kaydet
        promises.push(
          settingsService.updateDelayAlertSettings(delayAlertSettings)
        );
      }

      await Promise.all(promises);
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Ayarlar kaydedilirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setSaving(false);
      setHasChanges(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanySettings({ ...companySettings, logo: reader.result as string });
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportSettings = () => {
    const settings = {
      company: companySettings,
      delivery: deliverySettings,
      notifications: notificationSettings,
      regional: regionalSettings
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `rotaapp-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const settings = JSON.parse(event.target?.result as string);
          if (settings.company) setCompanySettings(settings.company);
          if (settings.delivery) setDeliverySettings(prev => ({ ...prev, ...settings.delivery }));
          if (settings.notifications) setNotificationSettings(prev => ({ ...prev, ...settings.notifications }));
          if (settings.regional) setRegionalSettings(settings.regional);
          setHasChanges(true);
        } catch (error: any) {
          const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Geçersiz ayar dosyası!';
          alert(errorMessage);
        }
      };
      reader.readAsText(file);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Professional':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full">
            <Zap className="w-4 h-4" />
            Professional
          </span>
        );
      case 'Enterprise':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-sm font-medium rounded-full">
            <Crown className="w-4 h-4" />
            Enterprise
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm font-medium rounded-full">
            <Star className="w-4 h-4" />
            {plan}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600 mt-1">
            {canAccessDispatcherFeatures() && !canAccessAdminFeatures()
              ? 'Operasyonel ayarlarınız'
              : 'Sistem ve şirket ayarlarını yönetin'}
          </p>
        </div>
        
        {hasChanges && (
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">Ayarlar başarıyla kaydedildi!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'company', label: 'Şirket Bilgileri', icon: Building2 },
              { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
              { id: 'delivery', label: 'Teslimat Ayarları', icon: Truck },
              { id: 'notifications', label: 'Bildirimler', icon: Bell },
              { id: 'templates', label: 'Mesaj Şablonları', icon: FileText },
              { id: 'subscription', label: 'Abonelik', icon: CreditCard },
              { id: 'payment', label: 'Ödeme & Faturalama', icon: Crown },
              { id: 'regional', label: 'Bölgesel Ayarlar', icon: Globe }
            ].filter(item => availableTabs.includes(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Company Settings */}
            {activeTab === 'company' && availableTabs.includes('company') && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Şirket Bilgileri</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Logosu</label>
                    <div className="flex items-center gap-4">
                      {companySettings.logo ? (
                        <img src={companySettings.logo} alt="Logo" className="w-20 h-20 object-contain border rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                        >
                          Logo Yükle
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG veya SVG. Max 2MB.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Adı</label>
                    <input
                      type="text"
                      value={companySettings.name}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, name: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vergi Numarası</label>
                    <input
                      type="text"
                      value={companySettings.taxNumber}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, taxNumber: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <input
                      type="text"
                      value={companySettings.address}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, address: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                    <input
                      type="text"
                      value={companySettings.city}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, city: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Posta Kodu</label>
                    <input
                      type="text"
                      value={companySettings.postalCode}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, postalCode: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={companySettings.phoneNumber}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, phoneNumber: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, email: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Web Sitesi</label>
                    <input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, website: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="www.sirketiniz.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Users Management - Güncellenmiş */}
            {activeTab === 'users' && availableTabs.includes('users') && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
                  <button
                    onClick={handleAddMember}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Dispatcher Ekle
                  </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Kullanıcı Rolleri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Admin</span>
                      <p className="text-gray-700">Tüm sistem ayarları ve yönetim</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Dispatcher</span>
                      <p className="text-gray-700">Rota yönetimi, müşteriler, araçlar</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Sürücü</span>
                      <p className="text-gray-700">Sadece kendi rotaları (Sürücüler sayfasından eklenir)</p>
                    </div>
                  </div>
                </div>

                {loadingMembers ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.filter(m => !m.isDriver).map((member) => (
                      <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {member.fullName?.split(' ').map(n => n[0]).join('') || member.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{member.fullName || member.email}</p>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(member)}`}>
                                  {getRoleLabel(member)}
                                </span>
                                {!member.isRegistered && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                                    Davet Edildi
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!member.isAdmin && !member.isSuperAdmin && (
                              <button 
                                onClick={() => handleDeleteMember(member.id, member.fullName || member.email)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {members.filter(m => !m.isDriver).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Henüz kullanıcı eklenmemiş. Dispatcher ekleyerek başlayın.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Delivery Settings */}
            {activeTab === 'delivery' && availableTabs.includes('delivery') && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Teslimat Ayarları</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Bu ayarlar tüm yeni rotalara uygulanır</p>
                  <p>Varsayılan servis süresi ve çalışma saatlerini belirleyin.</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varsayılan Servis Süresi (dakika)
                </label>
                <input
                  type="number"
                  value={deliverySettings.defaultServiceTime}
                  onChange={(e) => {
                    setDeliverySettings({ ...deliverySettings, defaultServiceTime: parseInt(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Her teslimat noktasında geçirilecek ortalama süre</p>
              </div>
              
              {/* YENİ - Teslimat Kanıt Ayarları */}
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Teslimat Kanıt Ayarları</h3>
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-700">Varsayılan İmza Zorunluluğu</span>
                      <p className="text-sm text-gray-500 mt-1">Tüm yeni teslimatlar için imza zorunlu olsun</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={deliverySettings.defaultSignatureRequired}
                      onChange={(e) => {
                        setDeliverySettings({ 
                          ...deliverySettings, 
                          defaultSignatureRequired: e.target.checked 
                        });
                        setHasChanges(true);
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-700">Varsayılan Fotoğraf Zorunluluğu</span>
                      <p className="text-sm text-gray-500 mt-1">Tüm yeni teslimatlar için fotoğraf zorunlu olsun</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={deliverySettings.defaultPhotoRequired}
                      onChange={(e) => {
                        setDeliverySettings({ 
                          ...deliverySettings, 
                          defaultPhotoRequired: e.target.checked 
                        });
                        setHasChanges(true);
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-700">Ücretli Yollardan Kaçınma</span>
                      <p className="text-sm text-gray-500 mt-1">Rota optimizasyonunda ücretli yollardan varsayılan olarak kaçınılsın</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={deliverySettings.defaultAvoidTolls}
                      onChange={(e) => {
                        setDeliverySettings({
                          ...deliverySettings,
                          defaultAvoidTolls: e.target.checked
                        });
                        setHasChanges(true);
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-800">
                      <Info className="w-4 h-4 inline mr-1" />
                      Bu ayarlar yalnızca yeni oluşturulan rotalar için geçerlidir. Mevcut rotalar etkilenmez.
                      Her durak için ayrı ayrı da ayarlama yapabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Çalışma Saatleri</h3>
                  <div className="space-y-2">
                    {Object.entries(deliverySettings.workingHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          checked={hours.enabled}
                          onChange={(e) => {
                            setDeliverySettings({
                              ...deliverySettings,
                              workingHours: {
                                ...deliverySettings.workingHours,
                                [day]: { ...hours, enabled: e.target.checked }
                              }
                            });
                            setHasChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="w-24 font-medium text-gray-700 capitalize">
                          {day === 'monday' ? 'Pazartesi' : 
                          day === 'tuesday' ? 'Salı' : 
                          day === 'wednesday' ? 'Çarşamba' : 
                          day === 'thursday' ? 'Perşembe' : 
                          day === 'friday' ? 'Cuma' : 
                          day === 'saturday' ? 'Cumartesi' : 'Pazar'}
                        </span>
                        <input
                          type="time"
                          value={hours.start}
                          disabled={!hours.enabled}
                          onChange={(e) => {
                            setDeliverySettings({
                              ...deliverySettings,
                              workingHours: {
                                ...deliverySettings.workingHours,
                                [day]: { ...hours, start: e.target.value }
                              }
                            });
                            setHasChanges(true);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={hours.end}
                          disabled={!hours.enabled}
                          onChange={(e) => {
                            setDeliverySettings({
                              ...deliverySettings,
                              workingHours: {
                                ...deliverySettings.workingHours,
                                [day]: { ...hours, end: e.target.value }
                              }
                            });
                            setHasChanges(true);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Öncelik Ayarları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(deliverySettings.prioritySettings).map(([priority, settings]) => (
                      <div key={priority} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-900 capitalize">
                            {priority === 'high' ? 'Yüksek' : priority === 'normal' ? 'Normal' : 'Düşük'}
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={settings.color}
                              onChange={(e) => {
                                setDeliverySettings({
                                  ...deliverySettings,
                                  prioritySettings: {
                                    ...deliverySettings.prioritySettings,
                                    [priority]: { ...settings, color: e.target.value }
                                  }
                                });
                                setHasChanges(true);
                              }}
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Gecikme (dk)</label>
                          <input
                            type="number"
                            value={settings.maxDelay}
                            onChange={(e) => {
                              setDeliverySettings({
                                ...deliverySettings,
                                prioritySettings: {
                                  ...deliverySettings.prioritySettings,
                                  [priority]: { ...settings, maxDelay: parseInt(e.target.value) }
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings - MULTI-TENANT WhatsApp */}
            {activeTab === 'notifications' && availableTabs.includes('notifications') && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Bildirim Ayarları</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => {
                          setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked });
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">E-posta Bildirimleri</span>
                        <p className="text-sm text-gray-600">Önemli olaylar için e-posta alın</p>
                      </div>
                    </label>
                    
                    {notificationSettings.emailNotifications && (
                      <input
                        type="email"
                        value={notificationSettings.notificationEmail}
                        onChange={(e) => {
                          setNotificationSettings({ ...notificationSettings, notificationEmail: e.target.value });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="bildirim@sirket.com"
                      />
                    )}
                  </div>
                  
                </div>

                {/* WhatsApp Business Connect - HYBRID MODE */}
                <div className="border-t pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <Phone className="w-5 h-5 mr-2 text-green-600" />
                    WhatsApp Bildirimleri
                  </h3>
                  
                  {/* WhatsApp Mode Selector */}
                  <div className="mb-6 p-4 bg-white rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">WhatsApp Gönderim Modu</h4>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="disabled"
                          checked={whatsAppMode === 'disabled'}
                          onChange={(e) => {
                            setWhatsAppMode(e.target.value as any);
                            setHasChanges(true);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">WhatsApp Kullanma</div>
                          <div className="text-sm text-gray-600">Sadece email bildirimi gönder</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="shared"
                          checked={whatsAppMode === 'shared'}
                          onChange={(e) => {
                            setWhatsAppMode(e.target.value as any);
                            setHasChanges(true);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">YolPilot Numarasını Kullan</div>
                          <div className="text-sm text-gray-600">Hemen başlayın, kurulum gerektirmez</div>
                          <div className="text-xs text-green-600 mt-1">₺0.50/mesaj • Şirket adınız mesajda görünür</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="custom"
                          checked={whatsAppMode === 'custom'}
                          onChange={(e) => {
                            setWhatsAppMode(e.target.value as any);
                            setHasChanges(true);
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">Kendi Numaramı Kullan (Enterprise)</div>
                          <div className="text-sm text-gray-600">Kendi WhatsApp Business hesabınızı bağlayın</div>
                          <div className="text-xs text-blue-600 mt-1">Twilio hesabı gerektirir</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Custom mode seçiliyse mevcut Twilio bağlama UI'ını göster */}
                  {whatsAppMode === 'custom' && (
                    <>
                      {!companySettings.twilioConnected ? (
                        <div className="space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-900 mb-2">WhatsApp Business'ı Bağlayın</h4>
                            <p className="text-sm text-yellow-800 mb-3">
                              Kendi WhatsApp Business hesabınızı bağlamak için Twilio entegrasyonu gereklidir.
                            </p>
                            <button
                              onClick={handleConnectWhatsApp}
                              disabled={connectingWhatsApp}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              {connectingWhatsApp ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Bağlanıyor...
                                </>
                              ) : (
                                <>
                                  <Link className="w-4 h-4" />
                                  WhatsApp Business'ı Bağla
                                  <ExternalLink className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Mevcut bağlı durum UI'ı */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                                  <Check className="w-5 h-5" />
                                  WhatsApp Business Bağlı
                                </h4>
                                <div className="text-sm text-green-800 space-y-1">
                                  <p><strong>Numara:</strong> {companySettings.twilioWhatsAppNumber}</p>
                                  {companySettings.twilioConnectedAt && (
                                    <p><strong>Bağlantı Tarihi:</strong> {new Date(companySettings.twilioConnectedAt).toLocaleDateString('tr-TR')}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={handleDisconnectWhatsApp}
                                disabled={disconnectingWhatsApp}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                {disconnectingWhatsApp ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Kaldırılıyor...
                                  </>
                                ) : (
                                  <>
                                    <Unlink className="w-3 h-3" />
                                    Bağlantıyı Kaldır
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Shared mode seçiliyse bilgi mesajı göster */}
                  {whatsAppMode === 'shared' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        YolPilot WhatsApp Servisi Aktif
                      </h4>
                      <p className="text-sm text-green-800">
                        Müşterilerinize YolPilot'un resmi WhatsApp numarasından bildirim gönderilecek.
                        Mesajların başında şirket adınız görünecektir.
                      </p>
                    </div>
                  )}

                  {/* WhatsApp Event Settings - Her modda göster (disabled hariç) */}
                  {whatsAppMode !== 'disabled' && (
                    <>
                      <div className="space-y-3 mt-4">
                        <h4 className="text-sm font-medium text-gray-700">Hangi durumlarda WhatsApp gönderilsin?</h4>
                        
                        {/* Mevcut checkbox'lar aynı kalacak */}
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={notificationSettings.whatsAppSettings.enableWhatsAppForJourneyStart}
                            onChange={(e) => {
                              setNotificationSettings({
                                ...notificationSettings,
                                whatsAppSettings: {
                                  ...notificationSettings.whatsAppSettings,
                                  enableWhatsAppForJourneyStart: e.target.checked
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-gray-700">Sefer başladığında (Teslimatınız yola çıktı)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={notificationSettings.whatsAppSettings.enableWhatsAppForCheckIn}
                            onChange={(e) => {
                              setNotificationSettings({
                                ...notificationSettings,
                                whatsAppSettings: {
                                  ...notificationSettings.whatsAppSettings,
                                  enableWhatsAppForCheckIn: e.target.checked
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-gray-700">Teslimat yaklaştığında (30 dakika önce)</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={notificationSettings.whatsAppSettings.enableWhatsAppForCompletion}
                            onChange={(e) => {
                              setNotificationSettings({
                                ...notificationSettings,
                                whatsAppSettings: {
                                  ...notificationSettings.whatsAppSettings,
                                  enableWhatsAppForCompletion: e.target.checked
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-gray-700">Teslimat tamamlandığında</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={notificationSettings.whatsAppSettings.enableWhatsAppForFailure}
                            onChange={(e) => {
                              setNotificationSettings({
                                ...notificationSettings,
                                whatsAppSettings: {
                                  ...notificationSettings.whatsAppSettings,
                                  enableWhatsAppForFailure: e.target.checked
                                }
                              });
                              setHasChanges(true);
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-gray-700">Teslimat başarısız olduğunda</span>
                        </label>
                      </div>

                      {/* WhatsApp Usage Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mt-4">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">WhatsApp Kullanım Bilgisi</p>
                          <ul className="space-y-1">
                            {whatsAppMode === 'shared' ? (
                              <>
                                <li>• YolPilot'un resmi numarasından gönderim yapılır</li>
                                <li>• Mesajın başında şirket adınız görünür</li>
                                <li>• ₺0.50 per mesaj ücretlendirilir</li>
                                <li>• Kurulum gerektirmez, hemen başlayın</li>
                              </>
                            ) : (
                              <>
                                <li>• Kendi WhatsApp Business numaranızdan gönderim yapılır</li>
                                <li>• Twilio üzerinden kendi ücretlendirmeniz uygulanır</li>
                                <li>• Test için Twilio Sandbox kullanabilirsiniz</li>
                              </>
                            )}
                            <li>• Sadece onay veren müşterilere mesaj gönderilir</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Bildirim Olayları</h3>
                  <div className="space-y-3">
                    {Object.entries(notificationSettings.events).map(([event, enabled]) => (
                      <label key={event} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            setNotificationSettings({
                              ...notificationSettings,
                              events: {
                                ...notificationSettings.events,
                                [event]: e.target.checked
                              }
                            });
                            setHasChanges(true);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">
                          {event === 'routeCompleted' && 'Rota Tamamlandığında'}
                          {event === 'deliveryFailed' && 'Teslimat Başarısız Olduğunda'}
                          {event === 'driverDelayed' && 'Sürücü Geciktiğinde'}
                          {event === 'newCustomer' && 'Yeni Müşteri Eklendiğinde'}
                          {event === 'dailyReport' && 'Günlük Rapor'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delay Alert Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Gecikme Uyarıları
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800 mb-3">
                        Seferler planlanan tamamlanma saatinden geç tamamlandığında otomatik olarak yönetici emaillerine bildirim gönderilir.
                      </p>
                    </div>

                    {/* Enable/Disable */}
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={delayAlertSettings.enabled}
                        onChange={(e) => {
                          setDelayAlertSettings({ ...delayAlertSettings, enabled: e.target.checked });
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Gecikme Uyarılarını Aktif Et</span>
                        <p className="text-sm text-gray-600">Gecikmiş seferler için otomatik email bildirimi gönder</p>
                      </div>
                    </label>

                    {delayAlertSettings.enabled && (
                      <>
                        {/* Threshold Hours */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gecikme Eşiği (Saat)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={delayAlertSettings.thresholdHours}
                            onChange={(e) => {
                              setDelayAlertSettings({
                                ...delayAlertSettings,
                                thresholdHours: Math.max(1, parseInt(e.target.value) || 1)
                              });
                              setHasChanges(true);
                            }}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="1"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Sefer bu kadar saat veya daha fazla gecikirse uyarı gönderilir
                          </p>
                        </div>

                        {/* Alert Emails */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bildirim Gönderilecek Email Adresleri
                          </label>
                          <textarea
                            value={delayAlertSettings.alertEmails}
                            onChange={(e) => {
                              setDelayAlertSettings({ ...delayAlertSettings, alertEmails: e.target.value });
                              setHasChanges(true);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            rows={3}
                            placeholder="admin@company.com, manager@company.com, dispatcher@company.com"
                          />
                          <p className="text-sm text-gray-600 mt-1">
                            Birden fazla email adresi için virgülle ayırın
                          </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Email İçeriği</p>
                            <ul className="space-y-1">
                              <li>• Sefer detayları (ID, ad, sürücü)</li>
                              <li>• Planlanan ve gerçekleşen tamamlanma zamanı</li>
                              <li>• Gecikme süresi (saat ve dakika)</li>
                              <li>• Sefer detaylarına direkt link</li>
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Notification Role Settings */}
                <div className="border-t pt-6">
                  <NotificationRoleSettings />
                </div>
              </div>
            )}

            {/* Message Templates */}
            {activeTab === 'templates' && availableTabs.includes('templates') && (
              <TemplateEditor />
            )}

            {/* Subscription Info */}
            {activeTab === 'subscription' && availableTabs.includes('subscription') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-semibold text-gray-900">Abonelik Bilgileri</h2>
                {subscriptionData && getPlanBadge(subscriptionData.currentPlan)}
              </div>
              
              {loadingSubscription ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : billingData ? (
                <>
                  {/* Plan Özeti */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Mevcut Plan</span>
                        <Crown className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{billingData.plan.name}</p>
                      <p className="text-sm text-gray-600 mt-1">₺{billingData.plan.monthlyPrice}/ay</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Fatura Dönemi</span>
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(billingData.summary.billingPeriod.end).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Sonraki fatura tarihi</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Tahmini Tutar</span>
                        <CreditCard className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">₺{billingData.summary.estimatedTotal}</p>
                      <p className="text-sm text-gray-600 mt-1">Bu ay</p>
                    </div>
                  </div>

                  {/* Kullanım Detayları */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Kullanım Detayları</h3>
                    <div className="space-y-4">
                      {/* Teslimat Noktaları */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">Teslimat Noktaları</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {billingData.usage.stops.used} / {billingData.usage.stops.included}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              billingData.usage.stops.used > billingData.usage.stops.included 
                                ? 'bg-red-600' 
                                : 'bg-blue-600'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (billingData.usage.stops.used / billingData.usage.stops.included) * 100)}%` 
                            }}
                          />
                        </div>
                        {billingData.usage.stops.extra > 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            +{billingData.usage.stops.extra} ekstra nokta × ₺{billingData.usage.stops.extraUnitPrice} = ₺{billingData.usage.stops.extraCharges}
                          </p>
                        )}
                      </div>

                      {/* WhatsApp Mesajları */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            <span className="font-medium">WhatsApp Mesajları</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {billingData.usage.whatsApp.used} / {billingData.usage.whatsApp.included}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              billingData.usage.whatsApp.used > billingData.usage.whatsApp.included 
                                ? 'bg-red-600' 
                                : 'bg-green-600'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (billingData.usage.whatsApp.used / billingData.usage.whatsApp.included) * 100)}%` 
                            }}
                          />
                        </div>
                        {billingData.usage.whatsApp.extra > 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            +{billingData.usage.whatsApp.extra} ekstra mesaj × ₺{billingData.usage.whatsApp.extraUnitPrice} = ₺{billingData.usage.whatsApp.extraCharges}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan Özellikleri */}
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Plan Özellikleri</h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{subscriptionData?.limits.includedMonthlyStops} teslimat noktası/ay</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{subscriptionData?.limits.includedWhatsAppMessages} WhatsApp mesajı/ay</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{subscriptionData?.limits.maxDrivers} sürücü</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">Gerçek zamanlı takip</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">API erişimi</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Planı Yükselt
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Fatura Geçmişi
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Abonelik bilgileri yüklenemedi
                </div>
              )}
            </div>
          )}

            {/* Regional Settings */}
            {activeTab === 'payment' && availableTabs.includes('payment') && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Ödeme & Faturalama</h2>
                  <button
                    onClick={() => setShowUpgradePlan(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Planı Yükselt
                  </button>
                </div>

                {/* Trial Banner */}
                <TrialBanner 
                  onUpgradeClick={() => setShowUpgradePlan(true)}
                  className="mb-6"
                />

                {/* Payment Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Usage Statistics */}
                  <div className="lg:col-span-2">
                    <UsageStats />
                  </div>
                  
                  {/* Payment History */}
                  <div className="lg:col-span-2">
                    <PaymentHistory />
                  </div>
                </div>

                {/* Upgrade Plan Modal */}
                {showUpgradePlan && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                      <UpgradePlan 
                        onClose={() => setShowUpgradePlan(false)}
                        currentPlan={trialStatus?.isActive ? 'Trial' : 'Starter'}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'regional' && availableTabs.includes('regional') && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Bölgesel Ayarlar</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
                    <select
                      value={regionalSettings.language}
                      onChange={(e) => {
                        setRegionalSettings({ ...regionalSettings, language: e.target.value as 'tr' | 'en' });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zaman Dilimi</label>
                    <select
                      value={regionalSettings.timezone}
                      onChange={(e) => {
                        setRegionalSettings({ ...regionalSettings, timezone: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Europe/Istanbul">İstanbul (GMT+3)</option>
                      <option value="Europe/London">Londra (GMT+0)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
                    <select
                      value={regionalSettings.currency}
                      onChange={(e) => {
                        setRegionalSettings({ ...regionalSettings, currency: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Formatı</label>
                    <select
                      value={regionalSettings.dateFormat}
                      onChange={(e) => {
                        setRegionalSettings({ ...regionalSettings, dateFormat: e.target.value });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DD/MM/YYYY">GG/AA/YYYY (28/02/2024)</option>
                      <option value="MM/DD/YYYY">AA/GG/YYYY (02/28/2024)</option>
                      <option value="YYYY-MM-DD">YYYY-AA-GG (2024-02-28)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Haftanın İlk Günü</label>
                    <select
                      value={regionalSettings.firstDayOfWeek}
                      onChange={(e) => {
                        setRegionalSettings({ ...regionalSettings, firstDayOfWeek: e.target.value as 'monday' | 'sunday' });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monday">Pazartesi</option>
                      <option value="sunday">Pazar</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      
      {/* Delete Confirm Modal */}
{deleteConfirmModal.show && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Kullanıcı Silme Onayı
      </h3>
      
      <div className="mb-4">
        <p className="text-gray-700 mb-2">
          <strong>{deleteConfirmModal.memberName}</strong> kullanıcısını silmek üzeresiniz.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Bu işlem geri alınamaz! Kullanıcı kalıcı olarak silinecektir.
          </p>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Onaylamak için aşağıya <strong>SİL</strong> yazın:
        </p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="SİL"
        />
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={confirmDelete}
          disabled={deleteConfirmText !== 'SİL'}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Kullanıcıyı Sil
        </button>
        <button
          onClick={() => {
            setDeleteConfirmModal({ show: false, memberId: '', memberName: '' });
            setDeleteConfirmText('');
            setError(null);
          }}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  </div>
)}
      
      {/* Member Modal - Güncellenmiş */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Yeni Dispatcher Ekle
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={newMember.fullName}
                  onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ornek@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                <input
                  type="password"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={newMember.phoneNumber}
                  onChange={(e) => setNewMember({ ...newMember, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0532 XXX XX XX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depo</label>
                <select
                  value={newMember.depotId || ''}
                  onChange={(e) => setNewMember({ ...newMember, depotId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Depo Seçin (Opsiyonel)</option>
                  {depots.map(depot => (
                    <option key={depot.id} value={depot.id}>{depot.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <Info className="w-4 h-4 inline mr-1" />
                  Dispatcher sisteme giriş yapabilecek ve rota yönetimi yapabilecek.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveMember}
                disabled={savingMember}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingMember ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  'Dispatcher Oluştur'
                )}
              </button>
              <button
                onClick={() => setShowMemberModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;