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
  Star, // Star import'u eklendi
  Target, // ✅ NEW - For SLA tab
  TrendingDown, // ✅ NEW - For customer performance
  MapPin // ✅ NEW - For critical stops
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
import { Route, Journey, Customer, Driver, Vehicle, getDelayReasonLabel } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerFeedbackReport } from '@/components/reports/CustomerFeedbackReport';

interface ReportData {
  deliveryTrends: Array<{ date: string; completed: number; failed: number; total: number }>;
  driverPerformance: Array<{ name: string; deliveries: number; rating: number; avgTime: number }>;
  customerDistribution: Array<{ name: string; value: number; percentage: number }>;
  vehicleUtilization: Array<{ vehicle: string; trips: number; distance: number; utilization: number }>;
  hourlyDistribution: Array<{ hour: string; deliveries: number }>;
  routeEfficiency: Array<{ route: string; planned: number; actual: number; efficiency: number }>;
  // ✅ NEW - Delay Tracking Data
  delayTrends: Array<{ date: string; avgDelay: number; totalDelays: number }>;
  delayReasons: Array<{ category: string; count: number; totalMinutes: number; percentage: number; icon: string; color: string }>;
  mostDelayedRoutes: Array<{ routeName: string; totalDelay: number; avgDelay: number; journeyCount: number }>;
  mostDelayedDrivers: Array<{ driverName: string; totalDelay: number; avgDelay: number; delayCount: number }>;
  delayByTimeOfDay: Array<{ hour: string; avgDelay: number; delayCount: number }>;
  slaCompliance: Array<{ date: string; onTime: number; delayed: number; early: number; slaRate: number }>;
  customerPerformance: Array<{ customerId: string; customerName: string; deliveries: number; onTimeRate: number; avgDelay: number; address: string }>;
  criticalStops: Array<{ customerId: string; stopName: string; delayFrequency: number; avgDelay: number; lastDelay: string; address: string }>;
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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'deliveries' | 'drivers' | 'vehicles' | 'customers' | 'feedback' | 'delays' | 'sla' | 'customer-performance' | 'critical-stops' | 'time-analysis' | 'driver-comparison' | 'route-comparison'>('overview');
  
  const [routes, setRoutes] = useState<Route[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);

