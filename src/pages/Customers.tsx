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
  Loader2
} from 'lucide-react';
import { Customer } from '@/types';
import { customerService } from '@/services/mockData';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
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
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags
  const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || customer.priority === selectedPriority;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => customer.tags?.includes(tag));
    
    return matchesSearch && matchesPriority && matchesTags;
  });

  // Delete customer
  const handleDelete = async (id: string) => {
    if (window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      await customerService.delete(id);
      loadCustomers();
    }
  };

  // Export customers to CSV
  const handleExport = () => {
    const csvHeaders = ['Kod', 'İsim', 'Adres', 'Telefon', 'Email', 'Öncelik', 'Zaman Penceresi', 'Etiketler', 'Notlar'];
    
    const csvData = filteredCustomers.map(customer => [
      customer.code,
      customer.name,
      customer.address,
      customer.phone,
      customer.email || '',
      getPriorityLabel(customer.priority),
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
    link.download = `musteriler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Import customers from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const newCustomers: Partial<Customer>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV satırını parse et (tırnak işaretlerini dikkate al)
        const values = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim()) || [];
        
        if (values.length >= 4) { // En az kod, isim, adres, telefon olmalı
          const [timeStart, timeEnd] = values[6] ? values[6].split('-') : ['', ''];
          const tags = values[7] ? values[7].split(',').map(t => t.trim()) : [];
          
          newCustomers.push({
            code: values[0],
            name: values[1],
            address: values[2],
            phone: values[3],
            email: values[4] || undefined,
            priority: values[5]?.toLowerCase() === 'yüksek' ? 'high' : 
                     values[5]?.toLowerCase() === 'düşük' ? 'low' : 'normal',
            timeWindow: timeStart && timeEnd ? { start: timeStart.trim(), end: timeEnd.trim() } : undefined,
            tags: tags.length > 0 ? tags : undefined,
            notes: values[8] || undefined,
            // Varsayılan koordinatlar (gerçek uygulamada geocoding API kullanılabilir)
            latitude: 40.9869 + Math.random() * 0.1,
            longitude: 29.0252 + Math.random() * 0.1
          });
        }
      }
      
      if (newCustomers.length > 0) {
        try {
          await customerService.bulkImport(newCustomers);
          alert(`✅ ${newCustomers.length} müşteri başarıyla içe aktarıldı!`);
          loadCustomers();
        } catch (error) {
          alert('❌ İçe aktarma sırasında bir hata oluştu.');
          console.error('Import error:', error);
        }
      } else {
        alert('⚠️ İçe aktarılacak geçerli müşteri bulunamadı.');
      }
    };
    
    reader.readAsText(file, 'UTF-8');
    
    // Input'u temizle (aynı dosya tekrar seçilebilsin)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const template = [
      'Kod,İsim,Adres,Telefon,Email,Öncelik,Zaman Penceresi,Etiketler,Notlar',
      'MUS001,Örnek Market,Kadıköy Moda Cad. No:1,0532 111 2233,ornek@email.com,Normal,09:00-17:00,"market,vip",Özel notlar'
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'musteri_sablonu.csv';
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
          <div className="relative group">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              CSV dosyası seçin. 
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate();
                }}
                className="text-blue-300 underline pointer-events-auto"
              >
                Örnek şablon indir
              </button>
            </div>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Yüksek Öncelikli</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {customers.filter(c => c.priority === 'high').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="normal">Normal</option>
              <option value="low">Düşük</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedPriority !== 'all' || selectedTags.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority('all');
                setSelectedTags([]);
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
                  onClick={() => toggleTag(tag)}
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

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Öncelik
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
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Müşteri bulunamadı</p>
                      <p className="text-sm mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                          {customer.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                          {getPriorityLabel(customer.priority)}
                        </span>
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
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
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
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Müşteri bulunamadı</p>
              <p className="text-sm text-gray-400 mt-1">Filtrelerinizi değiştirmeyi deneyin</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
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

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                    {customer.priority === 'high' && <Star className="w-3 h-3 mr-1" />}
                    {getPriorityLabel(customer.priority)}
                  </span>
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex gap-1">
                      {customer.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Customers;