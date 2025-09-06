// frontend/src/components/routes/CustomerSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Phone,
  Clock,
  Star,
  Check,
  UserPlus,
  Package,
  CheckSquare,
  Square,
  Users
} from 'lucide-react';
import { Customer } from '@/types';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomers: Customer[];
  onSelect?: (customer: Customer) => void; // Tek seçim için
  onMultiSelect?: (customers: Customer[]) => void; // Çoklu seçim için
  onCreateNew?: () => void;
  multiSelectMode?: boolean; // Çoklu seçim modu
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomers,
  onSelect,
  onMultiSelect,
  onCreateNew,
  multiSelectMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [multiSelectList, setMultiSelectList] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search local customers only
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else if (multiSelectMode) {
        // Multi-select modunda tüm müşterileri göster
        showAllCustomers();
      } else {
        setFilteredCustomers([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, customers, multiSelectMode]);

  const showAllCustomers = () => {
    const filtered = customers.filter(customer => {
      // Sadece numeric ID'li (veritabanındaki) müşterileri göster
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        return false;
      }

      // Zaten seçili olanları gösterme (single select mode)
      if (!multiSelectMode && isSelected(customer.id.toString())) {
        return false;
      }

      return true;
    });

    setFilteredCustomers(filtered);
    setIsDropdownOpen(true);
  };

  const performSearch = (query: string) => {
    // Search local customers only
    const lowerQuery = query.toLowerCase();
    const filtered = customers.filter(customer => {
      // Sadece numeric ID'li (veritabanındaki) müşterileri göster
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        return false;
      }

      // Single select modda zaten seçili olanları gösterme
      if (!multiSelectMode && isSelected(customer.id.toString())) {
        return false;
      }

      return (
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.code?.toLowerCase().includes(lowerQuery) ||
        customer.address.toLowerCase().includes(lowerQuery) ||
        customer.phone?.includes(query)
      );
    });

    setFilteredCustomers(filtered);
    setIsDropdownOpen(filtered.length > 0 || (multiSelectMode && query.trim() === ''));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (!multiSelectMode) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [multiSelectMode]);

  // Multi-select modunda başlangıçta tüm müşterileri göster
  useEffect(() => {
    if (multiSelectMode && filteredCustomers.length === 0 && !searchQuery) {
      showAllCustomers();
    }
  }, [multiSelectMode]);

  const handleSelectCustomer = (customer: Customer) => {
    // ID kontrolü - sadece numeric ID'li müşterileri ekle
    if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
      alert('⚠️ Bu müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.');
      return;
    }

    if (multiSelectMode) {
      // Multi-select modda listeye ekle/çıkar
      const customerId = customer.id.toString();
      const newSelection = new Set(multiSelectList);
      
      if (newSelection.has(customerId)) {
        newSelection.delete(customerId);
      } else {
        newSelection.add(customerId);
      }
      
      setMultiSelectList(newSelection);
    } else {
      // Single select modda direkt ekle
      if (onSelect) {
        onSelect(customer);
      }
      setSearchQuery('');
      setIsDropdownOpen(false);
    }
  };

  const handleSelectAll = () => {
    const allIds = new Set(
      filteredCustomers
        .filter(c => !isSelected(c.id.toString()))
        .map(c => c.id.toString())
    );
    setMultiSelectList(allIds);
  };

  const handleClearAll = () => {
    setMultiSelectList(new Set());
  };

  const handleAddSelected = () => {
    if (onMultiSelect) {
      const selectedCustomerObjects = Array.from(multiSelectList)
        .map(id => customers.find(c => c.id.toString() === id))
        .filter(Boolean) as Customer[];
      
      onMultiSelect(selectedCustomerObjects);
      setMultiSelectList(new Set());
      setSearchQuery('');
      setIsDropdownOpen(false);
    }
  };

  const isSelected = (customerId: string) => {
    return selectedCustomers.some(c => c.id.toString() === customerId);
  };

  const isInMultiSelectList = (customerId: string) => {
    return multiSelectList.has(customerId);
  };

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

  const getPriorityText = (priority: string) => {
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

  // Kayıtlı müşteri sayısı (Google Places hariç)
  const validCustomersCount = customers.filter(c =>
    typeof c.id === 'number' || (typeof c.id === 'string' && !c.id.startsWith('google-'))
  ).length;

  // Seçilebilir müşteri sayısı (zaten eklenmiş olanlar hariç)
  const availableCustomersCount = filteredCustomers.filter(c => 
    !isSelected(c.id.toString())
  ).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input with Add Customer Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (multiSelectMode) {
                showAllCustomers();
              } else if (searchQuery) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder={
              multiSelectMode 
                ? "Müşteri ara veya toplu seçim yap..." 
                : "Kayıtlı müşteri ara (isim, kod, adres veya telefon)..."
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {validCustomersCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {multiSelectMode && multiSelectList.size > 0 
                ? `${multiSelectList.size} seçili / ${validCustomersCount} müşteri`
                : `${validCustomersCount} müşteri`
              }
            </span>
          )}
        </div>

        {/* Toplu Seçim Toggle Butonu */}
        <button
          type="button"
          onClick={() => {
            // Parent component'te multiSelectMode'u toggle etmek için
            if (multiSelectMode) {
              setMultiSelectList(new Set());
              setIsDropdownOpen(false);
            } else {
              showAllCustomers();
            }
          }}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center whitespace-nowrap ${
            multiSelectMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          {multiSelectMode ? 'Toplu Seçim Aktif' : 'Toplu Seçim'}
        </button>

        {/* Yeni Müşteri Butonu */}
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Yeni Müşteri
        </button>
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
          
          {/* Multi-select controls */}
          {multiSelectMode && filteredCustomers.length > 0 && (
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    Tümünü Seç ({availableCustomersCount})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    Temizle
                  </button>
                </div>
                
                {multiSelectList.size > 0 && (
                  <button
                    type="button"
                    onClick={handleAddSelected}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Seçilenleri Ekle ({multiSelectList.size})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Local Customer Results */}
          {filteredCustomers.length > 0 ? (
            <>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Kayıtlı Müşteriler ({filteredCustomers.length})
                </h3>
              </div>
              {filteredCustomers.map(customer => {
                const alreadySelected = isSelected(customer.id.toString());
                const inMultiSelectList = isInMultiSelectList(customer.id.toString());

                return (
                  <div
                    key={customer.id}
                    onClick={() => !alreadySelected && handleSelectCustomer(customer)}
                    className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                      alreadySelected ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${inMultiSelectList ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Checkbox for multi-select mode */}
                      {multiSelectMode && (
                        <div className="mr-3 mt-1">
                          {alreadySelected ? (
                            <CheckSquare className="w-5 h-5 text-gray-400" />
                          ) : inMultiSelectList ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <h3 className="font-medium text-gray-900">
                            {customer.name}
                          </h3>
                          {customer.code && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({customer.code})
                            </span>
                          )}
                          {alreadySelected && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="w-3 h-3 mr-1" />
                              Eklendi
                            </span>
                          )}
                        </div>

                        <div className="flex items-start text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{customer.address}</span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm">
                          {customer.phone && (
                            <div className="flex items-center text-gray-500">
                              <Phone className="w-4 h-4 mr-1" />
                              <span>{customer.phone}</span>
                            </div>
                          )}

                          {customer.timeWindow && (
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>
                                {customer.timeWindow.start} - {customer.timeWindow.end}
                              </span>
                            </div>
                          )}

                          {customer.estimatedServiceTime && (
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{customer.estimatedServiceTime} dk</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center mt-2 space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                            <Star className="w-3 h-3 mr-1" />
                            {getPriorityText(customer.priority)}
                          </span>

                          {customer.tags?.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {customer.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                            <strong>Not:</strong> {customer.notes}
                          </div>
                        )}
                      </div>

                      {!multiSelectMode && !alreadySelected && (
                        <button
                          type="button"
                          className="ml-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            // No Results or Empty State
            <div className="p-6 text-center">
              {searchQuery ? (
                <>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    "{searchQuery}" için sonuç bulunamadı
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Müşteri henüz kayıtlı değilse önce eklemeniz gerekiyor
                  </p>
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Yeni Müşteri Ekle
                  </button>
                </>
              ) : validCustomersCount === 0 ? (
                <>
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Henüz kayıtlı müşteri yok
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Rota oluşturmak için önce müşteri eklemeniz gerekiyor
                  </p>
                  <button
                    type="button"
                    onClick={onCreateNew}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Müşteri Ekle
                  </button>
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Müşteri aramak için yazmaya başlayın
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;