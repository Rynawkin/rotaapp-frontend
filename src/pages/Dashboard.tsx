import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Truck, 
  MapPin,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Package,
  Calendar,
  Activity,
  BarChart3,
  Route,
  Loader2
} from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { driverService } from '@/services/driver.service';
import { journeyService, JourneySummary } from '@/services/journey.service';
import { routeService } from '@/services/route.service';
import { Customer, Driver, Route as RouteType } from '@/types';
import { useAuth } from '@/contexts/AuthContext'; // ✅ DOĞRU IMPORT

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [todayRoutes, setTodayRoutes] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [journeySummaries, setJourneySummaries] = useState<JourneySummary[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const navigate = useNavigate();
  
  // ✅ ROL KONTROLÜ İÇİN AUTH HOOK
  const { user, canAccessDispatcherFeatures } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [];
      
      // ✅ ROL BAZLI VERİ YÜKLEME
      // Dispatcher yetkisi olanlar customer ve driver verilerini çekebilir
      if (canAccessDispatcherFeatures()) {
        promises.push(
          customerService.getAll().then(data => {
            setCustomers(data);
            return data;
          }).catch(err => {
            console.log('Müşteri verileri yüklenemedi (yetki gerekebilir)');
            setCustomers([]);
            return [];
          }),
          driverService.getAll().then(data => {
            setDrivers(data);
            return data;
          }).catch(err => {
            console.log('Sürücü verileri yüklenemedi (yetki gerekebilir)');
            setDrivers([]);
            return [];
          })
        );
      } else {
        // Driver rolü için boş array set et
        setCustomers([]);
        setDrivers([]);
      }

      // Journey ve Route verileri tüm roller için yüklenebilir
      // Backend zaten rol bazlı filtreleme yapıyor
      promises.push(
        journeyService.getAllSummary().then(data => {
          setJourneySummaries(data);
          return data;
        }).catch(err => {
          console.log('Journey verileri yüklenemedi');
          setJourneySummaries([]);
          return [];
        }),
        routeService.getAll().then(data => {
          setRoutes(data);
          return data;
        }).catch(err => {
          console.log('Route verileri yüklenemedi');
          setRoutes([]);
          return [];
        })
      );

      const results = await Promise.allSettled(promises);
      
      // Başarılı sonuçları al
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      // İstatistikleri hesapla
      const customersData = canAccessDispatcherFeatures() && successfulResults[0] ? successfulResults[0] : [];
      const driversData = canAccessDispatcherFeatures() && successfulResults[1] ? successfulResults[1] : [];
      const journeysData = canAccessDispatcherFeatures() ? successfulResults[2] || [] : successfulResults[0] || [];
      const routesData = canAccessDispatcherFeatures() ? successfulResults[3] || [] : successfulResults[1] || [];

      calculateStats(customersData, driversData, journeysData, routesData);
      filterTodayRoutes(routesData, journeysData, driversData);
      generateRecentActivities(journeysData, routesData);
      calculateWeeklyData(journeysData);

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (
    customers: Customer[], 
    drivers: Driver[], 
    journeySummaries: JourneySummary[], 
    routes: RouteType[]
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugünkü journey'leri filtrele
    const todayJourneys = journeySummaries.filter(j => {
      const journeyDate = new Date(j.startedAt || j.createdAt);
      journeyDate.setHours(0, 0, 0, 0);
      return journeyDate.getTime() === today.getTime();
    });

    // ✅ Özet verilerden hesaplama - Detay yok!
    const completedDeliveries = journeySummaries.reduce((total, j) => {
      return total + j.completedStops;
    }, 0);

    const totalDeliveries = journeySummaries.reduce((total, j) => {
      return total + j.totalStops;
    }, 0);

    // Aktif (available) sürücüleri say
    const activeDrivers = drivers.filter(d => d.status === 'available').length;

    // Ortalama teslimat süresini hesapla (dakika)
    const averageTime = journeySummaries.length > 0 
      ? journeySummaries.reduce((sum, j) => sum + j.totalDuration, 0) / journeySummaries.length
      : 0;

    // ✅ ROL BAZLI İSTATİSTİKLER
    const statsData = [];
    
    // Toplam teslimat - Tüm roller görebilir
    statsData.push({
      title: 'Toplam Teslimat',
      value: totalDeliveries.toString(),
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'blue',
      subtitle: 'Bu ay'
    });

    // Müşteri sayısı - Sadece dispatcher ve üzeri
    if (canAccessDispatcherFeatures()) {
      statsData.push({
        title: 'Aktif Müşteri',
        value: customers.length.toString(),
        change: '+5%',
        trend: 'up',
        icon: Users,
        color: 'green',
        subtitle: 'Toplam'
      });
    }

    // Aktif sürücü - Sadece dispatcher ve üzeri
    if (canAccessDispatcherFeatures()) {
      statsData.push({
        title: 'Aktif Sürücü',
        value: activeDrivers.toString(),
        change: '0%',
        trend: 'neutral',
        icon: Truck,
        color: 'purple',
        subtitle: 'Bugün'
      });
    }

    // Ortalama teslimat süresi - Tüm roller görebilir
    statsData.push({
      title: 'Ortalama Teslimat Süresi',
      value: averageTime > 0 ? `${Math.round(averageTime)} dk` : '0 dk',
      change: '-8%',
      trend: 'down',
      icon: Clock,
      color: 'orange',
      subtitle: 'Bu hafta'
    });

    // Driver rolü için ek istatistik
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      const myJourneys = journeySummaries.filter(j => j.driverId === user.id);
      statsData.push({
        title: 'Benim Seferlerim',
        value: myJourneys.length.toString(),
        change: '0%',
        trend: 'neutral',
        icon: Navigation,
        color: 'indigo',
        subtitle: 'Bugün'
      });
    }

    setStats(statsData);
  };

  const filterTodayRoutes = (
    routes: RouteType[], 
    journeySummaries: JourneySummary[], 
    drivers: Driver[]
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugünkü rotaları filtrele
    let todayRoutesData = routes
      .filter(route => {
        const routeDate = new Date(route.date);
        routeDate.setHours(0, 0, 0, 0);
        return routeDate.getTime() === today.getTime();
      });

    // ✅ Driver rolü için sadece kendi rotalarını göster
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      todayRoutesData = todayRoutesData.filter(route => 
        route.driverId === user.id || route.driver?.id === user.id
      );
    }

    const mappedRoutes = todayRoutesData
      .map(route => {
        // ✅ Summary'den journey bilgisi al
        const journey = journeySummaries.find(j => j.routeId === Number(route.id));
        const driver = drivers.find(d => d.id === Number(route.driverId));
        
        // İlerleme yüzdesini hesapla
        const progress = journey 
          ? Math.round((journey.completedStops / journey.totalStops) * 100)
          : 0;

        // Durumu belirle
        let status = 'pending';
        if (journey) {
          status = journey.status === 'completed' ? 'completed' :
                  journey.status === 'in_progress' ? 'active' :
                  'pending';
        }

        return {
          id: route.id,
          driver: driver?.name || route.driver?.name || (user?.isDriver ? user.fullName : 'Atanmadı'),
          vehicle: journey?.vehiclePlateNumber || route.vehicle?.plateNumber || 'Atanmadı',
          status: status,
          progress: progress,
          deliveries: journey ? `${journey.completedStops}/${journey.totalStops}` : '0/0'
        };
      })
      .slice(0, 5);

    setTodayRoutes(mappedRoutes);
  };

  const generateRecentActivities = (journeySummaries: JourneySummary[], routes: RouteType[]) => {
    const activities: any[] = [];
    
    // ✅ Driver için sadece kendi aktiviteleri
    let filteredJourneys = journeySummaries;
    let filteredRoutes = routes;
    
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredJourneys = journeySummaries.filter(j => j.driverId === user.id);
      filteredRoutes = routes.filter(r => r.driverId === user.id);
    }

    // ✅ Summary verilerinden aktivite oluştur
    filteredJourneys.slice(0, 5).forEach((journey) => {
      if (journey.status === 'completed') {
        activities.push({
          id: `j-${journey.id}`,
          type: 'delivery',
          message: `Sefer tamamlandı - ${journey.routeName}`,
          time: formatTimeAgo(journey.completedAt || journey.startedAt),
          icon: CheckCircle,
          color: 'text-green-600'
        });
      } else if (journey.status === 'in_progress') {
        activities.push({
          id: `j-${journey.id}`,
          type: 'driver',
          message: `Sefer devam ediyor - ${journey.driverName}`,
          time: formatTimeAgo(journey.startedAt),
          icon: Truck,
          color: 'text-purple-600'
        });
      }
    });

    // Son oluşturulan rotalar
    filteredRoutes.slice(0, 3).forEach(route => {
      activities.push({
        id: `r-${route.id}`,
        type: 'route',
        message: `Yeni rota oluşturuldu - ${route.name}`,
        time: formatTimeAgo(route.createdAt),
        icon: Route,
        color: 'text-blue-600'
      });
    });

    activities.sort((a, b) => 0);
    setRecentActivities(activities.slice(0, 5));
  };

  const calculateWeeklyData = (journeySummaries: JourneySummary[]) => {
    const daysOfWeek = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const today = new Date();
    const weekData: any[] = [];

    // ✅ Driver için sadece kendi journey'leri
    let filteredJourneys = journeySummaries;
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredJourneys = journeySummaries.filter(j => j.driverId === user.id);
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // ✅ Summary verilerinden hesapla
      const dayJourneys = filteredJourneys.filter(j => {
        const journeyDate = new Date(j.startedAt || j.createdAt);
        journeyDate.setHours(0, 0, 0, 0);
        return journeyDate.getTime() === date.getTime();
      });

      const dayDeliveries = dayJourneys.reduce((sum, j) => {
        return sum + j.completedStops;
      }, 0);

      weekData.push({
        day: daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1],
        deliveries: dayDeliveries,
        target: date.getDay() === 0 || date.getDay() === 6 ? 50 : 150
      });
    }

    setWeeklyData(weekData);
  };

  const formatTimeAgo = (date?: Date | string): string => {
    if (!date) return 'Bilinmiyor';
    
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return past.toLocaleDateString('tr-TR');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Devam Ediyor';
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Bekliyor';
      default: return status;
    }
  };

  const handleDownloadReport = () => {
    const reportData = [
      ['Dashboard Raporu', new Date().toLocaleDateString('tr-TR')],
      [''],
      ['Genel İstatistikler'],
      ['Metrik', 'Değer', 'Değişim'],
      ...stats.map(stat => [stat.title, stat.value, stat.change]),
      [''],
      ['Günlük Rotalar'],
      ['Sürücü', 'Araç', 'Durum', 'İlerleme', 'Teslimatlar'],
      ...todayRoutes.map(route => [
        route.driver,
        route.vehicle,
        getStatusText(route.status),
        `${route.progress}%`,
        route.deliveries
      ]),
      [''],
      ['Haftalık Performans'],
      ['Gün', 'Teslimat', 'Hedef'],
      ...weeklyData.map(data => [data.day, data.deliveries.toString(), data.target.toString()])
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_raporu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Hoş geldiniz {user?.fullName}! İşte {user?.isDriver && !canAccessDispatcherFeatures() ? 'size özel' : 'bugünkü'} özet bilgileriniz.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
          </select>
          <button 
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className={`flex items-center text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 
                stat.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {stat.trend === 'up' && <ArrowUp className="w-4 h-4 mr-1" />}
                {stat.trend === 'down' && <ArrowDown className="w-4 h-4 mr-1" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Haftalık Performansım' : 'Haftalık Teslimat Performansı'}
            </h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center">
                <span className="text-sm text-gray-600 w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500"
                      style={{ width: `${(day.deliveries / 200) * 100}%` }}
                    />
                    {canAccessDispatcherFeatures() && (
                      <div 
                        className="absolute top-0 left-0 h-full border-r-2 border-dashed border-gray-400"
                        style={{ left: `${(day.target / 200) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                  {day.deliveries}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-end mt-4 space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Gerçekleşen</span>
              </div>
              {canAccessDispatcherFeatures() && (
                <div className="flex items-center">
                  <div className="w-0.5 h-3 bg-gray-400 mr-2"></div>
                  <span className="text-gray-600">Hedef</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Henüz aktivite yok</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/journeys')}
            className="block w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
          >
            Tüm Seferleri Gör →
          </button>
        </div>
      </div>

      {/* Today's Routes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Bugünkü Rotalarım' : 'Bugünkü Rotalar'}
            </h2>
            <Link 
              to="/routes" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tümünü Gör →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {todayRoutes.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sürücü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Araç
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlerleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teslimatlar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksiyon
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {route.driver.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-900">{route.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {route.vehicle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(route.status)}`}>
                        {getStatusText(route.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                route.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${route.progress}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-600">{route.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {route.deliveries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        to={`/routes/${route.id}`} 
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Detay →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>
                {user?.isDriver && !canAccessDispatcherFeatures() 
                  ? 'Size atanmış rota bulunmuyor' 
                  : 'Bugün için planlanmış rota bulunmuyor'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;