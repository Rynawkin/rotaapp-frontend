import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Route
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  // Mock data
  const stats = [
    {
      title: 'Toplam Teslimat',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'blue',
      subtitle: 'Bu ay'
    },
    {
      title: 'Aktif Müşteri',
      value: '456',
      change: '+5%',
      trend: 'up',
      icon: Users,
      color: 'green',
      subtitle: 'Toplam'
    },
    {
      title: 'Aktif Sürücü',
      value: '24',
      change: '0%',
      trend: 'neutral',
      icon: Truck,
      color: 'purple',
      subtitle: 'Bugün'
    },
    {
      title: 'Ortalama Teslimat Süresi',
      value: '28 dk',
      change: '-8%',
      trend: 'down',
      icon: Clock,
      color: 'orange',
      subtitle: 'Bu hafta'
    }
  ];

  const todayRoutes = [
    { id: 1, driver: 'Mehmet Öz', vehicle: '34 ABC 123', status: 'active', progress: 65, deliveries: '12/18' },
    { id: 2, driver: 'Ali Yılmaz', vehicle: '34 DEF 456', status: 'active', progress: 40, deliveries: '8/20' },
    { id: 3, driver: 'Ayşe Kaya', vehicle: '34 GHI 789', status: 'completed', progress: 100, deliveries: '15/15' },
    { id: 4, driver: 'Fatma Demir', vehicle: '34 JKL 012', status: 'pending', progress: 0, deliveries: '0/22' },
    { id: 5, driver: 'Ahmet Can', vehicle: '34 MNO 345', status: 'active', progress: 85, deliveries: '17/20' }
  ];

  const recentActivities = [
    { id: 1, type: 'delivery', message: 'Teslimat tamamlandı - Bakkal Mehmet', time: '5 dk önce', icon: CheckCircle, color: 'text-green-600' },
    { id: 2, type: 'route', message: 'Yeni rota oluşturuldu - Kadıköy Bölgesi', time: '15 dk önce', icon: Route, color: 'text-blue-600' },
    { id: 3, type: 'alert', message: 'Trafik yoğunluğu - D-100 Karayolu', time: '30 dk önce', icon: AlertCircle, color: 'text-yellow-600' },
    { id: 4, type: 'driver', message: 'Sürücü sefere başladı - Ali Yılmaz', time: '1 saat önce', icon: Truck, color: 'text-purple-600' },
    { id: 5, type: 'delivery', message: 'Teslimat tamamlandı - Market 24', time: '2 saat önce', icon: CheckCircle, color: 'text-green-600' }
  ];

  // Mock chart data
  const weeklyData = [
    { day: 'Pzt', deliveries: 145, target: 150 },
    { day: 'Sal', deliveries: 138, target: 150 },
    { day: 'Çar', deliveries: 162, target: 150 },
    { day: 'Per', deliveries: 155, target: 150 },
    { day: 'Cum', deliveries: 148, target: 150 },
    { day: 'Cmt', deliveries: 95, target: 100 },
    { day: 'Paz', deliveries: 45, target: 50 }
  ];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Hoş geldiniz! İşte bugünkü özet bilgileriniz.</p>
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
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
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
            <h2 className="text-lg font-semibold text-gray-900">Haftalık Teslimat Performansı</h2>
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
                    <div 
                      className="absolute top-0 left-0 h-full border-r-2 border-dashed border-gray-400"
                      style={{ left: `${(day.target / 200) * 100}%` }}
                    />
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
              <div className="flex items-center">
                <div className="w-0.5 h-3 bg-gray-400 mr-2"></div>
                <span className="text-gray-600">Hedef</span>
              </div>
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
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link 
            to="/activities" 
            className="block w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
          >
            Tümünü Gör →
          </Link>
        </div>
      </div>

      {/* Today's Routes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Bugünkü Rotalar</h2>
            <Link 
              to="/routes" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Tümünü Gör →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
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
                          {route.driver.split(' ').map(n => n[0]).join('')}
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;