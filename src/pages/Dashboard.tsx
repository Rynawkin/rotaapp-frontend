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
  Loader2,
  Star,
  Award,
  Bell
} from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { driverService } from '@/services/driver.service';
import { journeyService, JourneySummary } from '@/services/journey.service';
import { routeService } from '@/services/route.service';
import { depotService } from '@/services/depot.service';
import { Customer, Driver, Route as RouteType, Depot } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import MaintenanceAlertsWidget from '@/components/dashboard/MaintenanceAlertsWidget';

interface FeedbackStats {
  averageRating: number;
  totalFeedbacks: number;
  last7DaysAverage: number;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [todayRoutes, setTodayRoutes] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [journeySummaries, setJourneySummaries] = useState<JourneySummary[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [delayedStops, setDelayedStops] = useState<any[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const navigate = useNavigate();

  const { user, canAccessDispatcherFeatures } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [];

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
        setCustomers([]);
        setDrivers([]);
      }

      promises.push(
        journeyService.getAllSummary().then(data => {
          setJourneySummaries(data);
          return data;
        }).catch(err => {
          console.log('Journey verileri yüklenemedi');
          setJourneySummaries([]);
          return [];
        }),
        // Route verilerini timeout ile yükle (10 saniye)
        Promise.race([
          routeService.getAll(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Route timeout')), 10000)
          )
        ]).then(data => {
          setRoutes(data as RouteType[]);
          return data;
        }).catch(err => {
          console.log('Route verileri yüklenemedi (timeout veya hata):', err.message);
          setRoutes([]);
          return [];
        }),
        depotService.getAll().then(data => {
          setDepots(data);
          return data;
        }).catch(err => {
          console.log('Depot verileri yüklenemedi');
          setDepots([]);
          return [];
        })
      );

      // Feedback istatistiklerini yükle
      if (canAccessDispatcherFeatures()) {
        promises.push(
          loadFeedbackStats().catch(err => {
            console.log('Feedback verileri yüklenemedi');
            return null;
          })
        );
      }

      const results = await Promise.allSettled(promises);

      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      const customersData = canAccessDispatcherFeatures() && successfulResults[0] ? successfulResults[0] : [];
      const driversData = canAccessDispatcherFeatures() && successfulResults[1] ? successfulResults[1] : [];
      const journeysData = canAccessDispatcherFeatures() ? successfulResults[2] || [] : successfulResults[0] || [];
      const routesData = canAccessDispatcherFeatures() ? successfulResults[3] || [] : successfulResults[1] || [];

      calculateStats(customersData, driversData, journeysData, routesData);
      filterTodayRoutes(routesData, journeysData, driversData);
      generateRecentActivities(journeysData, routesData);
      calculateWeeklyData(journeysData);

      // Dispatcher için ek hesaplamalar
      if (canAccessDispatcherFeatures()) {
        calculateTopDrivers(journeysData, driversData);
        calculateDelayedStops(journeysData);
      }

    } catch (error: any) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Dashboard verileri yüklenirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackStats = async (): Promise<FeedbackStats | null> => {
    try {
      // Son 30 gün için feedback stats
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await api.get('/workspace/feedback/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      const stats: FeedbackStats = {
        averageRating: response.data.averageOverallRating || 0,
        totalFeedbacks: response.data.totalFeedbacks || 0,
        last7DaysAverage: response.data.last7DaysAverage || 0
      };

      setFeedbackStats(stats);
      return stats;
    } catch (error) {
      console.error('Feedback stats yüklenirken hata:', error);
      return null;
    }
  };

  const calculateDelayedStops = (journeySummaries: JourneySummary[]) => {
    // Bu basit bir implementasyon - gerçek delayed stop hesaplaması için
    // journey detail'dan stop bilgileri gerekli
    const activeJourneys = journeySummaries.filter(j =>
      j.status === 'in_progress' || j.status === 'started'
    );

    // Şimdilik sadece aktif journey sayısını gösterelim
    setDelayedStops(activeJourneys.slice(0, 3));
  };

  const calculateTopDrivers = (journeySummaries: JourneySummary[], drivers: Driver[]) => {
    // Sürücü başına teslimat sayısını hesapla
    const driverStats = new Map<number, { driver: Driver; deliveries: number; journeys: number }>();

    drivers.forEach(driver => {
      driverStats.set(driver.id, {
        driver,
        deliveries: 0,
        journeys: 0
      });
    });

    journeySummaries.forEach(journey => {
      if (journey.driverId) {
        const stats = driverStats.get(journey.driverId);
        if (stats) {
          stats.deliveries += journey.completedStops;
          stats.journeys += 1;
          driverStats.set(journey.driverId, stats);
        }
      }
    });

    // En çok teslimat yapan 5 sürücü
    const topDriversList = Array.from(driverStats.values())
      .filter(stat => stat.deliveries > 0)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5);