  // ✅ YENİ - Filtreler
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const { user, canAccessDispatcherFeatures, canAccessAdminFeatures } = useAuth();

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (routes.length > 0 || journeys.length > 0) {
      generateReportData();
    }
  }, [routes, journeys, dateRange, startDate, endDate, selectedDriverId, selectedVehicleId]);

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

    // ✅ YENİ - Driver/Vehicle filters uygula
    if (selectedDriverId) {
      filteredJourneys = filteredJourneys.filter(j => j.route?.driverId === selectedDriverId);
      filteredRoutes = filteredRoutes.filter(r => r.driverId === selectedDriverId);
    }

    if (selectedVehicleId) {
      filteredJourneys = filteredJourneys.filter(j => j.route?.vehicleId === selectedVehicleId);
      filteredRoutes = filteredRoutes.filter(r => r.vehicleId === selectedVehicleId);
    }

    // Teslimat trendleri (son 7 gün) - ✅ FIX: journeys kullanılıyor
    const deliveryTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd MMM', { locale: tr });

      const dayJourneys = filteredJourneys.filter(j =>
        j.startedAt && format(new Date(j.startedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const completed = dayJourneys.reduce((acc, j) =>
        acc + (j.stops?.filter(s => s.status === 'Completed').length || 0), 0
      );
      const failed = dayJourneys.reduce((acc, j) =>
        acc + (j.stops?.filter(s => s.status === 'Failed').length || 0), 0
      );
      const total = completed + failed;

      deliveryTrends.push({
        date: dateStr,
        completed,
        failed,
        total
      });
    }

    // Sürücü performansı - ✅ FIX: journeys kullanılıyor
    let driverPerformance = [];
    if (canAccessDispatcherFeatures()) {
      // Dispatcher ve üzeri tüm sürücüleri görebilir
      driverPerformance = drivers.map(driver => {
        const driverJourneys = journeys.filter(j => j.route?.driverId === driver.id);
        const completedJourneys = driverJourneys.filter(j => j.status === 'completed');
        const totalDeliveries = completedJourneys.reduce((acc, j) =>
          acc + (j.stops?.filter(s => s.status === 'Completed').length || 0), 0
        );
        const avgTime = completedJourneys.length > 0
          ? completedJourneys.reduce((acc, j) => acc + (j.totalDuration || 0), 0) / completedJourneys.length
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
      const myJourneys = filteredJourneys;
      const completedJourneys = myJourneys.filter(j => j.status === 'completed');
      const totalDeliveries = completedJourneys.reduce((acc, j) =>
        acc + (j.stops?.filter(s => s.status === 'Completed').length || 0), 0
      );
      const avgTime = completedJourneys.length > 0
        ? completedJourneys.reduce((acc, j) => acc + (j.totalDuration || 0), 0) / completedJourneys.length
        : 0;

      driverPerformance = [{
        name: user.fullName,
        deliveries: totalDeliveries,
        rating: 0,
        avgTime: Math.round(avgTime)
      }];
    }

    // Müşteri dağılımı (şehire göre) - Sadece Dispatcher ve üzeri
    let customerDistribution = [];
    if (canAccessDispatcherFeatures() && customers.length > 0) {
      // Şehirlere göre grupla
      const cityMap = new Map<string, number>();
      customers.forEach(c => {
        const city = c.city || 'Belirtilmemiş';
        cityMap.set(city, (cityMap.get(city) || 0) + 1);
      });

      const totalCustomers = customers.length;
      customerDistribution = Array.from(cityMap.entries())
        .map(([city, count]) => ({
          name: city,
          value: count,
          percentage: Math.round((count / totalCustomers) * 100)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 şehir
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

    // Araç kullanımı - ✅ FIX: journeys kullanılıyor
    const vehicleUtilization = vehicles.map(vehicle => {
      const vehicleJourneys = filteredJourneys.filter(j => j.route?.vehicleId === vehicle.id);
      const trips = vehicleJourneys.length;
      const distance = vehicleJourneys.reduce((acc, j) => acc + (j.totalDistance || 0), 0);
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

    // ✅ NEW - Delay Analysis Data Calculation
    // 1. Delay Trends (last 7 days)
    const delayTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd MMM', { locale: tr });

      const dayJourneys = filteredJourneys.filter(j =>
        j.startedAt && format(new Date(j.startedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const delayedStops = dayJourneys.flatMap(j => j.stops || []).filter(s => s.newDelay && s.newDelay > 0);
      const totalDelays = delayedStops.length;
      const avgDelay = totalDelays > 0
        ? Math.round(delayedStops.reduce((sum, s) => sum + (s.newDelay || 0), 0) / totalDelays)
        : 0;

      delayTrends.push({
        date: dateStr,
        avgDelay,
        totalDelays
      });
    }

    // 2. Delay Reasons Breakdown
    const delayReasonCategories = ['Traffic', 'CustomerNotReady', 'VehicleIssue', 'Weather', 'UnloadingDelay', 'RouteChange', 'AccidentArea', 'BreakTime', 'Other'];
    const delayReasonIcons: Record<string, string> = {
      Traffic: 'car',
      CustomerNotReady: 'user-clock',
      VehicleIssue: 'wrench',
      Weather: 'cloud-rain',
      UnloadingDelay: 'package',
      RouteChange: 'route',
      AccidentArea: 'alert-triangle',
      BreakTime: 'coffee',
      Other: 'help-circle'
    };
    const delayReasonColors: Record<string, string> = {
      Traffic: '#EF4444',
      CustomerNotReady: '#F59E0B',
      VehicleIssue: '#8B5CF6',
      Weather: '#3B82F6',
      UnloadingDelay: '#10B981',
      RouteChange: '#EC4899',
      AccidentArea: '#DC2626',
      BreakTime: '#14B8A6',
      Other: '#6B7280'
    };

    const allDelayedStops = filteredJourneys.flatMap(j => j.stops || []).filter(s => s.delayReasonCategory && s.newDelay && s.newDelay > 0);
    const totalDelayMinutes = allDelayedStops.reduce((sum, s) => sum + (s.newDelay || 0), 0);

    const delayReasons = delayReasonCategories.map(category => {
      const categoryStops = allDelayedStops.filter(s => s.delayReasonCategory === category);
      const count = categoryStops.length;
      const totalMinutes = categoryStops.reduce((sum, s) => sum + (s.newDelay || 0), 0);
      const percentage = totalDelayMinutes > 0 ? Math.round((totalMinutes / totalDelayMinutes) * 100) : 0;

      return {
        category: getDelayReasonLabel(category),
        count,
        totalMinutes,
        percentage,
        icon: delayReasonIcons[category] || 'help-circle',
        color: delayReasonColors[category] || '#6B7280'
      };
    }).filter(r => r.count > 0).sort((a, b) => b.totalMinutes - a.totalMinutes);

    // 3. Most Delayed Routes
    const routeDelayMap = new Map<string, { routeName: string; totalDelay: number; journeyCount: number }>();
    filteredJourneys.forEach(j => {
      if (j.route) {
        const routeId = j.route.id || j.routeId;
        const routeName = j.route.name || `Rota ${routeId}`;
        const delayedStops = (j.stops || []).filter(s => s.newDelay && s.newDelay > 0);
        const totalDelay = delayedStops.reduce((sum, s) => sum + (s.newDelay || 0), 0);

        if (totalDelay > 0) {
          if (!routeDelayMap.has(routeId)) {
            routeDelayMap.set(routeId, { routeName, totalDelay: 0, journeyCount: 0 });
          }
          const current = routeDelayMap.get(routeId)!;
          current.totalDelay += totalDelay;
          current.journeyCount += 1;
        }
      }
    });

    const mostDelayedRoutes = Array.from(routeDelayMap.values())
      .map(r => ({
        ...r,
        avgDelay: Math.round(r.totalDelay / r.journeyCount)
      }))
      .sort((a, b) => b.totalDelay - a.totalDelay)
      .slice(0, 10);

    // 4. Most Delayed Drivers
    let mostDelayedDrivers: Array<{ driverName: string; totalDelay: number; avgDelay: number; delayCount: number }> = [];
    if (canAccessDispatcherFeatures()) {
      const driverDelayMap = new Map<number, { driverName: string; totalDelay: number; delayCount: number }>();
      filteredJourneys.forEach(j => {
        if (j.route?.driverId) {
          const driverId = j.route.driverId;
          const driver = drivers.find(d => d.id === driverId);
          const driverName = driver?.name || `Sürücü ${driverId}`;
          const delayedStops = (j.stops || []).filter(s => s.newDelay && s.newDelay > 0);
          const totalDelay = delayedStops.reduce((sum, s) => sum + (s.newDelay || 0), 0);
          const delayCount = delayedStops.length;

          if (totalDelay > 0) {
            if (!driverDelayMap.has(driverId)) {
              driverDelayMap.set(driverId, { driverName, totalDelay: 0, delayCount: 0 });
            }
            const current = driverDelayMap.get(driverId)!;
            current.totalDelay += totalDelay;
            current.delayCount += delayCount;
          }
        }
      });

      mostDelayedDrivers = Array.from(driverDelayMap.values())
        .map(d => ({
          ...d,
          avgDelay: Math.round(d.totalDelay / d.delayCount)
        }))
        .sort((a, b) => b.totalDelay - a.totalDelay)
        .slice(0, 10);
    } else if (user?.isDriver) {
      const myDelayedStops = filteredJourneys.flatMap(j => j.stops || []).filter(s => s.newDelay && s.newDelay > 0);
      const totalDelay = myDelayedStops.reduce((sum, s) => sum + (s.newDelay || 0), 0);
      const delayCount = myDelayedStops.length;

      if (delayCount > 0) {
        mostDelayedDrivers = [{
          driverName: user.fullName,
          totalDelay,
          delayCount,
          avgDelay: Math.round(totalDelay / delayCount)
        }];
      }
    }

    // 5. Delay by Time of Day
    const delayByTimeOfDay: Array<{ hour: string; avgDelay: number; delayCount: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;

      const hourStops = filteredJourneys.flatMap(j => j.stops || []).filter(s => {
        if (s.checkInTime && s.newDelay && s.newDelay > 0) {
          const stopHour = new Date(s.checkInTime).getHours();
          return stopHour === hour;
        }
        return false;
      });

      const delayCount = hourStops.length;
      const avgDelay = delayCount > 0
        ? Math.round(hourStops.reduce((sum, s) => sum + (s.newDelay || 0), 0) / delayCount)
        : 0;

      if (delayCount > 0) {
        delayByTimeOfDay.push({ hour: hourStr, avgDelay, delayCount });
      }
    }

    // 6. SLA Compliance
    const slaCompliance = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'dd MMM', { locale: tr });

      const dayJourneys = filteredJourneys.filter(j =>
        j.startedAt && format(new Date(j.startedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const completedStops = dayJourneys.flatMap(j => j.stops || []).filter(s => s.status === 'Completed');
      const onTime = completedStops.filter(s => !s.newDelay || s.newDelay <= 15).length;
      const delayed = completedStops.filter(s => s.newDelay && s.newDelay > 15).length;
      const early = completedStops.filter(s => s.newDelay && s.newDelay < 0).length;
      const slaRate = completedStops.length > 0 ? Math.round((onTime / completedStops.length) * 100) : 0;

      slaCompliance.push({
        date: dateStr,
        onTime,
        delayed,
        early,
        slaRate
      });
    }

    // 7. Customer Performance Analysis
    let customerPerformance: Array<{ customerId: string; customerName: string; deliveries: number; onTimeRate: number; avgDelay: number; address: string }> = [];
    if (canAccessDispatcherFeatures() && customers.length > 0) {
      const customerStopsMap = new Map<number, { customerId: string; customerName: string; address: string; deliveries: number; onTimeDeliveries: number; totalDelay: number; delayCount: number }>();

      filteredJourneys.forEach(j => {
        (j.stops || []).forEach(s => {
          if (s.routeStop?.customer) {
            const customer = s.routeStop.customer;
            const customerId = String(customer.id);
            const customerName = customer.name;
            const address = customer.address;

            if (!customerStopsMap.has(customer.id)) {
              customerStopsMap.set(customer.id, {
                customerId,
                customerName,
                address,
                deliveries: 0,
                onTimeDeliveries: 0,
                totalDelay: 0,
                delayCount: 0
              });
            }

            const current = customerStopsMap.get(customer.id)!;
            if (s.status === 'Completed') {
              current.deliveries += 1;
              if (!s.newDelay || s.newDelay <= 15) {
                current.onTimeDeliveries += 1;
              }
              if (s.newDelay && s.newDelay > 0) {
                current.totalDelay += s.newDelay;
                current.delayCount += 1;
              }
            }
          }
        });
      });

      customerPerformance = Array.from(customerStopsMap.values())
        .filter(c => c.deliveries > 0)
        .map(c => ({
          customerId: c.customerId,
          customerName: c.customerName,
          address: c.address,
          deliveries: c.deliveries,
          onTimeRate: Math.round((c.onTimeDeliveries / c.deliveries) * 100),
          avgDelay: c.delayCount > 0 ? Math.round(c.totalDelay / c.delayCount) : 0
        }))
        .sort((a, b) => b.deliveries - a.deliveries)
        .slice(0, 20);
    }

    // 8. Critical Stops Analysis
    let criticalStops: Array<{ customerId: string; stopName: string; delayFrequency: number; avgDelay: number; lastDelay: string; address: string }> = [];
    if (canAccessDispatcherFeatures() && customers.length > 0) {
      const stopDelayMap = new Map<number, { customerId: string; stopName: string; address: string; delayFrequency: number; totalDelay: number; lastDelay: string | null }>();

      filteredJourneys.forEach(j => {
        (j.stops || []).forEach(s => {
          if (s.routeStop?.customer && s.newDelay && s.newDelay > 15) {
            const customer = s.routeStop.customer;
            const customerId = String(customer.id);
            const stopName = customer.name;
            const address = customer.address;

            if (!stopDelayMap.has(customer.id)) {
              stopDelayMap.set(customer.id, {
                customerId,
                stopName,
                address,
                delayFrequency: 0,
                totalDelay: 0,
                lastDelay: null
              });
            }

            const current = stopDelayMap.get(customer.id)!;
            current.delayFrequency += 1;
            current.totalDelay += s.newDelay;
            if (s.checkInTime) {
              const checkInDate = new Date(s.checkInTime);
              if (!current.lastDelay || checkInDate > new Date(current.lastDelay)) {
                current.lastDelay = s.checkInTime;
              }
            }
          }
        });
      });

      criticalStops = Array.from(stopDelayMap.values())
        .map(s => ({
          customerId: s.customerId,
          stopName: s.stopName,
          address: s.address,
          delayFrequency: s.delayFrequency,
          avgDelay: Math.round(s.totalDelay / s.delayFrequency),
          lastDelay: s.lastDelay ? format(new Date(s.lastDelay), 'dd MMM yyyy', { locale: tr }) : '-'
        }))
        .sort((a, b) => b.delayFrequency - a.delayFrequency)
        .slice(0, 15);
    }

    setReportData({
      deliveryTrends,
      driverPerformance,
      customerDistribution,
      vehicleUtilization,
      hourlyDistribution,
      routeEfficiency,
      delayTrends,
      delayReasons,
      mostDelayedRoutes,
      mostDelayedDrivers,
      delayByTimeOfDay,
      slaCompliance,
      customerPerformance,
      criticalStops
    });

    // KPI Metrikleri - ✅ FIX: journeys kullanılıyor
    const totalDeliveries = filteredJourneys.reduce((acc, j) =>
      acc + (j.stops?.filter(s => s.status === 'Completed').length || 0), 0
    );
    const totalPlanned = filteredJourneys.reduce((acc, j) =>
      acc + (j.stops?.length || 0), 0
    );
    const successRate = totalPlanned > 0 ? Math.round((totalDeliveries / totalPlanned) * 100) : 0;
    const avgDeliveryTime = filteredJourneys.length > 0
      ? Math.round(filteredJourneys.reduce((acc, j) => acc + (j.totalDuration || 0), 0) / filteredJourneys.length)
      : 0;
    const activeDriversCount = canAccessDispatcherFeatures()
      ? drivers.filter(d => d.status === 'available' || d.status === 'busy').length
      : (user?.isDriver ? 1 : 0);
    const totalDistance = Math.round(filteredJourneys.reduce((acc, j) => acc + (j.totalDistance || 0), 0));

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
    ? ['overview', 'deliveries', 'vehicles', 'delays'] // Driver can see delays (own data)
    : ['overview', 'deliveries', 'drivers', 'vehicles', 'customers', 'delays', 'sla', 'customer-performance', 'critical-stops', 'feedback'];

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
            { id: 'delays', label: 'Gecikme Analizi', icon: Clock },
            { id: 'sla', label: 'SLA / Zamanında Teslimat', icon: Target },
            { id: 'customer-performance', label: 'Müşteri Performans', icon: TrendingDown },
            { id: 'critical-stops', label: 'Kritik Duraklar', icon: MapPin },
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

      {/* ✅ YENİ - Filtreler (Overview Tab) */}
      {selectedTab === 'overview' && canAccessDispatcherFeatures() && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={selectedDriverId || ''}
                onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tüm Sürücüler</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Tüm Araçlar</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber}</option>
                ))}
              </select>
            </div>
            {(selectedDriverId || selectedVehicleId) && (
              <button
                onClick={() => {
                  setSelectedDriverId(null);
                  setSelectedVehicleId(null);
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Kartları */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                  {canAccessDispatcherFeatures() ? 'Şehirlere Göre Müşteri Dağılımı' : 'Sefer Durumları'}
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
              {/* Şehirlere Göre Müşteri Dağılımı */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Şehirlere Göre Dağılım</h3>
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
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {customer.city || 'Belirtilmemiş'}
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

      {/* ✅ NEW - Gecikme Analizi Tab */}
      {selectedTab === 'delays' && reportData && (
        <div className="space-y-6">
          {/* Delay KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-red-100">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Toplam Gecikme</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.delayTrends.reduce((sum, d) => sum + d.totalDelays, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Ortalama Gecikme</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  reportData.delayTrends.reduce((sum, d) => sum + d.avgDelay * d.totalDelays, 0) /
                  Math.max(1, reportData.delayTrends.reduce((sum, d) => sum + d.totalDelays, 0))
                )} dk
              </p>
              <p className="text-xs text-gray-500 mt-1">Durak başına</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Navigation className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">En Gecikmeli Rota</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.mostDelayedRoutes[0]?.totalDelay || 0} dk
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {reportData.mostDelayedRoutes[0]?.routeName || 'Veri yok'}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">En Gecikmeli Sürücü</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.mostDelayedDrivers[0]?.totalDelay || 0} dk
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {reportData.mostDelayedDrivers[0]?.driverName || 'Veri yok'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delay Trends */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gecikme Trendleri</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.delayTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgDelay" stroke="#EF4444" name="Ort. Gecikme (dk)" strokeWidth={2} />
                  <Line type="monotone" dataKey="totalDelays" stroke="#F59E0B" name="Gecikme Sayısı" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Delay Reasons Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gecikme Sebepleri Dağılımı</h3>
              {reportData.delayReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.delayReasons}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.category}: ${entry.percentage}%`}
                      outerRadius={100}
                      dataKey="totalMinutes"
                    >
                      {reportData.delayReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Gecikme verisi bulunamadı
                </div>
              )}
            </div>

            {/* Most Delayed Routes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">En Gecikmeli Rotalar</h3>
              {reportData.mostDelayedRoutes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.mostDelayedRoutes.slice(0, 5)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="routeName" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalDelay" fill="#EF4444" name="Toplam Gecikme (dk)" />
                    <Bar dataKey="avgDelay" fill="#F59E0B" name="Ort. Gecikme (dk)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  Gecikme verisi bulunamadı
                </div>
              )}
            </div>

            {/* Most Delayed Drivers */}
            {canAccessDispatcherFeatures() && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">En Gecikmeli Sürücüler</h3>
                {reportData.mostDelayedDrivers.length > 0 ? (
                  <div className="space-y-3">
                    {reportData.mostDelayedDrivers.slice(0, 6).map((driver, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{driver.driverName}</p>
                            <p className="text-sm text-gray-600">{driver.delayCount} gecikme</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{driver.totalDelay} dk</p>
                          <p className="text-xs text-gray-600">Ort: {driver.avgDelay} dk</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-500">
                    Gecikme verisi bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delay Reasons Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gecikme Sebepleri Detayı</h3>
            {reportData.delayReasons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Sebep</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Adet</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Toplam Süre</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Yüzde</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Ort. Gecikme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.delayReasons.map((reason, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: reason.color }}
                            />
                            <span className="font-medium text-gray-900">{reason.category}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">{reason.count}</td>
                        <td className="text-center py-3 px-2 text-gray-700">{reason.totalMinutes} dk</td>
                        <td className="text-center py-3 px-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            {reason.percentage}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">
                          {Math.round(reason.totalMinutes / reason.count)} dk
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Gecikme sebepleri verisi bulunamadı
              </div>
            )}
          </div>

          {/* Delay by Time of Day */}
          {reportData.delayByTimeOfDay.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saate Göre Gecikme Analizi</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.delayByTimeOfDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgDelay" fill="#EF4444" name="Ort. Gecikme (dk)" />
                  <Bar dataKey="delayCount" fill="#F59E0B" name="Gecikme Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ✅ NEW - SLA / Zamanında Teslimat Tab */}
      {selectedTab === 'sla' && reportData && canAccessDispatcherFeatures() && (
        <div className="space-y-6">
          {/* SLA KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Zamanında Teslimat</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.slaCompliance.reduce((sum, d) => sum + d.onTime, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Gecikmeli Teslimat</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.slaCompliance.reduce((sum, d) => sum + d.delayed, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Erken Teslimat</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.slaCompliance.reduce((sum, d) => sum + d.early, 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1">Ortalama SLA</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  reportData.slaCompliance.reduce((sum, d) => sum + d.slaRate, 0) /
                  Math.max(1, reportData.slaCompliance.length)
                )}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
            </div>
          </div>

          {/* SLA Compliance Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Uyumluluk Trendi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.slaCompliance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="onTime" stackId="1" stroke="#10B981" fill="#10B981" name="Zamanında" />
                <Area type="monotone" dataKey="delayed" stackId="1" stroke="#EF4444" fill="#EF4444" name="Gecikmeli" />
                <Area type="monotone" dataKey="early" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Erken" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* SLA Rate Line Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Oranı Trendi (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.slaCompliance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="slaRate" stroke="#10B981" strokeWidth={3} name="SLA Oranı (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ✅ NEW - Müşteri Performans Tab */}
      {selectedTab === 'customer-performance' && reportData && canAccessDispatcherFeatures() && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Performans Analizi</h3>
            {reportData.customerPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Müşteri</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Adres</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Teslimat</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Zamanında %</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Ort. Gecikme</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customerPerformance.map((customer, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-900">{customer.customerName}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{customer.address}</td>
                        <td className="text-center py-3 px-2 text-gray-700">{customer.deliveries}</td>
                        <td className="text-center py-3 px-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            customer.onTimeRate >= 90 ? 'bg-green-100 text-green-700' :
                            customer.onTimeRate >= 70 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {customer.onTimeRate}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">{customer.avgDelay} dk</td>
                        <td className="text-center py-3 px-2">
                          {customer.onTimeRate >= 90 ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : customer.onTimeRate >= 70 ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Müşteri performans verisi bulunamadı
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ NEW - Kritik Duraklar Tab */}
      {selectedTab === 'critical-stops' && reportData && canAccessDispatcherFeatures() && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kritik Duraklar (Sık Geciken Lokasyonlar)</h3>
            {reportData.criticalStops.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Durak</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Adres</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Gecikme Sıklığı</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Ort. Gecikme</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Son Gecikme</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-700">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.criticalStops.map((stop, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium text-gray-900">{stop.stopName}</td>
                        <td className="py-3 px-2 text-sm text-gray-600">{stop.address}</td>
                        <td className="text-center py-3 px-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            {stop.delayFrequency}x
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700">{stop.avgDelay} dk</td>
                        <td className="text-center py-3 px-2 text-gray-700">{stop.lastDelay}</td>
                        <td className="text-center py-3 px-2">
                          {stop.delayFrequency >= 5 && stop.avgDelay >= 30 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                              Yüksek Risk
                            </span>
                          ) : stop.delayFrequency >= 3 || stop.avgDelay >= 20 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                              Orta Risk
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              Düşük Risk
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Kritik durak verisi bulunamadı
              </div>
            )}
          </div>

          {/* Critical Stops Chart */}
          {reportData.criticalStops.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">En Kritik 10 Durak</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.criticalStops.slice(0, 10)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stopName" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delayFrequency" fill="#EF4444" name="Gecikme Sıklığı" />
                  <Bar dataKey="avgDelay" fill="#F59E0B" name="Ort. Gecikme (dk)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Müşteri Memnuniyeti Tab */}
      {selectedTab === 'feedback' && (
        <CustomerFeedbackReport startDate={startDate} endDate={endDate} />
      )}
    </div>
  );
};

export default Reports;