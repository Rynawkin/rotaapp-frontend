// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
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
  Shield
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
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
      name: 'Admin Kullanıcı', 
      role: 'admin', 
      email: 'admin@rotaapp.com',
      isSuperAdmin: false
    };
  };

  const userInfo = getUserInfo();

  // SUPER ADMIN KONTROLÜ
  const isSuperAdmin = userInfo.email === 'super@rotaapp.com' || userInfo.isSuperAdmin === true;

  // Menu items
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', badge: null },
    { icon: Route, label: 'Rotalar', path: '/routes', badge: '3' },
    { icon: MapPin, label: 'Müşteriler', path: '/customers', badge: '125' },
    { icon: UserCheck, label: 'Sürücüler', path: '/drivers', badge: null },
    { icon: Car, label: 'Araçlar', path: '/vehicles', badge: null },
    { icon: Warehouse, label: 'Depolar', path: '/depots', badge: null },
    { icon: Package, label: 'Seferler', path: '/journeys', badge: '5' },
    { icon: Navigation, label: 'Canlı Takip', path: '/tracking', badge: 'CANLI' },
    { icon: FileText, label: 'Raporlar', path: '/reports', badge: null },
    { icon: Settings, label: 'Ayarlar', path: '/settings', badge: null },
    ...(isSuperAdmin ? [
      { icon: Shield, label: 'Super Admin', path: '/super-admin', badge: 'SUPER' }
    ] : [])
  ];

  const notifications = [
    { id: 1, title: 'Yeni rota oluşturuldu', time: '5 dk önce', unread: true },
    { id: 2, title: 'Sürücü Ali Yılmaz sefere başladı', time: '15 dk önce', unread: true },
    { id: 3, title: 'Haftalık rapor hazır', time: '1 saat önce', unread: false },
  ];

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.label || 'Dashboard';
  };

  const handleLogout = () => {
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.removeItem('user');
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    // Profil sayfası yoksa settings'e yönlendir
    navigate('/settings');
  };

  const handleNotificationClick = (notificationId: number) => {
    console.log('Notification clicked:', notificationId);
    setNotificationMenuOpen(false);
    // Bildirime göre yönlendirme yapılabilir
  };

  // Rol isimlendirmesi
  const getRoleDisplayName = () => {
    if (isSuperAdmin) return 'SaaS Yönetici';
    if (userInfo.role === 'admin') return 'Firma Yöneticisi';
    if (userInfo.role === 'manager') return 'Operasyon Müdürü';
    if (userInfo.role === 'driver') return 'Sürücü';
    return 'Kullanıcı';
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
          <div className="flex items-center justify-between p-4 border-b">
            <Link 
              to="/" 
              className={`flex items-center ${!sidebarOpen && 'justify-center'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Route className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <span className="ml-3 text-xl font-bold text-gray-800">RotaApp</span>
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
                             location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-colors group
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-blue-50 hover:text-blue-600 text-gray-700'
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
                        : 'bg-gray-100 text-gray-600'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                  {!sidebarOpen && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t p-4">
            <div className={`flex items-center ${!sidebarOpen && 'justify-center'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSuperAdmin 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <User className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-700">{userInfo.name}</p>
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
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 ml-2 lg:ml-0">
                {getCurrentPageTitle()}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center space-x-6 mr-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-gray-600">3 Aktif Sefer</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">5 Planlanmış Rota</span>
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {notificationMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setNotificationMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border py-2 z-20">
                      <div className="px-4 py-2 border-b">
                        <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(notification => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id)}
                            className={`w-full px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 ${
                              notification.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <p className={`text-sm ${notification.unread ? 'font-semibold' : ''} text-gray-900`}>
                                {notification.title}
                              </p>
                              {notification.unread && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t">
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          Tümünü Gör
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isSuperAdmin 
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                        <p className="text-xs text-gray-500">{userInfo.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                          isSuperAdmin 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getRoleDisplayName()}
                        </span>
                      </div>
                      <button
                        onClick={handleProfileClick}
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-left"
                      >
                        <User className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm text-gray-700">Profil & Ayarlar</span>
                      </button>
                      {isSuperAdmin && (
                        <Link 
                          to="/super-admin" 
                          className="flex items-center px-4 py-2 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-700">Super Admin</span>
                        </Link>
                      )}
                      <hr className="my-1" />
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

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;