import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MapPin,
  Phone,
  Mail,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  Grid,
  List,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  FileDown,
  FileUp,
  HelpCircle,
  Map
} from 'lucide-react';
import { Customer } from '@/types';
import { customerService } from '@/services/customer.service';
import MapComponent, { MarkerStyle } from '@/components/maps/MapComponent';
import { MarkerData } from '@/types/maps';
import { normalizeSearchText } from '@/utils/string';

type SortField = 'name' | 'code' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'table' | 'grid' | 'map';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [quickFilter, setQuickFilter] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>('bubble'); // Sosyal medya için bubble daha şık
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'Müşteriler yüklenirken hata oluştu';
      console.error('User-friendly error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));

  // Quick filters
  const applyQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    setSearchQuery('');
    setSelectedTags([]);

    switch(filter) {
      case 'vip':
        setSelectedTags(['vip']);
        break;
      case 'time_window':
        // Filtre fonksiyonunda zaten kontrol ediliyor
        break;
      case 'recent':
        // Son 7 gün - filtre fonksiyonunda kontrol edilecek
        break;
      case 'all':
      default:
        break;
    }
  };

  // Filter customers
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !normalizedSearchQuery ||
      normalizeSearchText(customer.name).includes(normalizedSearchQuery) ||
      normalizeSearchText(customer.code).includes(normalizedSearchQuery) ||
      normalizeSearchText(customer.address).includes(normalizedSearchQuery) ||
      normalizeSearchText(customer.phone).includes(normalizedSearchQuery);

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => customer.tags?.includes(tag));

    // Quick filter: time window
    const matchesTimeWindow = quickFilter !== 'time_window' || customer.timeWindow;

    // Quick filter: recent (son 7 gün)
    const matchesRecent = quickFilter !== 'recent' || (() => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return customer.createdAt && new Date(customer.createdAt) >= sevenDaysAgo;
    })();

    // Quick filter: son 1 ay içinde teslimat yapılanlar
    const matchesLastMonth = quickFilter !== 'last_1_month' || (() => {
      if (!customer.lastDeliveryDate) return false;
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(customer.lastDeliveryDate) >= oneMonthAgo;
    })();

    // Quick filter: son 3 ay içinde teslimat yapılanlar
    const matchesLast3Months = quickFilter !== 'last_3_months' || (() => {
      if (!customer.lastDeliveryDate) return false;
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return new Date(customer.lastDeliveryDate) >= threeMonthsAgo;
    })();

    return matchesSearch && matchesTags && matchesTimeWindow && matchesRecent && matchesLastMonth && matchesLast3Months;
  });

  // Sorting
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'tr');
        break;
      case 'code':
        comparison = a.code.localeCompare(b.code, 'tr');
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Bulk selection
  const toggleCustomerSelection = (customerId: number) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === sortedCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(sortedCustomers.map(c => c.id)));
    }
  };

  // Delete customer
  const handleDelete = async (id: number) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      await customerService.delete(id);
      loadCustomers();
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) return;

    if (window.confirm(`${selectedCustomers.size} müşteriyi silmek istediğinizden emin misiniz?`)) {
      try {
        await Promise.all(
          Array.from(selectedCustomers).map(id => customerService.delete(id))
        );
        setSelectedCustomers(new Set());
        loadCustomers();
      } catch (error) {
        console.error('Toplu silme hatası:', error);
        alert('Bazı müşteriler silinemedi. Lütfen tekrar deneyin.');
      }
    }
  };

  // Export customers to CSV
  const handleExport = () => {
    const dataToExport = selectedCustomers.size > 0
      ? sortedCustomers.filter(c => selectedCustomers.has(c.id))
      : sortedCustomers;

    const csvHeaders = ['Kod', 'İsim', 'Adres', 'Telefon', 'Email', 'Zaman Penceresi', 'Etiketler', 'Notlar'];

    const csvData = dataToExport.map(customer => [
      customer.code,
      customer.name,
      customer.address,
      customer.phone,
      customer.email || '',
      customer.timeWindow ? `${customer.timeWindow.start}-${customer.timeWindow.end}` : '',
      customer.tags?.join(', ') || '',
      customer.notes || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = selectedCustomers.size > 0
      ? `secili_musteriler_${new Date().toISOString().split('T')[0]}.csv`
      : `tum_musteriler_${new Date().toISOString().split('T')[0]}.csv`;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Import customers from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // BUGFIX S5.4: File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_ROWS = 1000;

    // 1. File type check
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('❌ Sadece CSV dosyaları yüklenebilir!');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. File size check
    if (file.size > MAX_FILE_SIZE) {
      alert(`❌ Dosya boyutu çok büyük!\nMaksimum dosya boyutu: 5MB\nSeçilen dosya: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;

        // 3. Malicious content check - script tags, executable code patterns
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /on\w+\s*=/i, // onclick, onerror, etc.
          /eval\(/i,
          /expression\(/i,
          /<iframe/i,
          /<object/i,
          /<embed/i
        ];

        if (dangerousPatterns.some(pattern => pattern.test(text))) {
          alert('❌ Güvenlik: Dosya zararlı içerik içeriyor!');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const lines = text.split('\n');

        // 4. Row count check
        if (lines.length > MAX_ROWS + 1) { // +1 for header
          alert(`❌ Çok fazla satır!\nMaksimum ${MAX_ROWS} müşteri yüklenebilir.\nDosyanızdaki satır sayısı: ${lines.length - 1}`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        const newCustomers: Partial<Customer>[] = [];
        const warnings: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // CSV satırını parse et (tırnak işaretlerini dikkate al)
          const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim()) || [];

          if (values.length >= 4) { // En az kod, isim, adres, telefon olmalı
            const [timeStart, timeEnd] = values[5] ? values[5].split('-') : ['', ''];
            const tags = values[6] ? values[6].split(',').map(t => t.trim()) : [];

            newCustomers.push({
              code: values[0],
              name: values[1],
              address: values[2],
              phone: values[3],
              email: values[4] || undefined,
              timeWindow: timeStart && timeEnd ? { start: timeStart.trim(), end: timeEnd.trim() } : undefined,
              tags: tags.length > 0 ? tags : undefined,
              notes: values[7] || undefined,
              // ⚠️ UYARI: Koordinat bilgisi yok - manuel girilmeli
              latitude: undefined,
              longitude: undefined
            });

            warnings.push(`⚠️ ${values[1]}: Koordinat bilgisi yok - manuel girilmeli`);
          }
        }

        if (newCustomers.length > 0) {
          const confirmMessage = `✅ ${newCustomers.length} müşteri içe aktarılacak.\n\n` +
            `⚠️ ÖNEMLİ: Koordinat bilgileri eksik!\n` +
            `İçe aktarılan müşterilerin koordinatlarını manuel olarak girmeniz gerekecek.\n\n` +
            `Devam etmek istiyor musunuz?`;

          if (window.confirm(confirmMessage)) {
            try {
              await customerService.bulkImport(newCustomers);
              alert(`✅ ${newCustomers.length} müşteri başarıyla içe aktarıldı!\n\n⚠️ Koordinatları düzenlemeyi unutmayın!`);
              loadCustomers();
            } catch (error: any) {
              const errorMessage = error.userFriendlyMessage || error.response?.data?.message || 'İçe aktarma sırasında bir hata oluştu';
              alert(`❌ ${errorMessage}`);
              console.error('Import error:', error);
            }
          }
        } else {
          alert('⚠️ İçe aktarılacak geçerli müşteri bulunamadı.');
        }
      } catch (error) {
        console.error('File processing error:', error);
        alert('❌ Dosya işlenirken hata oluştu. Lütfen geçerli bir CSV dosyası yükleyin.');
      }
    };

    reader.onerror = () => {
      alert('❌ Dosya okuma hatası!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file, 'UTF-8');

    // Input'u temizle (aynı dosya tekrar seçilebilsin)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = [
      'Kod,İsim,Adres,Telefon,Email,Zaman Penceresi,Etiketler,Notlar',
      'MUS001,Örnek Market,Kadıköy Moda Cad. No:1,0532 111 2233,ornek@email.com,09:00-17:00,"market,vip",Özel notlar',
      'MUS002,ABC Ltd.,Beşiktaş Barbaros Bulvarı No:52,0533 222 3344,abc@example.com,10:00-16:00,toptan,',
      'MUS003,XYZ Market,Şişli Osmanbey Cad. No:15,0534 333 4455,,,,"Kapıda ödeme"'
    ].join('\n');

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'musteri_sablonu.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // ✅ YENİ: Dropdown pozisyonunu hesapla
  const getDropdownPosition = (index: number, totalItems: number) => {
    // Son 2 satırda veya tek kayıt varsa yukarı aç
    const shouldOpenUpward = totalItems <= 2 || index >= totalItems - 2;
    return shouldOpenUpward ? 'bottom-full mb-2' : 'top-full mt-2';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 text-blue-600" /> :
      <ChevronDown className="w-4 h-4 text-blue-600" />;
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
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-gray-600 mt-1">Tüm müşterilerinizi yönetin</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Import Button with Help */}
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <FileUp className="w-4 h-4 mr-2" />
              İçe Aktar
            </button>
            <button
              onClick={() => setShowImportHelp(!showImportHelp)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-yellow-600 transition-colors"
              title="Yardım"
            >
              ?
            </button>

            {/* Import Help Modal */}
            {showImportHelp && (
              <>
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-40"
                  onClick={() => setShowImportHelp(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <HelpCircle className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">Excel İçe Aktarma</h3>
                    </div>
                    <button
                      onClick={() => setShowImportHelp(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📋 Adımlar:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        <li>Şablon dosyasını indirin</li>
                        <li>Excel'de açıp müşteri bilgilerini doldurun</li>
                        <li>CSV formatında kaydedin</li>
                        <li>"İçe Aktar" butonuna tıklayın</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Önemli Not:</h4>
                      <p className="text-yellow-700 text-xs">
                        İçe aktarılan müşterilerin <strong>koordinat bilgileri boş</strong> gelecektir.
                        Her müşteri için haritadan konum seçmelisiniz.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📝 Sütun Açıklamaları:</h4>
                      <ul className="space-y-1 text-gray-600 text-xs">
                        <li><strong>Kod:</strong> Benzersiz müşteri kodu (zorunlu)</li>
                        <li><strong>İsim:</strong> Müşteri adı (zorunlu)</li>
                        <li><strong>Adres:</strong> Açık adres (zorunlu)</li>
                        <li><strong>Telefon:</strong> İletişim numarası (zorunlu)</li>
                        <li><strong>Email:</strong> E-posta adresi (opsiyonel)</li>
                        <li><strong>Zaman Penceresi:</strong> 09:00-17:00 formatında</li>
                        <li><strong>Etiketler:</strong> Virgülle ayrılmış (vip,toptan)</li>
                        <li><strong>Notlar:</strong> Ek bilgiler (opsiyonel)</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        downloadTemplate();
                        setShowImportHelp(false);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Şablon Dosyasını İndir
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 border border-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {selectedCustomers.size > 0 ? `Seçilenleri Dışa Aktar (${selectedCustomers.size})` : 'Dışa Aktar'}
          </button>

          <Link
            to="/customers/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Müşteri
          </Link>
        </div>
      </div>

      {/* Stats Cards - Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VIP Müşteri</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {customers.filter(c => c.tags?.includes('vip')).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Zaman Pencereli</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {customers.filter(c => c.timeWindow).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Hızlı Filtre:</span>
          <button
            onClick={() => applyQuickFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tümü ({customers.length})
          </button>
          <button
            onClick={() => applyQuickFilter('vip')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'vip'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            VIP ({customers.filter(c => c.tags?.includes('vip')).length})
          </button>
          <button
            onClick={() => applyQuickFilter('time_window')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'time_window'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Zaman Pencereli ({customers.filter(c => c.timeWindow).length})
          </button>
          <button
            onClick={() => applyQuickFilter('recent')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'recent'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Son Eklenenler
          </button>
          <button
            onClick={() => applyQuickFilter('last_1_month')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'last_1_month'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Son 1 Ay Teslimat ({customers.filter(c => {
              if (!c.lastDeliveryDate) return false;
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              return new Date(c.lastDeliveryDate) >= oneMonthAgo;
            }).length})
          </button>
          <button
            onClick={() => applyQuickFilter('last_3_months')}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              quickFilter === 'last_3_months'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Son 3 Ay Teslimat ({customers.filter(c => {
              if (!c.lastDeliveryDate) return false;
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              return new Date(c.lastDeliveryDate) >= threeMonthsAgo;
            }).length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Müşteri ara (isim, kod, adres, telefon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Tablo Görünümü"
              >
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  <span className="text-sm font-medium">Tablo</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Kart Görünümü"
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  <span className="text-sm font-medium">Kartlar</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title="Harita Görünümü"
              >
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  <span className="text-sm font-medium">Harita</span>
                </div>
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedTags.length > 0 || quickFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
                setQuickFilter('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-600">Etiketler:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = selectedTags.includes(tag)
                      ? selectedTags.filter(t => t !== tag)
                      : [...selectedTags, tag];
                    setSelectedTags(newTags);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Counter and Bulk Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{sortedCustomers.length}</span> müşteri gösteriliyor
          {sortedCustomers.length !== customers.length && (
            <span className="text-gray-500"> ({customers.length} toplam)</span>
          )}
        </p>

        {selectedCustomers.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">{selectedCustomers.size}</span> müşteri seçildi
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Seçilenleri Sil
            </button>
            <button
              onClick={() => setSelectedCustomers(new Set())}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Map View */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          {/* Marker Style Selector */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Harita Görünümü</h3>
                <p className="text-xs text-gray-500">
                  {sortedCustomers.filter(c => c.latitude && c.longitude).length} müşteri konumu
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium mr-2">Marker Stili:</span>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-1 gap-1">
                  <button
                    onClick={() => setMarkerStyle('bubble')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      markerStyle === 'bubble'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Yuvarlak baloncuk marker - Sosyal medya için ideal"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-current"></div>
                      <span>Bubble</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMarkerStyle('pin')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      markerStyle === 'pin'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Modern pin marker - Klasik stil"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>Pin</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMarkerStyle('shield')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      markerStyle === 'shield'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Kalkan marker - Premium görünüm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-4 bg-current" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
                      <span>Shield</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setMarkerStyle('emoji')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      markerStyle === 'emoji'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Emoji marker - Eğlenceli ve renkli"
                  >
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>Emoji</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <MapComponent
            height="600px"
            customers={sortedCustomers.filter(c => c.latitude && c.longitude)}
            markers={sortedCustomers
              .filter(c => c.latitude && c.longitude)
              .map((customer, index) => ({
                position: { lat: customer.latitude!, lng: customer.longitude! },
                title: customer.name,
                customerId: customer.id.toString()
              } as MarkerData))
            }
            center={
              sortedCustomers.length > 0 && sortedCustomers[0].latitude && sortedCustomers[0].longitude
                ? { lat: sortedCustomers[0].latitude, lng: sortedCustomers[0].longitude }
                : undefined
            }
            zoom={11}
            markerStyle={markerStyle}
          />

          {/* Koordinatsız müşteriler uyarısı */}
          {sortedCustomers.some(c => !c.latitude || !c.longitude) && (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {sortedCustomers.filter(c => !c.latitude || !c.longitude).length} müşterinin koordinat bilgisi eksik
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Bu müşteriler haritada gösterilemiyor. Düzenle butonuna tıklayarak konum ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === sortedCustomers.length && sortedCustomers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Müşteri
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zaman Penceresi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etiketler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Müşteri bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  sortedCustomers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-1" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{customer.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        {customer.timeWindow ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {customer.timeWindow.start} - {customer.timeWindow.end}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.tags && customer.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === customer.id ? null : customer.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {dropdownOpen === customer.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className={`absolute right-0 w-48 bg-white rounded-lg shadow-lg border py-1 z-20 ${getDropdownPosition(index, sortedCustomers.length)}`}>
                                <Link
                                  to={`/customers/${customer.id}`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Görüntüle
                                </Link>
                                <Link
                                  to={`/customers/${customer.id}/edit`}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-gray-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Düzenle
                                </Link>
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    handleDelete(customer.id);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2 hover:bg-gray-50 text-red-600 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Sil
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedCustomers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Müşteri bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            sortedCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative">
                {/* Checkbox for selection */}
                <input
                  type="checkbox"
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => toggleCustomerSelection(customer.id)}
                  className="absolute top-3 left-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 z-10"
                />

                <div className="flex items-start justify-between mb-3 ml-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{customer.name}</h3>
                      <p className="text-xs text-gray-500">{customer.code}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(dropdownOpen === customer.id ? null : customer.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {dropdownOpen === customer.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setDropdownOpen(null)}
                        />
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-20">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Eye className="w-3 h-3 mr-2" />
                            Görüntüle
                          </Link>
                          <Link
                            to={`/customers/${customer.id}/edit`}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm"
                            onClick={() => setDropdownOpen(null)}
                          >
                            <Edit className="w-3 h-3 mr-2" />
                            Düzenle
                          </Link>
                          <hr className="my-1" />
                          <button
                            onClick={() => {
                              handleDelete(customer.id);
                              setDropdownOpen(null);
                            }}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-50 text-red-600 w-full text-left text-sm"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Sil
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.timeWindow && (
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {customer.timeWindow.start} - {customer.timeWindow.end}
                    </div>
                  )}
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1 flex-wrap">
                    {customer.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Customers;
