import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2,
  Users,
  Bell,
  Truck,
  CreditCard,
  Palette,
  Globe,
  Database,
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
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { 
  routeService, 
  customerService, 
  driverService, 
  vehicleService,
  journeyService 
} from '@/services/mockData';

interface CompanySettings {
  name: string;
  logo?: string;
  address: string;
  city: string;
  postalCode: string;
  taxNumber: string;
  phone: string;
  email: string;
  website?: string;
}

interface DeliverySettings {
  defaultServiceTime: number;
  maxDeliveriesPerRoute: number;
  workingHours: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
  prioritySettings: {
    high: { color: string; maxDelay: number };
    normal: { color: string; maxDelay: number };
    low: { color: string; maxDelay: number };
  };
  autoOptimize: boolean;
  trafficConsideration: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  notificationEmail: string;
  notificationPhone: string;
  events: {
    routeCompleted: boolean;
    deliveryFailed: boolean;
    driverDelayed: boolean;
    newCustomer: boolean;
    dailyReport: boolean;
  };
}

interface ThemeSettings {
  darkMode: boolean;
  showLogo: boolean;
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

interface RegionalSettings {
  language: 'tr' | 'en';
  timezone: string;
  currency: string;
  dateFormat: string;
  firstDayOfWeek: 'monday' | 'sunday';
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator' | 'driver';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

// Gerçek kullanım verilerini hesapla
const calculateUsageLimits = async () => {
  const [customers, drivers, vehicles, routes, journeys] = await Promise.all([
    customerService.getAll(),
    driverService.getAll(), 
    vehicleService.getAll(),
    routeService.getAll(),
    journeyService.getAll()
  ]);

  // Bu ayın teslimat sayısını hesapla
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyDeliveries = routes
    .filter(r => {
      const routeDate = new Date(r.date);
      return routeDate.getMonth() === currentMonth && 
             routeDate.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + r.completedDeliveries, 0);

  // Kullanıcı sayısını localStorage'dan al
  const savedSettings = localStorage.getItem('appSettings');
  let userCount = 4; // varsayılan
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    userCount = settings.users?.length || 4;
  }

  return {
    users: { used: userCount, total: 25 },
    drivers: { used: drivers.length, total: 50 },
    vehicles: { used: vehicles.length, total: 30 },
    monthlyDeliveries: { used: monthlyDeliveries, total: 5000 },
    storage: { used: 2.3, total: 10 } // GB - mock
  };
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'delivery' | 'notifications' | 'subscription' | 'theme' | 'regional' | 'data'>('company');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState<any>(null);

  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'RotaApp Lojistik A.Ş.',
    address: 'Atatürk Cad. No:123',
    city: 'İstanbul',
    postalCode: '34000',
    taxNumber: '1234567890',
    phone: '0212 123 45 67',
    email: 'info@rotaapp.com',
    website: 'www.rotaapp.com'
  });

