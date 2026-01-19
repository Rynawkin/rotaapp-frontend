import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  User,
  Truck,
  Package,
  Clock,
  ChevronRight,
  Filter,
  Download,
  Eye,
  X,
  Calendar,
  AlertCircle,
  Award,
  ThumbsUp,
  ThumbsDown,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { feedbackService, FeedbackItem, FeedbackStats } from '@/services/feedback.service';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { normalizeSearchText } from '@/utils/string';

interface Props {
  startDate: string;
  endDate: string;
}

export const CustomerFeedbackReport: React.FC<Props> = ({ startDate, endDate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterDriverId, setFilterDriverId] = useState<number | null>(null);
  const [view, setView] = useState<'overview' | 'details'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'rating' | 'routeDate'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [startDate, endDate, currentPage, filterRating]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, feedbacksData] = await Promise.all([
        feedbackService.getFeedbackStats(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        ),
        feedbackService.getFeedbacks({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          page: currentPage,
          pageSize: 10,
          minRating: filterRating || undefined,
          maxRating: filterRating || undefined
        })
      ]);

      setStats(statsData);
      setFeedbacks(feedbacksData.data);
      setTotalPages(feedbacksData.totalPages);
    } catch (error) {
      toast.error('Feedback verileri yüklenemedi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const blob = await feedbackService.exportFeedbacksCSV({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musteri-memnuniyeti-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV dosyası indirildi');
    } catch (error) {
      toast.error('CSV indirilemedi');
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    if (rating >= 1.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100';
    if (rating >= 3.5) return 'bg-blue-100';
    if (rating >= 2.5) return 'bg-yellow-100';
    if (rating >= 1.5) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Filtreleme ve sıralama
  const getFilteredAndSortedFeedbacks = () => {
    let filtered = [...feedbacks];

    // Arama filtresi
    if (searchTerm) {
      const normalizedSearchTerm = normalizeSearchText(searchTerm);
      filtered = filtered.filter(f => {
        const name = normalizeSearchText(f.customer.name);
        const address = normalizeSearchText(f.customer.address);
        return name.includes(normalizedSearchTerm) || address.includes(normalizedSearchTerm);
      });
    }

    // Şoför filtresi
    if (filterDriverId) {
      filtered = filtered.filter(f => f.driver?.id === filterDriverId);
    }

    // Sıralama
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'submittedAt') {
        compareValue = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else if (sortBy === 'rating') {
        compareValue = a.overallRating - b.overallRating;
      } else if (sortBy === 'routeDate') {
        compareValue = new Date(a.journey.date).getTime() - new Date(b.journey.date).getTime();
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  };

  const handleSort = (field: 'submittedAt' | 'rating' | 'routeDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Excel export (filtrelenmiş sonuçlar)
  const exportToExcel = () => {
    const filteredData = getFilteredAndSortedFeedbacks();

    if (filteredData.length === 0) {
      toast.error('Dışa aktarılacak veri yok');
      return;
    }

    // CSV formatında oluştur (Excel tarafından açılabilir)
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'Müşteri,Adres,Sürücü,Genel Puan,Hız Puanı,Sürücü Davranış Puanı,Paket Durum Puanı,Yorum,Rota Tarihi,Form Gönderim Tarihi\n';

    filteredData.forEach(feedback => {
      const row = [
        feedback.customer.name,
        feedback.customer.address,
        feedback.driver?.name || '-',
        feedback.overallRating,
        feedback.deliverySpeedRating || '-',
        feedback.driverBehaviorRating || '-',
        feedback.packageConditionRating || '-',
        (feedback.comments || '-').replace(/"/g, '""'), // CSV escape
        format(new Date(feedback.journey.date), 'dd/MM/yyyy'),
        format(new Date(feedback.submittedAt), 'dd/MM/yyyy HH:mm')
      ];
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `musteri-memnuniyeti-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${filteredData.length} kayıt Excel'e aktarıldı`);
  };

  // Benzersiz şoförleri al
  const getUniqueDrivers = () => {
    const driversMap = new Map();
    feedbacks.forEach(f => {
      if (f.driver) {
        driversMap.set(f.driver.id, f.driver);
      }
    });
    return Array.from(driversMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Henüz müşteri geri bildirimi bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Müşteri Memnuniyeti</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border">
            <button
              onClick={() => setView('overview')}
              className={`px-3 py-1 rounded ${
                view === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Genel Bakış
            </button>
            <button
              onClick={() => setView('details')}
              className={`px-3 py-1 rounded ${
                view === 'details'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Detaylı Liste
            </button>
          </div>
          {view === 'overview' ? (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV İndir
            </button>
          ) : (
            <button
              onClick={exportToExcel}
              disabled={getFilteredAndSortedFeedbacks().length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel İndir ({getFilteredAndSortedFeedbacks().length})
            </button>
          )}
        </div>
      </div>

      {view === 'overview' ? (
        <>
          {/* KPI Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
                <span className={`text-xs font-medium ${
                  stats.averageOverallRating >= 4 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {stats.averageOverallRating >= 4 ? '↑' : '↓'} 
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageOverallRating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Genel Memnuniyet</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageDeliverySpeedRating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Teslimat Hızı</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <User className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageDriverBehaviorRating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Sürücü Davranışı</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averagePackageConditionRating?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Paket Durumu</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalFeedbacks}
              </p>
              <p className="text-sm text-gray-600 mt-1">Toplam Geri Bildirim</p>
            </div>
          </div>

          {/* Grafikler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Puan Dağılımı */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Puan Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Adet">
                    {stats.ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {stats.ratingDistribution.map((item) => (
                  <div key={item.rating} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(item.rating)}</div>
                      <span className="text-sm text-gray-600">
                        {item.rating} Yıldız
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zaman Bazlı Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Memnuniyet Trendi</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.trendsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="averageRating" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                    name="Ortalama Puan"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* En İyi Sürücüler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                En İyi Sürücüler
              </h3>
              <div className="space-y-3">
                {stats.topDrivers.map((driver, index) => (
                  <div key={driver.driverId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{driver.driverName}</p>
                        <p className="text-sm text-gray-600">{driver.feedbackCount} değerlendirme</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-900">
                        {driver.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gelişim Gereken Sürücüler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Gelişim Gereken Sürücüler
              </h3>
              <div className="space-y-3">
                {stats.bottomDrivers.map((driver) => (
                  <div key={driver.driverId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-gray-900">{driver.driverName}</p>
                        <p className="text-sm text-gray-600">{driver.feedbackCount} değerlendirme</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-orange-600">
                        {driver.averageRating?.toFixed(1) || '0.0'}
                      </span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Son Yorumlar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Müşteri Yorumları</h3>
            <div className="space-y-4">
              {stats.recentFeedbacks.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-medium text-gray-900">{feedback.customer.name}</p>
                        <div className="flex">{renderStars(feedback.overallRating)}</div>
                        <span className="text-sm text-gray-500">
                          Form: {format(new Date(feedback.submittedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </span>
                        <span className="text-sm text-gray-400">
                          | Rota: {format(new Date(feedback.journey.date), 'dd MMM yyyy', { locale: tr })}
                        </span>
                      </div>
                      {feedback.comments && (
                        <p className="text-gray-700 mt-2">{feedback.comments}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {feedback.driver && (
                          <span>Sürücü: {feedback.driver.name}</span>
                        )}
                        <span>Adres: {feedback.customer.address}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setShowDetailModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Detaylı Liste Görünümü */
        <div className="bg-white rounded-xl shadow-sm">
          {/* Filtreler ve Arama */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />

                {/* Puan Filtresi */}
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tüm Puanlar</option>
                  <option value="5">5 Yıldız</option>
                  <option value="4">4 Yıldız</option>
                  <option value="3">3 Yıldız</option>
                  <option value="2">2 Yıldız</option>
                  <option value="1">1 Yıldız</option>
                </select>

                {/* Şoför Filtresi */}
                <select
                  value={filterDriverId || ''}
                  onChange={(e) => setFilterDriverId(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tüm Şoförler</option>
                  {getUniqueDrivers().map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                  ))}
                </select>

                {/* Arama */}
                <div className="relative flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Müşteri adı ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {getFilteredAndSortedFeedbacks().length} / {stats.totalFeedbacks} kayıt
              </div>
            </div>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Müşteri</th>
                  <th
                    className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('rating')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Genel Puan
                      {sortBy === 'rating' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Hız</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Sürücü</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Paket</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Yorum</th>
                  <th
                    className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('routeDate')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Rota Tarihi
                      {sortBy === 'routeDate' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('submittedAt')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Form Tarihi
                      {sortBy === 'submittedAt' && (
                        <span className="text-blue-600">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedFeedbacks().map((feedback) => (
                  <tr key={feedback.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.customer.name}</p>
                        <p className="text-sm text-gray-600">{feedback.customer.address}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`font-bold ${getRatingColor(feedback.overallRating)}`}>
                          {feedback.overallRating}
                        </span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {feedback.deliverySpeedRating ? (
                        <span className={getRatingColor(feedback.deliverySpeedRating)}>
                          {feedback.deliverySpeedRating}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-center py-3 px-4">
                      {feedback.driverBehaviorRating ? (
                        <span className={getRatingColor(feedback.driverBehaviorRating)}>
                          {feedback.driverBehaviorRating}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="text-center py-3 px-4">
                      {feedback.packageConditionRating ? (
                        <span className={getRatingColor(feedback.packageConditionRating)}>
                          {feedback.packageConditionRating}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {feedback.comments ? (
                        <p className="text-sm text-gray-700 truncate max-w-xs">
                          {feedback.comments}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4 text-sm text-gray-600">
                      {format(new Date(feedback.journey.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {format(new Date(feedback.submittedAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {format(new Date(feedback.submittedAt), 'HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setShowDetailModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="text-sm text-gray-600">
                Sayfa {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detay Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Geri Bildirim Detayı</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Müşteri Bilgileri */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Müşteri Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ad Soyad:</span>
                    <span className="font-medium">{selectedFeedback.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adres:</span>
                    <span className="font-medium">{selectedFeedback.customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Değerlendirmeyi Yapan Kişi */}
              {selectedFeedback.submitterName && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Değerlendirmeyi Yapan Kişi</h4>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ad Soyad:</span>
                      <span className="font-medium">{selectedFeedback.submitterName}</span>
                    </div>
                    {selectedFeedback.submitterPhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefon:</span>
                        <span className="font-medium">{selectedFeedback.submitterPhone}</span>
                      </div>
                    )}
                    {selectedFeedback.submitterEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">E-posta:</span>
                        <span className="font-medium">{selectedFeedback.submitterEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Teslimat Bilgileri */}
              {selectedFeedback.driver && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Teslimat Bilgileri</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sürücü:</span>
                      <span className="font-medium">{selectedFeedback.driver.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarih:</span>
                      <span className="font-medium">
                        {format(new Date(selectedFeedback.journey.date), 'dd MMMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Puanlama Detayları */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Değerlendirme</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-gray-700">Genel Memnuniyet</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(selectedFeedback.overallRating)}</div>
                      <span className="font-bold text-gray-900">
                        {selectedFeedback.overallRating}/5
                      </span>
                    </div>
                  </div>
                  
                  {selectedFeedback.deliverySpeedRating && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-gray-700">Teslimat Hızı</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(selectedFeedback.deliverySpeedRating)}</div>
                        <span className="font-bold text-gray-900">
                          {selectedFeedback.deliverySpeedRating}/5
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedFeedback.driverBehaviorRating && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-gray-700">Sürücü Davranışı</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(selectedFeedback.driverBehaviorRating)}</div>
                        <span className="font-bold text-gray-900">
                          {selectedFeedback.driverBehaviorRating}/5
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedFeedback.packageConditionRating && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-gray-700">Paket Durumu</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(selectedFeedback.packageConditionRating)}</div>
                        <span className="font-bold text-gray-900">
                          {selectedFeedback.packageConditionRating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Müşteri Yorumu */}
              {selectedFeedback.comments && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Müşteri Yorumu</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{selectedFeedback.comments}"</p>
                  </div>
                </div>
              )}

              {/* Tarih Bilgileri */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Tarih Bilgileri</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rota Tarihi:</span>
                    <span className="font-medium">
                      {format(new Date(selectedFeedback.journey.date), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Form Gönderim Tarihi:</span>
                    <span className="font-medium">
                      {format(new Date(selectedFeedback.submittedAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