    setTopDrivers(topDriversList);
  };

  const calculateStats = (
    customers: Customer[],
    drivers: Driver[],
    journeySummaries: JourneySummary[],
    routes: RouteType[]
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);

    // Bu ay ve geçen ay verilerini ayır
    const thisMonthJourneys = journeySummaries.filter(j => {
      const journeyDate = new Date(j.startedAt || j.createdAt);
      return journeyDate >= lastMonth;
    });

    const lastMonthDate = new Date();
    lastMonthDate.setDate(today.getDate() - 60);

    const previousMonthJourneys = journeySummaries.filter(j => {
      const journeyDate = new Date(j.startedAt || j.createdAt);
      return journeyDate >= lastMonthDate && journeyDate < lastMonth;
    });

    // Gerçek değişim hesaplamaları
    const thisMonthDeliveries = thisMonthJourneys.reduce((total, j) => total + j.completedStops, 0);
    const previousMonthDeliveries = previousMonthJourneys.reduce((total, j) => total + j.completedStops, 0);
    const deliveryChange = previousMonthDeliveries > 0
      ? ((thisMonthDeliveries - previousMonthDeliveries) / previousMonthDeliveries * 100).toFixed(0)
      : '0';

    // Müşteri değişimi
    const customerChange = '+5%'; // TODO: Backend'den müşteri ekleme geçmişi gerekli

    // Aktif sürücüler
    const activeDrivers = drivers.filter(d => d.status === 'available').length;

    // Tamamlanan sefer sayısı
    const thisMonthCompletedJourneys = thisMonthJourneys.filter(j => j.status === 'completed').length;
    const previousMonthCompletedJourneys = previousMonthJourneys.filter(j => j.status === 'completed').length;

    const journeyChange = previousMonthCompletedJourneys > 0
      ? ((thisMonthCompletedJourneys - previousMonthCompletedJourneys) / previousMonthCompletedJourneys * 100).toFixed(0)
      : thisMonthCompletedJourneys > 0 ? '100' : '0';

    // Başarı oranı (completed / total journeys)
    const totalJourneysThisMonth = thisMonthJourneys.length;
    const successRate = totalJourneysThisMonth > 0
      ? Math.round((thisMonthCompletedJourneys / totalJourneysThisMonth) * 100)
      : 0;

    const statsData = [];

    // Toplam teslimat
    statsData.push({
      title: 'Toplam Teslimat',
      value: thisMonthDeliveries.toString(),
      change: `${deliveryChange > '0' ? '+' : ''}${deliveryChange}%`,
      trend: Number(deliveryChange) > 0 ? 'up' : Number(deliveryChange) < 0 ? 'down' : 'neutral',
      icon: Package,
      color: 'blue',
      subtitle: 'Bu ay (son 30 gün)'
    });

    // Müşteri sayısı
    if (canAccessDispatcherFeatures()) {
      statsData.push({
        title: 'Aktif Müşteri',
        value: customers.length.toString(),
        change: customerChange,
        trend: 'up',
        icon: Users,
        color: 'green',
        subtitle: 'Toplam'
      });
    }

    // Aktif sürücü
    if (canAccessDispatcherFeatures()) {
      statsData.push({
        title: 'Aktif Sürücü',
        value: activeDrivers.toString(),
        change: `${drivers.length} toplam`,
        trend: 'neutral',
        icon: Truck,
        color: 'purple',
        subtitle: 'Müsait durumda'
      });
    }

    // Tamamlanan sefer sayısı (Dispatcher için)
    if (canAccessDispatcherFeatures()) {
      statsData.push({
        title: 'Tamamlanan Sefer',
        value: thisMonthCompletedJourneys.toString(),
        change: `${Number(journeyChange) > 0 ? '+' : ''}${journeyChange}%`,
        trend: Number(journeyChange) > 0 ? 'up' : Number(journeyChange) < 0 ? 'down' : 'neutral',
        icon: CheckCircle,
        color: 'orange',
        subtitle: 'Bu ay'
      });
    }

    // Müşteri memnuniyeti (Dispatcher için)
    if (canAccessDispatcherFeatures() && feedbackStats && feedbackStats.totalFeedbacks > 0) {
      statsData.push({
        title: 'Müşteri Memnuniyeti',
        value: feedbackStats.averageRating.toFixed(1),
        change: `${feedbackStats.totalFeedbacks} değerlendirme`,
        trend: feedbackStats.averageRating >= 4 ? 'up' : feedbackStats.averageRating >= 3 ? 'neutral' : 'down',
        icon: Star,
        color: 'yellow',
        subtitle: 'Ortalama puan'
      });
    }

    // Driver için özel istatistik
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      const myJourneys = journeySummaries.filter(j => j.driverId === user.id);
      const myDeliveries = myJourneys.reduce((total, j) => total + j.completedStops, 0);

      statsData.push({
        title: 'Benim Teslimatlarım',
        value: myDeliveries.toString(),
        change: `${myJourneys.length} sefer`,
        trend: 'neutral',
        icon: Navigation,
        color: 'indigo',
        subtitle: 'Bu ay'
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

    let todayRoutesData = routes
      .filter(route => {
        const routeDate = new Date(route.date);
        routeDate.setHours(0, 0, 0, 0);
        return routeDate.getTime() === today.getTime();
      });

    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      todayRoutesData = todayRoutesData.filter(route =>
        route.driverId === user.id || route.driver?.id === user.id
      );
    }

    const mappedRoutes = todayRoutesData
      .map(route => {
        const journey = journeySummaries.find(j => j.routeId === Number(route.id));
        const driver = drivers.find(d => d.id === Number(route.driverId));

        const progress = journey
          ? Math.round((journey.completedStops / journey.totalStops) * 100)
          : 0;

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

    let filteredJourneys = journeySummaries;
    let filteredRoutes = routes;

    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredJourneys = journeySummaries.filter(j => j.driverId === user.id);
      filteredRoutes = routes.filter(r => r.driverId === user.id);
    }

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

    let filteredJourneys = journeySummaries;
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredJourneys = journeySummaries.filter(j => j.driverId === user.id);
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

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
        deliveries: dayDeliveries
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
      ['Gün', 'Teslimat'],
      ...weeklyData.map(data => [data.day, data.deliveries.toString()])
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
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          {canAccessDispatcherFeatures() && (
            <>
              <Link
                to="/routes/new"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <Route className="w-4 h-4 mr-2" />
                Yeni Rota
              </Link>
              <Link
                to="/customers/new"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Yeni Müşteri
              </Link>
            </>
          )}
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Maintenance Alerts Widget - Conditional */}
      {canAccessDispatcherFeatures() && <MaintenanceAlertsWidget />}

      {/* Today Summary Card */}
      {todayRoutes.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Bugün</h2>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold">{todayRoutes.length}</p>
                  <p className="text-sm text-blue-100">Toplam Rota</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {todayRoutes.filter(r => r.status === 'active').length}
                  </p>
                  <p className="text-sm text-blue-100">Aktif</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {todayRoutes.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-blue-100">Tamamlandı</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {todayRoutes.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-blue-100">Bekliyor</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Bugünkü İlerleme</p>
              <p className="text-4xl font-bold">
                {todayRoutes.length > 0
                  ? Math.round(
                      todayRoutes.reduce((sum, r) => sum + r.progress, 0) / todayRoutes.length
                    )
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Journeys Alert - Dispatcher only */}
      {canAccessDispatcherFeatures() && delayedStops.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-orange-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                {delayedStops.length} aktif sefer devam ediyor
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Seferlerin ilerlemesini takip edin
              </p>
            </div>
            <Link
              to="/journeys"
              className="text-sm text-orange-700 hover:text-orange-800 font-medium"
            >
              Görüntüle →
            </Link>
          </div>
        </div>
      )}

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

      {/* Weather Widget */}
      <WeatherWidget depots={depots} />

      {/* Charts and Widgets Row */}
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
            {weeklyData.map((day, index) => {
              const maxDeliveries = Math.max(...weeklyData.map(d => d.deliveries), 1);
              return (
                <div key={index} className="flex items-center">
                  <span className="text-sm text-gray-600 w-12">{day.day}</span>
                  <div className="flex-1 mx-4">
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500"
                        style={{ width: `${(day.deliveries / maxDeliveries) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {day.deliveries}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-end mt-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span className="text-gray-600">Teslimat Sayısı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Drivers - Dispatcher only */}
        {canAccessDispatcherFeatures() && topDrivers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">🏆 En İyi Sürücüler</h2>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {topDrivers.map((item, index) => (
                <div key={item.driver.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.driver.name}</p>
                      <p className="text-xs text-gray-500">{item.journeys} sefer</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{item.deliveries}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Recent Activities - fallback when no top drivers */
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
        )}
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
