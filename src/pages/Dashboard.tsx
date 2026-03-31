import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  MapPin,
  Navigation,
  Package,
  Route,
  Star,
  Truck,
  Users
} from 'lucide-react';
import { customerService } from '@/services/customer.service';
import { depotService } from '@/services/depot.service';
import { driverService } from '@/services/driver.service';
import { journeyService, JourneySummary } from '@/services/journey.service';
import { routeService } from '@/services/route.service';
import { api } from '@/services/api';
import { Customer, Depot, Driver, Route as RouteType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import MaintenanceAlertsWidget from '@/components/dashboard/MaintenanceAlertsWidget';
import { PageHeader, PageLoading } from '@/components/ui/PageChrome';

interface FeedbackStats {
  averageRating: number;
  totalFeedbacks: number;
  last7DaysAverage: number;
}

const toneMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  purple: 'bg-violet-50 text-violet-700',
  orange: 'bg-amber-50 text-amber-700',
  yellow: 'bg-amber-50 text-amber-700',
  indigo: 'bg-indigo-50 text-indigo-700'
};

const statusColor = (status: string) => {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700';
  if (status === 'completed') return 'bg-blue-50 text-blue-700';
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const statusText = (status: string) => {
  if (status === 'active') return 'Devam Ediyor';
  if (status === 'completed') return 'Tamamlandi';
  if (status === 'pending') return 'Bekliyor';
  return status;
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [todayRoutes, setTodayRoutes] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [delayedStops, setDelayedStops] = useState<any[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const navigate = useNavigate();
  const { user, canAccessDispatcherFeatures } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const dispatcher = canAccessDispatcherFeatures();
      const [customers, drivers, journeys, routes, depotsData] = await Promise.all([
        dispatcher ? customerService.getAll().catch(() => []) : Promise.resolve([]),
        dispatcher ? driverService.getAll().catch(() => []) : Promise.resolve([]),
        journeyService.getAllSummary().catch(() => []),
        Promise.race([
          routeService.getAll(),
          new Promise<RouteType[]>((_, reject) => setTimeout(() => reject(new Error('Route timeout')), 10000))
        ]).catch(() => []),
        depotService.getAll().catch(() => [])
      ]);

      setDepots(depotsData as Depot[]);
      const feedback = dispatcher ? await loadFeedbackStats().catch(() => null) : null;
      if (feedback) setFeedbackStats(feedback);

      calculateStats(customers as Customer[], drivers as Driver[], journeys as JourneySummary[], feedback);
      filterTodayRoutes(routes as RouteType[], journeys as JourneySummary[], drivers as Driver[]);
      generateRecentActivities(journeys as JourneySummary[], routes as RouteType[]);
      calculateWeeklyData(journeys as JourneySummary[]);
      if (dispatcher) {
        calculateTopDrivers(journeys as JourneySummary[], drivers as Driver[]);
        calculateDelayedStops(journeys as JourneySummary[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackStats = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const response = await api.get('/workspace/feedback/stats', {
      params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    });
    return {
      averageRating: response.data.averageOverallRating || 0,
      totalFeedbacks: response.data.totalFeedbacks || 0,
      last7DaysAverage: response.data.last7DaysAverage || 0
    };
  };

  const calculateDelayedStops = (journeys: JourneySummary[]) => {
    setDelayedStops(journeys.filter((journey) => journey.status === 'in_progress' || journey.status === 'started').slice(0, 3));
  };

  const calculateTopDrivers = (journeys: JourneySummary[], drivers: Driver[]) => {
    const statsMap = new Map<number, { driver: Driver; deliveries: number; journeys: number }>();
    drivers.forEach((driver) => statsMap.set(driver.id, { driver, deliveries: 0, journeys: 0 }));
    journeys.forEach((journey) => {
      if (!journey.driverId || !statsMap.has(journey.driverId)) return;
      const item = statsMap.get(journey.driverId)!;
      item.deliveries += journey.completedStops;
      item.journeys += 1;
      statsMap.set(journey.driverId, item);
    });
    setTopDrivers(Array.from(statsMap.values()).filter((item) => item.deliveries > 0).sort((a, b) => b.deliveries - a.deliveries).slice(0, 5));
  };

  const calculateStats = (
    customers: Customer[],
    drivers: Driver[],
    journeys: JourneySummary[],
    currentFeedback?: FeedbackStats | null
  ) => {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    const previousStart = new Date();
    previousStart.setDate(today.getDate() - 60);
    const currentJourneys = journeys.filter((journey) => new Date(journey.startedAt || journey.createdAt) >= lastMonth);
    const previousJourneys = journeys.filter((journey) => {
      const date = new Date(journey.startedAt || journey.createdAt);
      return date >= previousStart && date < lastMonth;
    });
    const deliveryCount = currentJourneys.reduce((total, item) => total + item.completedStops, 0);
    const prevDeliveryCount = previousJourneys.reduce((total, item) => total + item.completedStops, 0);
    const completedJourneys = currentJourneys.filter((item) => item.status === 'completed').length;
    const prevCompletedJourneys = previousJourneys.filter((item) => item.status === 'completed').length;
    const deliveryChange = prevDeliveryCount > 0 ? (((deliveryCount - prevDeliveryCount) / prevDeliveryCount) * 100).toFixed(0) : '0';
    const journeyChange = prevCompletedJourneys > 0 ? (((completedJourneys - prevCompletedJourneys) / prevCompletedJourneys) * 100).toFixed(0) : completedJourneys > 0 ? '100' : '0';
    const dispatcherStats = canAccessDispatcherFeatures();
    const nextStats: any[] = [
      { title: 'Toplam Teslimat', value: String(deliveryCount), change: `${Number(deliveryChange) > 0 ? '+' : ''}${deliveryChange}%`, trend: Number(deliveryChange) > 0 ? 'up' : Number(deliveryChange) < 0 ? 'down' : 'neutral', icon: Package, color: 'blue', subtitle: 'Son 30 gun' }
    ];
    if (dispatcherStats) {
      nextStats.push(
        { title: 'Aktif Musteri', value: String(customers.length), change: '+5%', trend: 'up', icon: Users, color: 'green', subtitle: 'Toplam' },
        { title: 'Aktif Surucu', value: String(drivers.filter((driver) => driver.status === 'available').length), change: `${drivers.length} toplam`, trend: 'neutral', icon: Truck, color: 'purple', subtitle: 'Musait durumda' },
        { title: 'Tamamlanan Sefer', value: String(completedJourneys), change: `${Number(journeyChange) > 0 ? '+' : ''}${journeyChange}%`, trend: Number(journeyChange) > 0 ? 'up' : Number(journeyChange) < 0 ? 'down' : 'neutral', icon: CheckCircle, color: 'orange', subtitle: 'Bu ay' }
      );
      const feedback = currentFeedback || feedbackStats;
      if (feedback && feedback.totalFeedbacks > 0) {
        nextStats.push({ title: 'Musteri Memnuniyeti', value: feedback.averageRating.toFixed(1), change: `${feedback.totalFeedbacks} degerlendirme`, trend: feedback.averageRating >= 4 ? 'up' : feedback.averageRating >= 3 ? 'neutral' : 'down', icon: Star, color: 'yellow', subtitle: 'Ortalama puan' });
      }
    } else if (user?.isDriver) {
      const mine = journeys.filter((journey) => journey.driverId === user.id);
      nextStats.push({ title: 'Benim Teslimatlarim', value: String(mine.reduce((total, item) => total + item.completedStops, 0)), change: `${mine.length} sefer`, trend: 'neutral', icon: Navigation, color: 'indigo', subtitle: 'Bu ay' });
    }
    setStats(nextStats);
  };

  const filterTodayRoutes = (routes: RouteType[], journeys: JourneySummary[], drivers: Driver[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let items = routes.filter((route) => {
      const date = new Date(route.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      items = items.filter((route) => route.driverId === user.id || route.driver?.id === user.id);
    }
    setTodayRoutes(items.map((route) => {
      const journey = journeys.find((item) => item.routeId === Number(route.id));
      const driver = drivers.find((item) => item.id === Number(route.driverId));
      return {
        id: route.id,
        driver: driver?.name || route.driver?.name || (user?.isDriver ? user.fullName : 'Atanmadi'),
        vehicle: journey?.vehiclePlateNumber || route.vehicle?.plateNumber || 'Atanmadi',
        status: journey ? (journey.status === 'completed' ? 'completed' : journey.status === 'in_progress' ? 'active' : 'pending') : 'pending',
        progress: journey ? Math.round((journey.completedStops / journey.totalStops) * 100) : 0,
        deliveries: journey ? `${journey.completedStops}/${journey.totalStops}` : '0/0'
      };
    }).slice(0, 5));
  };

  const generateRecentActivities = (journeys: JourneySummary[], routes: RouteType[]) => {
    let filteredJourneys = journeys;
    let filteredRoutes = routes;
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredJourneys = journeys.filter((journey) => journey.driverId === user.id);
      filteredRoutes = routes.filter((route) => route.driverId === user.id);
    }
    const activities: any[] = [];
    filteredJourneys.slice(0, 5).forEach((journey) => {
      if (journey.status === 'completed') activities.push({ id: `j-${journey.id}`, icon: CheckCircle, color: 'text-green-600', message: `Sefer tamamlandi - ${journey.routeName}`, time: formatTimeAgo(journey.completedAt || journey.startedAt) });
      else if (journey.status === 'in_progress') activities.push({ id: `j-${journey.id}`, icon: Truck, color: 'text-violet-600', message: `Sefer devam ediyor - ${journey.driverName}`, time: formatTimeAgo(journey.startedAt) });
    });
    filteredRoutes.slice(0, 3).forEach((route) => activities.push({ id: `r-${route.id}`, icon: Route, color: 'text-blue-600', message: `Yeni rota olusturuldu - ${route.name}`, time: formatTimeAgo(route.createdAt) }));
    setRecentActivities(activities.slice(0, 5));
  };

  const calculateWeeklyData = (journeys: JourneySummary[]) => {
    const days = ['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'];
    let list = journeys;
    if (user?.isDriver && !canAccessDispatcherFeatures()) list = journeys.filter((journey) => journey.driverId === user.id);
    const next = [];
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      date.setHours(0, 0, 0, 0);
      const deliveries = list
        .filter((journey) => {
          const started = new Date(journey.startedAt || journey.createdAt);
          started.setHours(0, 0, 0, 0);
          return started.getTime() === date.getTime();
        })
        .reduce((sum, journey) => sum + journey.completedStops, 0);
      next.push({ day: days[date.getDay() === 0 ? 6 : date.getDay() - 1], deliveries });
    }
    setWeeklyData(next);
  };

  const formatTimeAgo = (value?: Date | string) => {
    if (!value) return 'Bilinmiyor';
    const now = new Date().getTime();
    const past = new Date(value).getTime();
    const diffMinutes = Math.floor((now - past) / 60000);
    if (diffMinutes < 60) return `${diffMinutes} dk once`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} saat once`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gun once`;
    return new Date(value).toLocaleDateString('tr-TR');
  };

  const handleDownloadReport = () => {
    const rows = [
      ['Dashboard Raporu', new Date().toLocaleDateString('tr-TR')],
      [''],
      ['Genel Istatistikler'],
      ['Metrik', 'Deger', 'Degisim'],
      ...stats.map((item) => [item.title, item.value, item.change]),
      [''],
      ['Bugunku Rotalar'],
      ['Surucu', 'Arac', 'Durum', 'Ilerleme', 'Teslimatlar'],
      ...todayRoutes.map((item) => [item.driver, item.vehicle, statusText(item.status), `${item.progress}%`, item.deliveries])
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard_raporu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <PageLoading label="Dashboard yukleniyor..." />;

  const todayProgress = todayRoutes.length ? Math.round(todayRoutes.reduce((sum, item) => sum + item.progress, 0) / todayRoutes.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Genel Gorunum"
        title="Dashboard"
        description={`Hos geldiniz ${user?.fullName || ''}. ${user?.isDriver && !canAccessDispatcherFeatures() ? 'Size ozel operasyon ozeti burada.' : 'Bugunku operasyon ozetini ve kritik alanlari burada takip edin.'}`}
        actions={
          <>
            {canAccessDispatcherFeatures() && (
              <>
                <Link to="/routes/new" className="app-button-primary"><Route className="h-4 w-4" />Yeni Rota</Link>
                <Link to="/customers/new" className="app-button-secondary"><Users className="h-4 w-4" />Yeni Musteri</Link>
              </>
            )}
            <button onClick={handleDownloadReport} className="app-button-secondary"><Calendar className="h-4 w-4" />Rapor Indir</button>
          </>
        }
      />

      {canAccessDispatcherFeatures() && <MaintenanceAlertsWidget />}

      {todayRoutes.length > 0 && (
        <section className="app-surface bg-[linear-gradient(135deg,#111827_0%,#1f3654_45%,#49698d_100%)] px-6 py-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">Bugun</p>
              <div className="mt-3 flex flex-wrap items-center gap-6">
                <div><p className="text-3xl font-bold">{todayRoutes.length}</p><p className="text-sm text-slate-200">Toplam Rota</p></div>
                <div><p className="text-3xl font-bold">{todayRoutes.filter((item) => item.status === 'active').length}</p><p className="text-sm text-slate-200">Aktif</p></div>
                <div><p className="text-3xl font-bold">{todayRoutes.filter((item) => item.status === 'completed').length}</p><p className="text-sm text-slate-200">Tamamlandi</p></div>
                <div><p className="text-3xl font-bold">{todayRoutes.filter((item) => item.status === 'pending').length}</p><p className="text-sm text-slate-200">Bekliyor</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 px-6 py-5 lg:min-w-[220px]">
              <p className="text-sm text-slate-200">Bugunku Ilerleme</p>
              <p className="mt-2 text-4xl font-extrabold">{todayProgress}%</p>
              <p className="mt-2 text-sm text-slate-200">Gun icindeki rotalar uzerinden hesaplanir.</p>
            </div>
          </div>
        </section>
      )}

      {canAccessDispatcherFeatures() && delayedStops.length > 0 && (
        <section className="app-surface border-l-4 border-l-amber-500 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><Bell className="h-5 w-5" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-900">{delayedStops.length} aktif sefer devam ediyor</p><p className="mt-1 text-xs text-slate-500">Operasyon ekibi icin hizli takip alani.</p></div>
            <Link to="/journeys" className="text-sm font-semibold text-amber-700 hover:text-amber-800">Goruntule →</Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article key={index} className="app-kpi">
            <div className="flex items-start justify-between">
              <div><p className="app-kpi-label">{stat.title}</p><p className="app-kpi-value">{stat.value}</p><p className="app-kpi-meta">{stat.subtitle}</p></div>
              <div className={`rounded-2xl p-3 ${toneMap[stat.color] || toneMap.blue}`}><stat.icon className="h-5 w-5" /></div>
            </div>
            <div className={`mt-4 flex items-center text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
              {stat.trend === 'up' && <ArrowUp className="mr-1 h-4 w-4" />}
              {stat.trend === 'down' && <ArrowDown className="mr-1 h-4 w-4" />}
              {stat.trend === 'neutral' && <Activity className="mr-1 h-4 w-4" />}
              {stat.change}
            </div>
          </article>
        ))}
      </section>

      <WeatherWidget depots={depots} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="app-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="app-section-title">{user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Haftalik Performansim' : 'Haftalik Teslimat Performansi'}</h2>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {weeklyData.map((day, index) => {
              const max = Math.max(...weeklyData.map((item) => item.deliveries), 1);
              return (
                <div key={index} className="flex items-center">
                  <span className="w-12 text-sm text-slate-500">{day.day}</span>
                  <div className="mx-4 flex-1"><div className="relative h-8 overflow-hidden rounded-2xl bg-slate-100"><div className="absolute left-0 top-0 h-full rounded-2xl bg-gradient-to-r from-slate-700 to-blue-600" style={{ width: `${(day.deliveries / max) * 100}%` }} /></div></div>
                  <span className="w-16 text-right text-sm font-semibold text-slate-900">{day.deliveries}</span>
                </div>
              );
            })}
          </div>
        </section>

        {canAccessDispatcherFeatures() && topDrivers.length > 0 ? (
          <section className="app-card p-6">
            <div className="mb-6 flex items-center justify-between"><h2 className="app-section-title">En Iyi Suruculer</h2><Award className="h-5 w-5 text-slate-400" /></div>
            <div className="space-y-3">
              {topDrivers.map((item, index) => (
                <div key={item.driver.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3">
                  <div className="flex items-center">
                    <span className={`mr-3 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>{index + 1}</span>
                    <div><p className="text-sm font-medium text-slate-900">{item.driver.name}</p><p className="text-xs text-slate-500">{item.journeys} sefer</p></div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{item.deliveries}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="app-card p-6">
            <div className="mb-6 flex items-center justify-between"><h2 className="app-section-title">Son Aktiviteler</h2><Activity className="h-5 w-5 text-slate-400" /></div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <activity.icon className={`mt-0.5 h-5 w-5 ${activity.color}`} />
                  <div><p className="text-sm text-slate-900">{activity.message}</p><p className="mt-1 text-xs text-slate-500">{activity.time}</p></div>
                </div>
              )) : <p className="py-4 text-center text-sm text-slate-500">Henuz aktivite yok</p>}
            </div>
            <button onClick={() => navigate('/journeys')} className="mt-4 block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700">Tum Seferleri Gor →</button>
          </section>
        )}
      </div>

      <section className="app-table-shell">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="app-section-title">{user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Bugunku Rotalarim' : 'Bugunku Rotalar'}</h2>
            <Link to="/routes" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Tumunu Gor →</Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          {todayRoutes.length > 0 ? (
            <table>
              <thead className="bg-slate-50/80"><tr><th className="px-6 py-4 text-left">Surucu</th><th className="px-6 py-4 text-left">Arac</th><th className="px-6 py-4 text-left">Durum</th><th className="px-6 py-4 text-left">Ilerleme</th><th className="px-6 py-4 text-left">Teslimatlar</th><th className="px-6 py-4 text-left">Aksiyon</th></tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {todayRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200"><span className="text-xs font-medium text-slate-600">{route.driver.split(' ').map((n: string) => n[0]).join('')}</span></div><span className="ml-3 text-sm font-medium text-slate-900">{route.driver}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{route.vehicle}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(route.status)}`}>{statusText(route.status)}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="mr-3 flex-1"><div className="h-2 w-full rounded-full bg-slate-200"><div className={`h-2 rounded-full ${route.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${route.progress}%` }} /></div></div><span className="text-sm text-slate-600">{route.progress}%</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{route.deliveries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><Link to={`/routes/${route.id}`} className="font-medium text-blue-600 hover:text-blue-700">Detay →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-slate-500"><MapPin className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p>{user?.isDriver && !canAccessDispatcherFeatures() ? 'Size atanmis rota bulunmuyor' : 'Bugun icin planlanmis rota bulunmuyor'}</p></div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
