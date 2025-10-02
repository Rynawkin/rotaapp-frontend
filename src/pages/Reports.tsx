import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Download,
  Calendar,
  Clock,
  Users,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Filter,
  Printer,
  Navigation,
  Star // Star import'u eklendi
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { reportService } from '@/services/report.service';
import { routeService } from '@/services/route.service';
import { journeyService } from '@/services/journey.service';
import { customerService } from '@/services/customer.service';
import { driverService } from '@/services/driver.service';
import { vehicleService } from '@/services/vehicle.service';
import { Route, Journey, Customer, Driver, Vehicle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerFeedbackReport } from '@/components/reports/CustomerFeedbackReport';

interface ReportData {
  deliveryTrends: Array<{ date: string; completed: number; failed: number; total: number }>;
  driverPerformance: Array<{ name: string; deliveries: number; rating: number; avgTime: number }>;
  customerDistribution: Array<{ name: string; value: number; percentage: number }>;
  vehicleUtilization: Array<{ vehicle: string; trips: number; distance: number; utilization: number }>;
  hourlyDistribution: Array<{ hour: string; deliveries: number }>;
  routeEfficiency: Array<{ route: string; planned: number; actual: number; efficiency: number }>;
}

interface KPIMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  subtitle: string;
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 90), 'yyyy-MM-dd')); // 30 günden 90 güne çıkarıldı
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'deliveries' | 'drivers' | 'vehicles' | 'customers' | 'feedback'>('overview');
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);

  const { user, canAccessDispatcherFeatures, canAccessAdminFeatures } = useAuth();

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (routes.length > 0 || journeys.length > 0) {
      generateReportData();
    }
  }, [routes, journeys, dateRange, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises: Promise<any>[] = [];
      
      // Routes ve Journeys - Tüm roller yükleyebilir (backend zaten filtreliyor)
      promises.push(
        routeService.getAll().then(data => {
          setRoutes(data);
          return data;
        }).catch(err => {
          console.log('Route verileri yüklenemedi');
          setRoutes([]);
          return [];
        }),
        journeyService.getAll().then(data => {
          setJourneys(data);
          return data;
        }).catch(err => {
          console.log('Journey verileri yüklenemedi');
          setJourneys([]);
          return [];
        })
      );
      
      // Vehicles - Tüm roller görebilir
      promises.push(
        vehicleService.getAll().then(data => {
          setVehicles(data);
          return data;
        }).catch(err => {
          console.log('Vehicle verileri yüklenemedi');
          setVehicles([]);
          return [];
        })
      );

      // Customers ve Drivers - Dispatcher ve üzeri için yükle, Driver için boş bırak
      if (canAccessDispatcherFeatures()) {
        promises.push(
          customerService.getAll().then(data => {
            setCustomers(data);
            return data;
          }).catch(err => {
            console.log('Customer verileri yüklenemedi (yetki gerekebilir)');
            setCustomers([]);
            return [];
          }),
          driverService.getAll().then(data => {
            setDrivers(data);
            return data;
          }).catch(err => {
            console.log('Driver verileri yüklenemedi (yetki gerekebilir)');
            setDrivers([]);
            return [];
          })
        );
      } else {
        // Driver rolü için boş set et
        setCustomers([]);
        setDrivers([]);
      }
      
      await Promise.allSettled(promises);
      
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    // Driver rolü için kendi verilerini filtrele
    let filteredRoutes = routes;
    let filteredJourneys = journeys;
    
    if (user?.isDriver && !canAccessDispatcherFeatures()) {
      filteredRoutes = routes.filter(r => r.driverId === user.id);
      filteredJourneys = journeys.filter(j => j.driverId === user.id);
    }

    // Teslimat trendleri (son 7 gün)
    const deliveryTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd MMM', { locale: tr });
      
      const dayRoutes = filteredRoutes.filter(r => 
        format(new Date(r.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const completed = dayRoutes.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.completedDeliveries, 0);
      const total = dayRoutes.reduce((acc, r) => acc + r.totalDeliveries, 0);
      const failed = total - completed;
      
      deliveryTrends.push({
        date: dateStr,
        completed,
        failed,
        total
      });
    }

    // Sürücü performansı
    let driverPerformance = [];
    if (canAccessDispatcherFeatures()) {
      // Dispatcher ve üzeri tüm sürücüleri görebilir
      driverPerformance = drivers.map(driver => {
        const driverRoutes = routes.filter(r => r.driverId === driver.id);
        const completedRoutes = driverRoutes.filter(r => r.status === 'completed');
        const totalDeliveries = completedRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
        const avgTime = completedRoutes.length > 0 
          ? completedRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0) / completedRoutes.length
          : 0;
        
        return {
          name: driver.name,
          deliveries: totalDeliveries,
          rating: driver.rating || 0,
          avgTime: Math.round(avgTime)
        };
      }).sort((a, b) => b.deliveries - a.deliveries).slice(0, 5);
    } else if (user?.isDriver) {
      // Driver sadece kendi performansını görebilir
      const myRoutes = filteredRoutes;
      const completedRoutes = myRoutes.filter(r => r.status === 'completed');
      const totalDeliveries = completedRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
      const avgTime = completedRoutes.length > 0 
        ? completedRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0) / completedRoutes.length
        : 0;
      
      driverPerformance = [{
        name: user.fullName,
        deliveries: totalDeliveries,
        rating: 0,
        avgTime: Math.round(avgTime)
      }];
    }

    // Müşteri dağılımı (önceliğe göre) - Sadece Dispatcher ve üzeri
    let customerDistribution = [];
    if (canAccessDispatcherFeatures() && customers.length > 0) {
      const highPriority = customers.filter(c => c.priority === 'high').length;
      const normalPriority = customers.filter(c => c.priority === 'normal').length;
      const lowPriority = customers.filter(c => c.priority === 'low').length;
      const totalCustomers = customers.length;
      
      customerDistribution = [
        { 
          name: 'Yüksek Öncelik', 
          value: highPriority,
          percentage: Math.round((highPriority / totalCustomers) * 100)
        },
        { 
          name: 'Normal Öncelik', 
          value: normalPriority,
          percentage: Math.round((normalPriority / totalCustomers) * 100)
        },
        { 
          name: 'Düşük Öncelik', 
          value: lowPriority,
          percentage: Math.round((lowPriority / totalCustomers) * 100)
        }
      ];
    } else {
      // Driver için alternatif veri
      customerDistribution = [
        { name: 'Tamamlanan', value: filteredJourneys.filter(j => j.status === 'completed').length, percentage: 0 },
        { name: 'Devam Eden', value: filteredJourneys.filter(j => j.status === 'in_progress').length, percentage: 0 },
        { name: 'İptal', value: filteredJourneys.filter(j => j.status === 'cancelled').length, percentage: 0 }
      ];
      const total = customerDistribution.reduce((sum, item) => sum + item.value, 0);
      customerDistribution.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      });
    }

    // Araç kullanımı
    const vehicleUtilization = vehicles.map(vehicle => {
      const vehicleRoutes = filteredRoutes.filter(r => r.vehicleId === vehicle.id);
      const trips = vehicleRoutes.length;
      const distance = vehicleRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0);
      const utilization = Math.min(100, Math.round((trips / 30) * 100)); // 30 günde max kullanım
      
      return {
        vehicle: vehicle.plateNumber,
        trips,
        distance: Math.round(distance),
        utilization
      };
    });

    // Saatlik dağılım - gerçek journey verilerinden hesaplanır
    const hourlyDistribution = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      
      // Bu saatte başlayan veya tamamlanan journey'leri say
      const journeysInHour = filteredJourneys.filter(journey => {
        if (journey.startedAt) {
          const journeyHour = new Date(journey.startedAt).getHours();
          return journeyHour === hour;
        }
        return false;
      }).length;
      
      hourlyDistribution.push({ 
        hour: hourStr, 
        deliveries: journeysInHour 
      });
    }

    // Rota verimliliği
    const routeEfficiency = filteredRoutes.slice(0, 6).map(route => ({
      route: route.name,
      planned: route.totalDeliveries,
      actual: route.completedDeliveries,
      efficiency: route.totalDeliveries > 0 
        ? Math.round((route.completedDeliveries / route.totalDeliveries) * 100)
        : 0
    }));

    setReportData({
      deliveryTrends,
      driverPerformance,
      customerDistribution,
      vehicleUtilization,
      hourlyDistribution,
      routeEfficiency
    });

    // KPI Metrikleri
    const totalDeliveries = filteredRoutes.reduce((acc, r) => acc + r.completedDeliveries, 0);
    const totalPlanned = filteredRoutes.reduce((acc, r) => acc + r.totalDeliveries, 0);
    const successRate = totalPlanned > 0 ? Math.round((totalDeliveries / totalPlanned) * 100) : 0;
    const avgDeliveryTime = filteredRoutes.length > 0
      ? Math.round(filteredRoutes.reduce((acc, r) => acc + (r.totalDuration || 0), 0) / filteredRoutes.length)
      : 0;
    const activeDriversCount = canAccessDispatcherFeatures() 
      ? drivers.filter(d => d.status === 'available' || d.status === 'busy').length
      : (user?.isDriver ? 1 : 0);
    const totalDistance = Math.round(filteredRoutes.reduce((acc, r) => acc + (r.totalDistance || 0), 0));

    const metrics: KPIMetric[] = [
      {
        title: user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Teslimatlarım' : 'Toplam Teslimat',
        value: totalDeliveries.toLocaleString('tr-TR'),
        change: 12.5,
        trend: 'up',
        icon: Package,
        color: 'blue',
        subtitle: `${totalPlanned} planlanmış`
      },
      {
        title: 'Başarı Oranı',
        value: `${successRate}%`,
        change: 5.2,
        trend: 'up',
        icon: CheckCircle,
        color: 'green',
        subtitle: 'Tamamlanan teslimatlar'
      },
      {
        title: 'Ort. Teslimat Süresi',
        value: `${avgDeliveryTime} dk`,
        change: -8.3,
        trend: 'down',
        icon: Clock,
        color: 'orange',
        subtitle: 'Rota başına'
      }
    ];

    // Dispatcher ve üzeri için ek metrikler
    if (canAccessDispatcherFeatures()) {
      metrics.push(
        {
          title: 'Aktif Sürücü',
          value: activeDriversCount,
          change: 0,
          trend: 'neutral',
          icon: Users,
          color: 'purple',
          subtitle: `${drivers.length} toplam`
        },
        {
          title: 'Toplam Mesafe',
          value: `${totalDistance} km`,
          change: 15.7,
          trend: 'up',
          icon: Truck,
          color: 'indigo',
          subtitle: 'Katedilen mesafe'
        },
        {
          title: 'Müşteri Sayısı',
          value: customers.length,
          change: 3.4,
          trend: 'up',
          icon: Users,
          color: 'pink',
          subtitle: 'Aktif müşteriler'
        }
      );
    } else {
      // Driver için özel metrikler
      metrics.push(
        {
          title: 'Benim Mesafem',
          value: `${totalDistance} km`,
          change: 15.7,
          trend: 'up',
          icon: Truck,
          color: 'indigo',
          subtitle: 'Katedilen mesafe'
        },
        {
          title: 'Aktif Seferim',
          value: filteredJourneys.filter(j => j.status === 'in_progress').length,
          change: 0,
          trend: 'neutral',
          icon: Navigation,
          color: 'purple',
          subtitle: 'Devam eden'
        }
      );
    }

    setKpiMetrics(metrics);
  };

  const handleDateRangeChange = (range: typeof dateRange) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'quarter':
        setStartDate(format(subMonths(today, 3), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    // CSV verisi oluştur
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Teslimat trendleri
    csvContent += 'Teslimat Trendleri\n';
    csvContent += 'Tarih,Tamamlanan,Başarısız,Toplam\n';
    reportData.deliveryTrends.forEach(item => {
      csvContent += `${item.date},${item.completed},${item.failed},${item.total}\n`;
    });
    
    csvContent += '\n';
    
    // Sürücü performansı
    csvContent += 'Sürücü Performansı\n';
    csvContent += 'Sürücü,Teslimatlar,Rating,Ort. Süre (dk)\n';
    reportData.driverPerformance.forEach(item => {
      csvContent += `${item.name},${item.deliveries},${item.rating},${item.avgTime}\n`;
    });
    
    // CSV'yi indir
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rotaapp-rapor-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  // Grafik renkleri
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Driver için tab kısıtlaması
  const availableTabs = user?.isDriver && !canAccessDispatcherFeatures()
    ? ['overview', 'deliveries', 'vehicles']
    : ['overview', 'deliveries', 'drivers', 'vehicles', 'customers', 'feedback'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-gray-600 mt-1">
            {user?.isDriver && !canAccessDispatcherFeatures() 
              ? 'Kişisel performans analizleriniz'
              : 'Detaylı performans analizleri ve istatistikler'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tarih Aralığı Seçimi */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as typeof dateRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
              <option value="quarter">Son 3 Ay</option>
              <option value="custom">Özel</option>
            </select>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {/* Export Butonları */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV İndir
            </button>
            <button
              onClick={printReport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'deliveries', label: 'Teslimatlar', icon: Package },
            { id: 'drivers', label: 'Sürücüler', icon: Users },
            { id: 'vehicles', label: 'Araçlar', icon: Truck },
            { id: 'customers', label: 'Müşteriler', icon: Users },
            { id: 'feedback', label: 'Müşteri Memnuniyeti', icon: Star }
          ].filter(tab => availableTabs.includes(tab.id)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
              className={`
                flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* KPI Kartları */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                  <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                </div>
                <div className={`flex items-center text-xs font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {metric.trend === 'up' && <ArrowUp className="w-3 h-3 mr-1" />}
                  {metric.trend === 'down' && <ArrowDown className="w-3 h-3 mr-1" />}
                  {metric.change !== 0 && `${Math.abs(metric.change)}%`}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{metric.title}</p>
                <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grafikler */}
      {reportData && (
        <>
          {/* Genel Bakış */}
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teslimat Trendleri */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Teslimat Trendlerim' : 'Teslimat Trendleri'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.deliveryTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" name="Tamamlanan" />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#EF4444" fill="#EF4444" name="Başarısız" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Müşteri Dağılımı veya Sefer Durumları */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {canAccessDispatcherFeatures() ? 'Müşteri Öncelik Dağılımı' : 'Sefer Durumları'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.customerDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.customerDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Saatlik Dağılım */}
              <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saatlik Teslimat Dağılımı</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={reportData.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deliveries" fill="#3B82F6" name="Teslimatlar" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Teslimatlar Tab */}
          {selectedTab === 'deliveries' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rota Verimliliği */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Rota Verimliliğim' : 'Rota Verimliliği'}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.routeEfficiency} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="route" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planned" fill="#94A3B8" name="Planlanan" />
                    <Bar dataKey="actual" fill="#10B981" name="Tamamlanan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Teslimat İstatistikleri */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teslimat İstatistikleri</h3>
                <div className="space-y-4">
                  {reportData.routeEfficiency.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{route.route}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {route.actual} / {route.planned} teslimat
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{route.efficiency}%</p>
                          <p className="text-xs text-gray-600">Verimlilik</p>
                        </div>
                        <div className={`p-2 rounded-full ${
                          route.efficiency >= 90 ? 'bg-green-100' :
                          route.efficiency >= 70 ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {route.efficiency >= 90 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : route.efficiency >= 70 ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sürücüler Tab - Sadece Dispatcher ve üzeri */}
          {selectedTab === 'drivers' && canAccessDispatcherFeatures() && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sürücü Performansı */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Sürücü Performansı</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.driverPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="deliveries" fill="#3B82F6" name="Teslimatlar" />
                    <Bar dataKey="rating" fill="#F59E0B" name="Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sürücü Detayları */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sürücü Detayları</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Sürücü</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Teslimat</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Rating</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Ort. Süre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.driverPerformance.map((driver, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {driver.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{driver.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-700">{driver.deliveries}</td>
                          <td className="text-center py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium text-gray-900">{driver.rating}</span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-700">{driver.avgTime} dk</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Araçlar Tab */}
          {selectedTab === 'vehicles' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Araç Kullanımı */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Araç Kullanım Oranları</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.vehicleUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="utilization" fill="#8B5CF6" name="Kullanım %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Araç İstatistikleri */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Araç İstatistikleri</h3>
                <div className="space-y-3">
                  {reportData.vehicleUtilization.map((vehicle, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">{vehicle.vehicle}</span>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          vehicle.utilization >= 80 ? 'bg-red-100 text-red-700' :
                          vehicle.utilization >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {vehicle.utilization}% Kullanım
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Sefer Sayısı</p>
                          <p className="font-semibold text-gray-900">{vehicle.trips}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Toplam Mesafe</p>
                          <p className="font-semibold text-gray-900">{vehicle.distance} km</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Müşteriler Tab - Sadece Dispatcher ve üzeri */}
          {selectedTab === 'customers' && canAccessDispatcherFeatures() && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Müşteri Öncelik Dağılımı */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Segmentasyonu</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.customerDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reportData.customerDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {reportData.customerDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.value} müşteri ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* En Çok Teslimat Yapılan Müşteriler */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Müşteriler</h3>
                <div className="space-y-3">
                  {customers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.address}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          customer.priority === 'high' ? 'bg-red-100 text-red-700' :
                          customer.priority === 'normal' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {customer.priority === 'high' ? 'Yüksek' :
                           customer.priority === 'normal' ? 'Normal' : 'Düşük'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Müşteri Memnuniyeti Tab */}
      {selectedTab === 'feedback' && (
        <CustomerFeedbackReport startDate={startDate} endDate={endDate} />
      )}

      {/* Footer İstatistikler */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">{kpiMetrics[1]?.value || '0%'}</p>
            <p className="text-sm opacity-80 mt-1">Başarı Oranı</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">{kpiMetrics[2]?.value || '0 dk'}</p>
            <p className="text-sm opacity-80 mt-1">Ortalama Teslimat Süresi</p>
          </div>
          <div className="text-center">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">{kpiMetrics[0]?.value || '0'}</p>
            <p className="text-sm opacity-80 mt-1">
              {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Teslimatlarım' : 'Toplam Teslimat'}
            </p>
          </div>
          <div className="text-center">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">
              {canAccessDispatcherFeatures() ? kpiMetrics[4]?.value : kpiMetrics[3]?.value || '0 km'}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {user?.isDriver && !canAccessDispatcherFeatures() ? 'Benim Mesafem' : 'Toplam Mesafe'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;