  // Users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Admin Kullanıcı', email: 'admin@rotaapp.com', role: 'admin', status: 'active', createdAt: '2024-01-01', lastLogin: '2024-02-28 14:30' },
    { id: '2', name: 'Mehmet Yönetici', email: 'mehmet@rotaapp.com', role: 'manager', status: 'active', createdAt: '2024-01-15', lastLogin: '2024-02-28 09:15' },
    { id: '3', name: 'Ayşe Operatör', email: 'ayse@rotaapp.com', role: 'operator', status: 'active', createdAt: '2024-01-20', lastLogin: '2024-02-27 16:45' },
    { id: '4', name: 'Ali Sürücü', email: 'ali@rotaapp.com', role: 'driver', status: 'active', createdAt: '2024-02-01' }
  ]);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  // Delivery Settings - Varsayılan değerler belirli
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    defaultServiceTime: 15,
    maxDeliveriesPerRoute: 50,
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
    autoOptimize: true, // Varsayılan değer
    trafficConsideration: true // Varsayılan değer
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    notificationEmail: 'bildirim@rotaapp.com',
    notificationPhone: '0532 123 45 67',
    events: {
      routeCompleted: true,
      deliveryFailed: true,
      driverDelayed: true,
      newCustomer: false,
      dailyReport: true
    }
  });

  // Theme Settings - Simplified
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    darkMode: false,
    showLogo: true,
    sidebarCollapsed: false,
    fontSize: 'medium'
  });

  // Regional Settings
  const [regionalSettings, setRegionalSettings] = useState<RegionalSettings>({
    language: 'tr',
    timezone: 'Europe/Istanbul',
    currency: 'TRY',
    dateFormat: 'DD/MM/YYYY',
    firstDayOfWeek: 'monday'
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.company) setCompanySettings(settings.company);
      if (settings.delivery) {
        // autoOptimize ve trafficConsideration'ın undefined olmamasını sağla
        setDeliverySettings({
          ...deliverySettings,
          ...settings.delivery,
          autoOptimize: settings.delivery.autoOptimize ?? true,
          trafficConsideration: settings.delivery.trafficConsideration ?? true
        });
      }
      if (settings.notifications) setNotificationSettings(settings.notifications);
      if (settings.theme) {
        // Yeni theme yapısına uyumlu hale getir
        setThemeSettings({
          darkMode: settings.theme.darkMode || false,
          showLogo: settings.theme.showLogo !== false,
          sidebarCollapsed: settings.theme.sidebarCollapsed || false,
          fontSize: settings.theme.fontSize || 'medium'
        });
      }
      if (settings.regional) setRegionalSettings(settings.regional);
      if (settings.users) setUsers(settings.users);
    }
  }, []);

  // Apply theme settings to document
  useEffect(() => {
    applyThemeSettings();
  }, [themeSettings]);

  // Load subscription limits
  useEffect(() => {
    loadSubscriptionLimits();
  }, [users, activeTab]);

  const loadSubscriptionLimits = async () => {
    if (activeTab === 'subscription') {
      const limits = await calculateUsageLimits();
      setSubscriptionLimits(limits);
    }
  };

  const applyThemeSettings = () => {
    const root = document.documentElement;
    const body = document.body;
    
    // Dark mode
    if (themeSettings.darkMode) {
      body.classList.add('dark');
      // Dark mode colors
      body.style.backgroundColor = '#111827';
      root.style.setProperty('--bg-primary', '#1F2937');
      root.style.setProperty('--bg-secondary', '#111827');
      root.style.setProperty('--text-primary', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#D1D5DB');
      root.style.setProperty('--border-color', '#374151');
      
      // Update all white backgrounds to dark
      document.querySelectorAll('.bg-white').forEach(el => {
        (el as HTMLElement).style.backgroundColor = '#1F2937';
      });
      document.querySelectorAll('.text-gray-900').forEach(el => {
        (el as HTMLElement).style.color = '#F9FAFB';
      });
      document.querySelectorAll('.text-gray-700').forEach(el => {
        (el as HTMLElement).style.color = '#D1D5DB';
      });
    } else {
      body.classList.remove('dark');
      // Light mode colors
      body.style.backgroundColor = '#F9FAFB';
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F9FAFB');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6B7280');
      root.style.setProperty('--border-color', '#E5E7EB');
      
      // Reset to original colors
      document.querySelectorAll('[style*="background-color"]').forEach(el => {
        if ((el as HTMLElement).style.backgroundColor === 'rgb(31, 41, 55)') {
          (el as HTMLElement).style.backgroundColor = '';
        }
      });
      document.querySelectorAll('[style*="color"]').forEach(el => {
        const element = el as HTMLElement;
        if (element.style.color === 'rgb(249, 250, 251)' || 
            element.style.color === 'rgb(209, 213, 219)') {
          element.style.color = '';
        }
      });
    }
    
    // Font size
    const fontSizes = {
      small: '14px',
      medium: '16px', 
      large: '18px'
    };
    body.style.fontSize = fontSizes[themeSettings.fontSize];
    root.style.setProperty('--font-size-base', fontSizes[themeSettings.fontSize]);
    
    // Apply font size to specific elements
    const baseFontSize = parseInt(fontSizes[themeSettings.fontSize]);
    
    // Headers
    document.querySelectorAll('h1').forEach(el => {
      (el as HTMLElement).style.fontSize = `${baseFontSize * 1.875}px`;
    });
    document.querySelectorAll('h2').forEach(el => {
      (el as HTMLElement).style.fontSize = `${baseFontSize * 1.5}px`;
    });
    document.querySelectorAll('h3').forEach(el => {
      (el as HTMLElement).style.fontSize = `${baseFontSize * 1.25}px`;
    });
    
    // Text elements
    document.querySelectorAll('p, span, div').forEach(el => {
      if (!(el as HTMLElement).style.fontSize) {
        (el as HTMLElement).style.fontSize = fontSizes[themeSettings.fontSize];
      }
    });
  };

  // Save settings to localStorage
  const saveSettings = async () => {
    setSaving(true);
    
    const settings = {
      company: companySettings,
      delivery: deliverySettings,
      notifications: notificationSettings,
      theme: themeSettings,
      regional: regionalSettings,
      users: users
    };
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    setSaving(false);
    setHasChanges(false);
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // User Management Functions
  const handleAddUser = () => {
    setEditingUser({
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'operator',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setModalMode('add');
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setModalMode('edit');
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    
    if (modalMode === 'add') {
      setUsers([...users, editingUser]);
    } else {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    }
    
    setShowUserModal(false);
    setEditingUser(null);
    setHasChanges(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      setUsers(users.filter(u => u.id !== userId));
      setHasChanges(true);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
    setHasChanges(true);
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
      theme: themeSettings,
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
          if (settings.delivery) setDeliverySettings(settings.delivery);
          if (settings.notifications) setNotificationSettings(settings.notifications);
          if (settings.theme) {
            // Yeni theme yapısına uyumlu hale getir
            setThemeSettings({
              darkMode: settings.theme.darkMode || false,
              showLogo: settings.theme.showLogo !== false,
              sidebarCollapsed: settings.theme.sidebarCollapsed || false,
              fontSize: settings.theme.fontSize || 'medium'
            });
          }
          if (settings.regional) setRegionalSettings(settings.regional);
          setHasChanges(true);
        } catch (error) {
          alert('Geçersiz ayar dosyası!');
        }
      };
      reader.readAsText(file);
    }
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'operator': return 'bg-green-100 text-green-700';
      case 'driver': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Yönetici';
      case 'operator': return 'Operatör';
      case 'driver': return 'Sürücü';
      default: return role;
    }
  };

  const getRoleDescription = (role: User['role']) => {
    switch (role) {
      case 'admin': 
        return 'Tüm sistem ayarlarını yönetebilir, kullanıcı ekleyip silebilir, abonelik işlemlerini yapabilir';
      case 'manager': 
        return 'Rotaları yönetebilir, raporları görüntüleyebilir, sürücü ve araç ataması yapabilir';
      case 'operator': 
        return 'Rota oluşturabilir, müşteri ekleyebilir, teslimatları takip edebilir';
      case 'driver': 
        return 'Sadece kendine atanan rotaları görüntüleyebilir, teslimat durumlarını güncelleyebilir';
      default: 
        return '';
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600 mt-1">Sistem ve şirket ayarlarını yönetin</p>
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

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700">Ayarlar başarıyla kaydedildi!</span>
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
              { id: 'subscription', label: 'Abonelik', icon: CreditCard },
              { id: 'theme', label: 'Tema & Görünüm', icon: Palette },
              { id: 'regional', label: 'Bölgesel Ayarlar', icon: Globe },
              { id: 'data', label: 'Veri Yönetimi', icon: Database }
            ].map((item) => (
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
            {activeTab === 'company' && (
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
                      value={companySettings.phone}
                      onChange={(e) => {
                        setCompanySettings({ ...companySettings, phone: e.target.value });
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

            {/* Users Management */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Kullanıcı Ekle
                  </button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Kullanım: {users.length} / 25 kullanıcı</p>
                    <p>Daha fazla kullanıcı eklemek için planınızı yükseltebilirsiniz.</p>
                  </div>
                </div>

                {/* Rol Açıklamaları */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Kullanıcı Rolleri ve Yetkileri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Admin</span>
                      <p className="text-gray-700">Tüm sistem ayarları, kullanıcı ve abonelik yönetimi</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Yönetici</span>
                      <p className="text-gray-700">Rota yönetimi, raporlar, sürücü ve araç ataması</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Operatör</span>
                      <p className="text-gray-700">Rota oluşturma, müşteri yönetimi, teslimat takibi</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Sürücü</span>
                      <p className="text-gray-700">Kendi rotalarını görüntüleme, teslimat güncelleme</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <span 
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
                                title={getRoleDescription(user.role)}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                              {user.status === 'inactive' && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                  Pasif
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.lastLogin && (
                              <p className="text-xs text-gray-500 mt-1">Son giriş: {user.lastLogin}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleUserStatus(user.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            {user.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Settings */}
            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Teslimat Ayarları</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Bu ayarlar tüm yeni rotalara uygulanır</p>
                    <p>Öncelik ve gecikme süreleri rota optimizasyonunda kullanılır.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rota Başına Max Teslimat
                    </label>
                    <input
                      type="number"
                      value={deliverySettings.maxDeliveriesPerRoute}
                      onChange={(e) => {
                        setDeliverySettings({ ...deliverySettings, maxDeliveriesPerRoute: parseInt(e.target.value) });
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!deliverySettings.autoOptimize}
                        onChange={(e) => {
                          setDeliverySettings({ ...deliverySettings, autoOptimize: e.target.checked });
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Otomatik Optimizasyon</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!deliverySettings.trafficConsideration}
                        onChange={(e) => {
                          setDeliverySettings({ ...deliverySettings, trafficConsideration: e.target.checked });
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Trafik Durumunu Dikkate Al</span>
                    </label>
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
                        <span className="w-24 font-medium text-gray-700 capitalize">{day === 'monday' ? 'Pazartesi' : day === 'tuesday' ? 'Salı' : day === 'wednesday' ? 'Çarşamba' : day === 'thursday' ? 'Perşembe' : day === 'friday' ? 'Cuma' : day === 'saturday' ? 'Cumartesi' : 'Pazar'}</span>
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

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
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
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => {
                          setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked });
                          setHasChanges(true);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">SMS Bildirimleri</span>
                        <p className="text-sm text-gray-600">Kritik durumlar için SMS alın</p>
                      </div>
                    </label>
                    
                    {notificationSettings.smsNotifications && (
                      <input
                        type="tel"
                        value={notificationSettings.notificationPhone}
                        onChange={(e) => {
                          setNotificationSettings({ ...notificationSettings, notificationPhone: e.target.value });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="05xx xxx xx xx"
                      />
                    )}
                  </div>
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
              </div>
            )}

            {/* Subscription Info */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Abonelik Bilgileri</h2>
                  {getPlanBadge('Professional')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Abonelik Durumu</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Aktif</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">Professional</p>
                    <p className="text-sm text-gray-600 mt-1">Aylık ödeme</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Sonraki Fatura</span>
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">15 Mart 2024</p>
                    <p className="text-sm text-gray-600 mt-1">17 gün kaldı</p>
                  </div>
                </div>
                
                {subscriptionLimits && (
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-3">Kullanım Limitleri (Gerçek Veriler)</h3>
                    <div className="space-y-3">
                      {Object.entries(subscriptionLimits).map(([key, limit]: [string, any]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">
                              {key === 'users' && 'Kullanıcılar'}
                              {key === 'drivers' && 'Sürücüler'}
                              {key === 'vehicles' && 'Araçlar'}
                              {key === 'monthlyDeliveries' && 'Aylık Teslimatlar'}
                              {key === 'storage' && 'Depolama (GB)'}
                            </span>
                            <span className="text-sm text-gray-600">
                              {limit.used} / {limit.total}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                (limit.used / limit.total) * 100 > 80
                                  ? 'bg-red-500'
                                  : (limit.used / limit.total) * 100 > 60
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (limit.used / limit.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-3">Plan Özellikleri</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {['Sınırsız rota oluşturma', 'Gerçek zamanlı takip', 'API erişimi', 'Öncelikli destek', 'Gelişmiş raporlama'].map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
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
              </div>
            )}

            {/* Theme Settings - SIMPLIFIED */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Tema & Görünüm</h2>
                
                <div className="space-y-6">
                  {/* Dark Mode */}
                  <div className="border rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        {themeSettings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        <div>
                          <span className="font-medium text-gray-900">Karanlık Mod</span>
                          <p className="text-sm text-gray-600">Göz yorgunluğunu azaltır</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={themeSettings.darkMode}
                          onChange={(e) => {
                            setThemeSettings({ ...themeSettings, darkMode: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </label>
                  </div>

                  {/* Font Size */}
                  <div className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Font Boyutu</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setThemeSettings({ ...themeSettings, fontSize: size });
                            setHasChanges(true);
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                            themeSettings.fontSize === size
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Seçili: {themeSettings.fontSize === 'small' ? 'Küçük (14px)' : themeSettings.fontSize === 'medium' ? 'Orta (16px)' : 'Büyük (18px)'}
                    </p>
                  </div>

                  {/* Logo Display */}
                  <div className="border rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-medium text-gray-900">Logo Göster</span>
                        <p className="text-sm text-gray-600">Sidebar'da şirket logosu gösterilsin</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={themeSettings.showLogo}
                          onChange={(e) => {
                            setThemeSettings({ ...themeSettings, showLogo: e.target.checked });
                            setHasChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </label>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <Info className="w-4 h-4 inline mr-2" />
                    Tema değişiklikleri anında uygulanır ve tüm kullanıcıları etkiler.
                  </p>
                </div>
              </div>
            )}

            {/* Regional Settings */}
            {activeTab === 'regional' && (
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

            {/* Data Management */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">Veri Yönetimi</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Download className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Ayarları Dışa Aktar</h3>
                        <p className="text-sm text-gray-600">JSON formatında indir</p>
                      </div>
                    </div>
                    <button
                      onClick={exportSettings}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Ayarları İndir
                    </button>
                  </div>
                  
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Ayarları İçe Aktar</h3>
                        <p className="text-sm text-gray-600">JSON dosyasından yükle</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="hidden"
                      id="import-settings"
                    />
                    <label
                      htmlFor="import-settings"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block text-center"
                    >
                      Dosya Seç
                    </label>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Otomatik Yedekleme</p>
                      <p>Verileriniz günlük olarak otomatik yedeklenmektedir. Son yedekleme: Bugün 03:00</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalMode === 'add' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcı Düzenle'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Rol</label>
                <div className="space-y-3">
                  {(['admin', 'manager', 'operator', 'driver'] as User['role'][]).map((role) => (
                    <label 
                      key={role}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        editingUser.role === role ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={editingUser.role === role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{getRoleLabel(role)}</div>
                        <div className="text-sm text-gray-600 mt-1">{getRoleDescription(role)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modalMode === 'add' ? 'Ekle' : 'Güncelle'}
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
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