// src/layouts/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Route, 
  Users, 
  Navigation, 
  UserCheck,
  Warehouse,
  MapPin,
  FileText,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Car,
  Package,
  Settings,
  Shield,
  Bug,
  MapPinOff,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/services/api';
import { routeService } from '@/services/route.service';
import { customerService } from '@/services/customer.service';
import { journeyService } from '@/services/journey.service';
import { notificationService, Notification } from '@/services/notification.service';
import { subscriptionService, UsageData } from '@/services/subscription.service';
import { UpgradePlan } from '@/components/payment/UpgradePlan';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: string | null;
  roles?: string[]; // Hangi roller erişebilir
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [pendingLocationRequests, setPendingLocationRequests] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [journeyCount, setJourneyCount] = useState(0);
  const [activeJourneyCount, setActiveJourneyCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing user info:', error);
    }
    return { 
      fullName: 'Kullanıcı', 
      email: 'user@rotaapp.com',
      isAdmin: false,
      isDispatcher: false,
      isDriver: false,
      isSuperAdmin: false,
      planType: 'Trial'
    };
  };

  const userInfo = getUserInfo();

  // Kullanıcının rolünü belirle
  const getUserRole = (): string => {
    if (userInfo.isSuperAdmin) return 'superadmin';
    if (userInfo.isAdmin) return 'admin';
    if (userInfo.isDispatcher) return 'dispatcher';
    if (userInfo.isDriver) return 'driver';
    return 'user';
  };

  const currentRole = getUserRole();

  // Bekleyen konum güncelleme taleplerini kontrol et
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkPendingLocationRequests = async () => {
      if (userInfo.isAdmin || userInfo.isDispatcher || userInfo.isSuperAdmin) {
        try {
          const response = await api.get('/workspace/location-update-requests/pending');
          setPendingLocationRequests(response.data.length || 0);
        } catch (error) {
          console.error('Error fetching pending location requests:', error);
          setPendingLocationRequests(0);
        }
      }
    };

    // İlk yükleme
    checkPendingLocationRequests();

    // Her 30 saniyede bir kontrol et
    if (userInfo.isAdmin || userInfo.isDispatcher || userInfo.isSuperAdmin) {
      intervalId = setInterval(checkPendingLocationRequests, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userInfo.isAdmin, userInfo.isDispatcher, userInfo.isSuperAdmin]);

  // Trial usage verilerini yükle
  useEffect(() => {
    const loadUsageData = async () => {
      console.log('Loading usage data for user:', userInfo);
      
      // Her kullanıcı için usage verilerini al (plan type'ı backend'den gelecek)
      try {
        // Settings sayfasının çalışan yöntemini kullan
        const billingData = await subscriptionService.getBillingSummary();
        console.log('Billing data received:', billingData);
        
        // billingData'dan UsageData formatına çevir
        const usage = {
          workspaceId: 0,
          workspaceName: '',
          planType: billingData.plan.name,
          includedMonthlyStops: billingData.usage.stops.included,
          currentMonthStops: billingData.usage.stops.used,
          remainingStops: billingData.usage.stops.included - billingData.usage.stops.used,
          includedWhatsAppMessages: billingData.usage.whatsApp.included,
          currentMonthWhatsAppMessages: billingData.usage.whatsApp.used,
          remainingWhatsAppMessages: billingData.usage.whatsApp.included - billingData.usage.whatsApp.used,
          currentMonthAdditionalCharges: billingData.summary.additionalCharges,
          estimatedMonthlyTotal: billingData.summary.estimatedTotal,
          lastResetDate: billingData.summary.billingPeriod.start,
          nextResetDate: billingData.summary.billingPeriod.end
        };
        
        console.log('Converted usage data:', usage);
        setUsageData(usage);
        
        // Trial kullanıcıları için banner kontrolü
        if (usage.planType === 'Trial') {
          const shouldShowBanner = (
            usage.currentMonthStops >= usage.includedMonthlyStops ||
            usage.currentMonthWhatsAppMessages >= usage.includedWhatsAppMessages
          );
          console.log('Trial banner should show:', shouldShowBanner, {
            stops: `${usage.currentMonthStops}/${usage.includedMonthlyStops}`,
            whatsApp: `${usage.currentMonthWhatsAppMessages}/${usage.includedWhatsAppMessages}`
          });
          setShowTrialBanner(shouldShowBanner);
        } else {
          console.log('Not a trial user, hiding banner. Plan type:', usage.planType);
          setShowTrialBanner(false);
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
        setShowTrialBanner(false);
      }
    };

    loadUsageData();
  }, [userInfo.email]); // userInfo.email dependency to trigger when user changes

  // Sidebar sayıları için API verilerini yükle
  useEffect(() => {
    const loadCounts = async () => {
      try {
        // Kullanıcı yetkisine göre veri yükle
        if (userInfo.isDispatcher || userInfo.isAdmin || userInfo.isSuperAdmin) {
          // Rotalar count
          const routesResponse = await routeService.getAll();
          const routes = Array.isArray(routesResponse) ? routesResponse : [];
          setRouteCount(routes.length);

          // Müşteriler count
          const customersResponse = await customerService.getAll();
          const customers = Array.isArray(customersResponse) ? customersResponse : [];
          setCustomerCount(customers.length);
        }

        // Seferler count (tüm roller için)
        const journeysResponse = await journeyService.getAllSummary();
        const journeys = Array.isArray(journeysResponse) ? journeysResponse : [];
        setJourneyCount(journeys.length);

        // Aktif seferler count (InTransit status olanlar)
        const activeJourneys = journeys.filter(journey => 
          journey.status === 'InTransit' || journey.status === 'InProgress'
        );
        setActiveJourneyCount(activeJourneys.length);

        // Bildirimler
        const notificationsResponse = await notificationService.getAll();
        const notificationsList = Array.isArray(notificationsResponse) ? notificationsResponse : [];
        setNotifications(notificationsList);

        // Okunmamış bildirim sayısı
        const unreadCount = await notificationService.getUnreadCount();
        setUnreadNotificationCount(unreadCount);

      } catch (error) {
        console.error('Error loading sidebar counts:', error);
        // Hata durumunda 0 olarak kalsın
      }
    };

    loadCounts();
  }, [userInfo.isDispatcher, userInfo.isAdmin, userInfo.isSuperAdmin]);

  // Tüm menü öğeleri ve hangi roller erişebilir
  const allMenuItems: MenuItem[] = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/', 
      badge: null,
      roles: ['driver', 'dispatcher', 'admin', 'superadmin'] // Herkes erişebilir
    },
    { 
      icon: Route, 
      label: 'Rotalar', 
      path: '/routes', 
      badge: routeCount > 0 ? routeCount.toString() : null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez
    },
    { 
      icon: MapPin, 
      label: 'Müşteriler', 
      path: '/customers', 
      badge: customerCount > 0 ? customerCount.toString() : null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez
    },
    { 
      icon: UserCheck, 
      label: 'Sürücüler', 
      path: '/drivers', 
      badge: null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez
    },
    { 
      icon: Car, 
      label: 'Araçlar', 
      path: '/vehicles', 
      badge: null,
      roles: ['driver', 'dispatcher', 'admin', 'superadmin'] // Herkes erişebilir
    },
    { 
      icon: Warehouse, 
      label: 'Depolar', 
      path: '/depots', 
      badge: null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez
    },
    { 
      icon: Package, 
      label: 'Seferler', 
      path: '/journeys', 
      badge: journeyCount > 0 ? journeyCount.toString() : null,
      roles: ['driver', 'dispatcher', 'admin', 'superadmin'] // Herkes erişebilir
    },
    { 
      icon: MapPinOff, 
      label: 'Konum Talepleri', 
      path: '/location-requests', 
      badge: pendingLocationRequests > 0 ? pendingLocationRequests.toString() : null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Sadece yöneticiler
    },
    // { 
    //   icon: Navigation, 
    //   label: 'Canlı Takip', 
    //   path: '/tracking', 
    //   badge: 'CANLI',
    //   roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez (kendi konumunu paylaşır ama takip edemez)
    // },
    { 
      icon: FileText, 
      label: 'Raporlar', 
      path: '/reports', 
      badge: null,
      roles: ['driver', 'dispatcher', 'admin', 'superadmin'] // Herkes erişebilir (kendi raporlarını görür)
    },
    { 
      icon: Settings, 
      label: 'Ayarlar', 
      path: '/settings', 
      badge: null,
      roles: ['dispatcher', 'admin', 'superadmin'] // Driver erişemez artık (tema kaldırıldı)
    },
    { 
      icon: Shield, 
      label: 'Super Admin', 
      path: '/super-admin', 
      badge: 'SUPER',
      roles: ['superadmin'] // Sadece Super Admin
    },
    {
      icon: Bug,
      label: 'Sorun Bildirimleri',
      path: '/superadmin/issues',
      badge: null,
      roles: ['superadmin'] // Sadece Super Admin
    },
    {
      icon: Users,
      label: 'Marketing Lead\'leri',
      path: '/superadmin/marketing-leads',
      badge: null,
      roles: ['superadmin'] // Sadece Super Admin
    }
  ];

  // Kullanıcının rolüne göre menüleri filtrele
  const menuItems = allMenuItems.filter(item => 
    item.roles ? item.roles.includes(currentRole) : true
  );

  // Bekleyen konum talepleri varsa bildirim ekle
  const displayNotifications = [...(notifications || [])];
  if (pendingLocationRequests > 0) {
    displayNotifications.unshift({
      id: 999,
      title: `${pendingLocationRequests} bekleyen konum güncelleme talebi var`,
      message: `${pendingLocationRequests} bekleyen konum güncelleme talebi bulunuyor.`,
      type: 'warning' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: 'current-user'
    });
  }

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.label || 'Dashboard';
  };

  // Logout handler
  const handleLogout = () => {
    // onLogout prop'u varsa onu kullan (AuthContext'ten gelen logout)
    if (onLogout) {
      onLogout();
    } else {
      // Fallback olarak manuel temizleme
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('workspaceId');
      
      // API header'ını temizle
      if (api && api.defaults && api.defaults.headers) {
        delete api.defaults.headers.common['Authorization'];
      }
      
      // Login sayfasına yönlendir
      window.location.href = '/login';
    }
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/settings');
  };

  const handleNotificationClick = async (notificationId: string | number) => {
    console.log('Notification clicked:', notificationId);
    
    // Konum talebi bildirimine tıklandıysa yönlendir ve menüyü kapat
    if (notificationId === 999) {
      setNotificationMenuOpen(false);
      navigate('/location-requests');
      return;
    }

    // Bildirimi okundu olarak işaretle (menü açık kalır)
    if (typeof notificationId === 'string') {
      try {
        await notificationService.markAsRead(notificationId);
        // Bildirimleri yeniden yükle
        const updatedNotifications = await notificationService.getAll();
        setNotifications(updatedNotifications);
        
        // Okunmamış sayısını güncelle
        const unreadCount = await notificationService.getUnreadCount();
        setUnreadNotificationCount(unreadCount);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      // Bildirimleri yeniden yükle
      const updatedNotifications = await notificationService.getAll();
      setNotifications(updatedNotifications);
      
      // Okunmamış sayısını sıfırla
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Rol isimlendirmesi
  const getRoleDisplayName = () => {
    if (userInfo.isSuperAdmin) return 'SaaS Yönetici';
    if (userInfo.isAdmin) return 'Firma Yöneticisi';
    if (userInfo.isDispatcher) return 'Operasyon Müdürü';
    if (userInfo.isDriver) return 'Sürücü';
    return 'Kullanıcı';
  };

  // Rol renkleri
  const getRoleColor = () => {
    if (userInfo.isSuperAdmin) return 'from-purple-500 to-purple-600';
    if (userInfo.isAdmin) return 'from-blue-500 to-blue-600';
    if (userInfo.isDispatcher) return 'from-green-500 to-green-600';
    if (userInfo.isDriver) return 'from-orange-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getRoleBadgeColor = () => {
    if (userInfo.isSuperAdmin) return 'bg-purple-100 text-purple-800';
    if (userInfo.isAdmin) return 'bg-blue-100 text-blue-800';
    if (userInfo.isDispatcher) return 'bg-green-100 text-green-800';
    if (userInfo.isDriver) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-xl transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link 
              to="/" 
              className={`flex items-center ${!sidebarOpen ? 'justify-center w-full' : 'flex-1'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {sidebarOpen ? (
                <div className="flex items-center justify-center w-full">
                  <img
                    src="/yolpilot-logo.png"
                    alt="YolPilot"
                    className="h-20 w-auto max-w-[240px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <img
                    src="/yolpilot-logo.png"
                    alt="YolPilot"
                    className="h-16 w-16 object-contain"
                  />
                </div>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 hidden lg:block"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-primary-50 text-primary-600' 
                      : 'hover:bg-gray-50 text-gray-700 hover:text-primary-600'
                    }
                  `}
                  title={!sidebarOpen ? item.label : ''}
                >
                  <div className="flex items-center">
                    <item.icon className={`${sidebarOpen ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
                    {sidebarOpen && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </div>
                  {sidebarOpen && item.badge && (
                    <span className={`
                      px-2 py-1 text-xs font-semibold rounded-full
                      ${item.badge === 'CANLI' 
                        ? 'bg-green-100 text-green-600 animate-pulse' 
                        : item.badge === 'SUPER'
                        ? 'bg-purple-100 text-purple-600'
                        : item.path === '/location-requests' && pendingLocationRequests > 0
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                  {!sidebarOpen && item.badge && (
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      item.path === '/location-requests' && pendingLocationRequests > 0
                        ? 'bg-orange-600 animate-pulse'
                        : 'bg-primary-600'
                    }`}></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRoleColor()}`}>
                <User className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {userInfo.fullName || userInfo.email}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title={sidebarOpen ? 'Menüyü Daralt' : 'Menüyü Genişlet'}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 ml-2">
                {getCurrentPageTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {(notifications.some(n => !n.isRead) || pendingLocationRequests > 0) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {notificationMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setNotificationMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {displayNotifications.length > 0 ? (
                          displayNotifications.map(notification => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification.id)}
                              className={`w-full px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0 ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''} text-gray-900`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.id === 999 
                                  ? 'Şimdi' 
                                  : new Date(notification.createdAt).toLocaleString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit'
                                    })
                                }
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Henüz bildirim bulunmuyor</p>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200">
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Tümünü Oku
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${getRoleColor()}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">
                          {userInfo.fullName || userInfo.email}
                        </p>
                        <p className="text-xs text-gray-500">{userInfo.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor()}`}>
                          {getRoleDisplayName()}
                        </span>
                      </div>
                      {(userInfo.isDispatcher || userInfo.isAdmin || userInfo.isSuperAdmin) && (
                        <button
                          onClick={handleProfileClick}
                          className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-left"
                        >
                          <User className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-700">Profil & Ayarlar</span>
                        </button>
                      )}
                      {userInfo.isSuperAdmin && (
                        <>
                          <Link 
                            to="/super-admin" 
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-sm text-gray-700">Super Admin Panel</span>
                          </Link>
                          <Link
                            to="/superadmin/issues"
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Bug className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-sm text-gray-700">Sorun Bildirimleri</span>
                          </Link>
                          <Link
                            to="/superadmin/marketing-leads"
                            className="flex items-center px-4 py-2 hover:bg-gray-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Users className="w-4 h-4 mr-2 text-gray-600" />
                            <span className="text-sm text-gray-700">Marketing Lead'leri</span>
                          </Link>
                        </>
                      )}
                      <hr className="my-1 border-gray-200" />
                      <button 
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 w-full text-left text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span className="text-sm">Çıkış Yap</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Trial Limit Banner */}
        {console.log('Rendering banner:', { showTrialBanner, usageData })}
        {showTrialBanner && usageData && (
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
                <div className="text-white">
                  <p className="font-medium text-sm">
                    Trial limitiniz doldu: {usageData.currentMonthStops}/{usageData.includedMonthlyStops} durak, {usageData.currentMonthWhatsAppMessages}/{usageData.includedWhatsAppMessages} WhatsApp mesajı kullanıldı
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUpgradePlanModal(true)}
                  className="bg-white text-orange-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
                >
                  Plan Yükselt
                </button>
                <button
                  onClick={() => setShowTrialBanner(false)}
                  className="text-white hover:text-orange-100 transition-colors"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Upgrade Plan Modal */}
      {showUpgradePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UpgradePlan 
              onClose={() => setShowUpgradePlanModal(false)}
              currentPlan={usageData?.planType as any}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;