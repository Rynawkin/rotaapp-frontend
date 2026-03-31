import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Bug,
  Car,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  MapPinOff,
  Menu,
  Package,
  Search,
  Settings,
  Shield,
  User,
  UserCheck,
  Users,
  Warehouse,
  X,
  type LucideIcon
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
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: string | null;
  roles?: string[];
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(false);
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const userInfo = useMemo(() => getUserInfo(), []);

  const getUserRole = (): string => {
    if (userInfo.isSuperAdmin) return 'superadmin';
    if (userInfo.isAdmin) return 'admin';
    if (userInfo.isDispatcher) return 'dispatcher';
    if (userInfo.isDriver) return 'driver';
    return 'user';
  };

  const currentRole = getUserRole();

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationMenuOpen(false);
  }, [location.pathname]);

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

    checkPendingLocationRequests();

    if (userInfo.isAdmin || userInfo.isDispatcher || userInfo.isSuperAdmin) {
      intervalId = setInterval(checkPendingLocationRequests, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userInfo.isAdmin, userInfo.isDispatcher, userInfo.isSuperAdmin]);

  useEffect(() => {
    const loadUsageData = async () => {
      try {
        const billingData = await subscriptionService.getBillingSummary();
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

        setUsageData(usage);

        if (usage.planType === 'Trial') {
          setShowTrialBanner(
            usage.currentMonthStops >= usage.includedMonthlyStops ||
              usage.currentMonthWhatsAppMessages >= usage.includedWhatsAppMessages
          );
        } else {
          setShowTrialBanner(false);
        }
      } catch (error) {
        console.error('Error loading usage data:', error);
        setShowTrialBanner(false);
      }
    };

    loadUsageData();
  }, [userInfo.email]);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        if (userInfo.isDispatcher || userInfo.isAdmin || userInfo.isSuperAdmin) {
          const routesResponse = await routeService.getAll();
          setRouteCount(Array.isArray(routesResponse) ? routesResponse.length : 0);

          const customersResponse = await customerService.getAll();
          setCustomerCount(Array.isArray(customersResponse) ? customersResponse.length : 0);
        }

        const journeysResponse = await journeyService.getAllSummary();
        setJourneyCount(Array.isArray(journeysResponse) ? journeysResponse.length : 0);

        const notificationsResponse = await notificationService.getAll();
        setNotifications(Array.isArray(notificationsResponse) ? notificationsResponse : []);

        const unreadCount = await notificationService.getUnreadCount();
        setUnreadNotificationCount(unreadCount);
      } catch (error) {
        console.error('Error loading sidebar counts:', error);
      }
    };

    loadCounts();
  }, [userInfo.isDispatcher, userInfo.isAdmin, userInfo.isSuperAdmin]);

  const allMenuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['driver', 'dispatcher', 'admin', 'superadmin'] },
    { icon: MapPin, label: 'Rotalar', path: '/routes', badge: routeCount > 0 ? routeCount.toString() : null, roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: Users, label: 'Müşteriler', path: '/customers', badge: customerCount > 0 ? customerCount.toString() : null, roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: UserCheck, label: 'Sürücüler', path: '/drivers', roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: Car, label: 'Araçlar', path: '/vehicles', roles: ['driver', 'dispatcher', 'admin', 'superadmin'] },
    { icon: Warehouse, label: 'Depolar', path: '/depots', roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: Package, label: 'Seferler', path: '/journeys', badge: journeyCount > 0 ? journeyCount.toString() : null, roles: ['driver', 'dispatcher', 'admin', 'superadmin'] },
    { icon: MapPinOff, label: 'Konum Talepleri', path: '/location-requests', badge: pendingLocationRequests > 0 ? pendingLocationRequests.toString() : null, roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: FileText, label: 'Raporlar', path: '/reports', roles: ['driver', 'dispatcher', 'admin', 'superadmin'] },
    { icon: Settings, label: 'Ayarlar', path: '/settings', roles: ['dispatcher', 'admin', 'superadmin'] },
    { icon: Shield, label: 'Super Admin', path: '/super-admin', badge: 'SUPER', roles: ['superadmin'] },
    { icon: Bug, label: 'Sorun Bildirimleri', path: '/superadmin/issues', roles: ['superadmin'] },
    { icon: Users, label: "Marketing Lead'leri", path: '/superadmin/marketing-leads', roles: ['superadmin'] }
  ];

  const menuItems = allMenuItems.filter((item) => (item.roles ? item.roles.includes(currentRole) : true));

  const displayNotifications = [...notifications];
  if (pendingLocationRequests > 0) {
    displayNotifications.unshift({
      id: 999,
      title: `${pendingLocationRequests} bekleyen konum talebi var`,
      message: `${pendingLocationRequests} mobil uygulamadan gelen konum talebi inceleme bekliyor.`,
      type: 'warning',
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: 'current-user'
    });
  }

  const getCurrentPageTitle = () => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return 'Dashboard';
    const currentItem = menuItems.find((item) => item.path !== '/' && location.pathname.startsWith(item.path));
    return currentItem?.label || 'YolPilot';
  };

  const getSearchPlaceholder = () => {
    if (location.pathname.startsWith('/routes')) return 'Rota, araç veya sürücü ara...';
    if (location.pathname.startsWith('/customers')) return 'Müşteri veya yetkili kişi ara...';
    if (location.pathname.startsWith('/drivers')) return 'Sürücü, telefon veya araç ara...';
    if (location.pathname.startsWith('/vehicles')) return 'Plaka, model veya sürücü ara...';
    if (location.pathname.startsWith('/depots')) return 'Depo, şehir veya sorumlu kişi ara...';
    if (location.pathname.startsWith('/journeys')) return 'Sefer no, rota veya araç ara...';
    if (location.pathname.startsWith('/location-requests')) return 'Talep, müşteri veya konum ara...';
    if (location.pathname.startsWith('/reports')) return 'Raporlarda ara...';
    if (location.pathname.startsWith('/settings')) return 'Ayar kategorilerinde ara...';
    return 'YolPilot içinde ara...';
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('workspaceId');

    if (api?.defaults?.headers) {
      delete api.defaults.headers.common.Authorization;
    }

    window.location.href = '/login';
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    navigate('/settings');
  };

  const handleNotificationClick = async (notificationId: string | number) => {
    if (notificationId === 999) {
      setNotificationMenuOpen(false);
      navigate('/location-requests');
      return;
    }

    if (typeof notificationId === 'string') {
      try {
        await notificationService.markAsRead(notificationId);
        setNotifications(await notificationService.getAll());
        setUnreadNotificationCount(await notificationService.getUnreadCount());
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(await notificationService.getAll());
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getRoleDisplayName = () => {
    if (userInfo.isSuperAdmin) return 'SaaS Yönetici';
    if (userInfo.isAdmin) return 'Firma Yöneticisi';
    if (userInfo.isDispatcher) return 'Operasyon Yöneticisi';
    if (userInfo.isDriver) return 'Sürücü';
    return 'Kullanıcı';
  };

  const getRoleBadgeTone = () => {
    if (userInfo.isSuperAdmin) return 'bg-violet-100 text-violet-700 ring-violet-200';
    if (userInfo.isAdmin) return 'bg-blue-100 text-blue-700 ring-blue-200';
    if (userInfo.isDispatcher) return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    if (userInfo.isDriver) return 'bg-amber-100 text-amber-700 ring-amber-200';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  const getUserInitials = () => {
    const source = userInfo.fullName || userInfo.email || 'YP';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('');
  };

  const mainOffsetClass = sidebarOpen ? 'lg:pl-[17.5rem]' : 'lg:pl-[7.5rem]';

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-900">
      {mobileMenuOpen && (
        <button type="button" className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-white/5 bg-[var(--app-sidebar)] text-slate-200 shadow-2xl transition-all duration-300 ${
          sidebarOpen ? 'w-[17.5rem]' : 'w-[7.5rem]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-5 py-5">
          <Link to="/" className={`flex items-center gap-3 ${sidebarOpen ? '' : 'w-full justify-center'}`} onClick={() => setMobileMenuOpen(false)}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-inner shadow-white/10 ring-1 ring-white/10">
              <img src="/yolpilot-logo.png" alt="YolPilot" className="h-7 w-7 object-contain" />
            </div>
            {sidebarOpen && (
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.18em] text-white">YolPilot</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">Operasyon Paneli</div>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 lg:inline-flex"
              title={sidebarOpen ? 'Menüyü daralt' : 'Menüyü genişlet'}
            >
              <Menu className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {menuItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' || location.pathname === '/dashboard' : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`group relative flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-[var(--app-sidebar-soft)] text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isActive ? 'bg-white/10 text-white' : 'bg-transparent text-slate-400 group-hover:text-white'}`}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  {sidebarOpen && <span>{item.label}</span>}
                </div>

                {sidebarOpen && item.badge && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                      item.badge === 'SUPER'
                        ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20'
                        : item.path === '/location-requests' && pendingLocationRequests > 0
                        ? 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/20'
                        : 'bg-white/10 text-slate-200 ring-1 ring-white/5'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {!sidebarOpen && item.badge && (
                  <span className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${item.path === '/location-requests' && pendingLocationRequests > 0 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/6 p-4">
          <div className={`rounded-2xl border border-white/6 bg-white/5 p-3 ${sidebarOpen ? '' : 'flex justify-center'}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/10">
                {getUserInitials()}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userInfo.fullName || userInfo.email}</p>
                  <p className="truncate text-xs text-slate-400">{getRoleDisplayName()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className={`min-h-screen transition-all duration-300 ${mainOffsetClass}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-4 lg:px-6">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="inline-flex rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-[280px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-sm md:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-700 shadow-none ring-0 placeholder:text-slate-400 focus:ring-0"
                placeholder={getSearchPlaceholder()}
              />
            </div>

            <div className="ml-auto flex items-center gap-2 lg:gap-3">
              <div className="hidden lg:block">
                <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getRoleBadgeTone()}`}>
                  {getRoleDisplayName()}
                </span>
              </div>

              <div className="relative">
                <button type="button" onClick={() => setNotificationMenuOpen((prev) => !prev)} className="relative inline-flex rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                  <Bell className="h-5 w-5" />
                  {(unreadNotificationCount > 0 || pendingLocationRequests > 0) && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
                </button>

                {notificationMenuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-10" onClick={() => setNotificationMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-3 w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">Bildirimler</p>
                          <p className="text-xs text-slate-500">Operasyon akışındaki güncellemeler</p>
                        </div>
                        <button type="button" onClick={handleMarkAllAsRead} className="text-xs font-semibold text-slate-500 transition hover:text-slate-800">
                          Tümünü oku
                        </button>
                      </div>
                      <div className="max-h-[380px] overflow-y-auto">
                        {displayNotifications.length > 0 ? (
                          displayNotifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification.id)}
                              className={`flex w-full flex-col gap-1 border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${!notification.isRead ? 'bg-blue-50/60' : 'bg-white'}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-950' : 'font-medium text-slate-800'}`}>{notification.title}</p>
                                {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                              </div>
                              <p className="text-xs leading-5 text-slate-500">{notification.message}</p>
                              <p className="text-[11px] font-medium text-slate-400">
                                {notification.id === 999
                                  ? 'Şimdi'
                                  : new Date(notification.createdAt).toLocaleString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit'
                                    })}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="px-5 py-10 text-center">
                            <Bell className="mx-auto h-9 w-9 text-slate-300" />
                            <p className="mt-3 text-sm font-medium text-slate-500">Henüz bildirim yok</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button type="button" onClick={() => setUserMenuOpen((prev) => !prev)} className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                  <div className="hidden text-right lg:block">
                    <p className="text-sm font-semibold text-slate-900">{userInfo.fullName || userInfo.email}</p>
                    <p className="text-xs text-slate-500">{getCurrentPageTitle()}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">{getUserInitials()}</div>
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 lg:block" />
                </button>

                {userMenuOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <p className="text-sm font-semibold text-slate-950">{userInfo.fullName || userInfo.email}</p>
                        <p className="mt-1 text-xs text-slate-500">{userInfo.email}</p>
                        <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getRoleBadgeTone()}`}>{getRoleDisplayName()}</span>
                      </div>

                      {(userInfo.isDispatcher || userInfo.isAdmin || userInfo.isSuperAdmin) && (
                        <button type="button" onClick={handleProfileClick} className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                          <User className="h-4 w-4 text-slate-500" />
                          Profil ve Ayarlar
                        </button>
                      )}

                      {userInfo.isSuperAdmin && (
                        <>
                          <Link to="/super-admin" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                            <Shield className="h-4 w-4 text-slate-500" />
                            Super Admin Panel
                          </Link>
                          <Link to="/superadmin/issues" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                            <Bug className="h-4 w-4 text-slate-500" />
                            Sorun Bildirimleri
                          </Link>
                          <Link to="/superadmin/marketing-leads" className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                            <Users className="h-4 w-4 text-slate-500" />
                            Marketing Lead'leri
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-100 p-2">
                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                          <LogOut className="h-4 w-4" />
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {showTrialBanner && usageData && (
          <div className="mx-auto mt-4 max-w-[1600px] px-4 lg:px-6">
            <div className="flex flex-col gap-3 rounded-[26px] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-amber-100 p-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Trial limitinize yaklaştınız</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {usageData.currentMonthStops}/{usageData.includedMonthlyStops} durak ve {usageData.currentMonthWhatsAppMessages}/{usageData.includedWhatsAppMessages} WhatsApp mesajı kullanıldı.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowUpgradePlanModal(true)} className="app-button-accent">
                  Plan Yükselt
                </button>
                <button type="button" onClick={() => setShowTrialBanner(false)} className="app-button-secondary">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-[1600px] space-y-6">{children}</div>
        </main>
      </div>

      {showUpgradePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-2 shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
            <UpgradePlan onClose={() => setShowUpgradePlanModal(false)} currentPlan={usageData?.planType as any} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
