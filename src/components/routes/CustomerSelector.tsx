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
  Users,
  X
} from 'lucide-react';
import { Customer } from '@/types';
import { normalizeSearchText } from '@/utils/string';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomers: Customer[];
  onSelect?: (customer: Customer) => void;
  onMultiSelect?: (customers: Customer[]) => void;
  onCreateNew?: () => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomers,
  onSelect,
  onMultiSelect,
  onCreateNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMultiSelectModal, setShowMultiSelectModal] = useState(false);
  const [multiSelectList, setMultiSelectList] = useState<Set<string>>(new Set());
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search local customers for single select
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setFilteredCustomers([]);
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, customers]);

  const performSearch = (query: string) => {
    const normalizedQuery = normalizeSearchText(query);
    const filtered = customers.filter(customer => {
      if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
        return false;
      }

      if (isSelected(customer.id.toString())) {
        return false;
      }

      const name = normalizeSearchText(customer.name);
      const code = normalizeSearchText(customer.code);
      const address = normalizeSearchText(customer.address);
      const phone = normalizeSearchText(customer.phone);

      return (
        name.includes(normalizedQuery) ||
        code.includes(normalizedQuery) ||
        address.includes(normalizedQuery) ||
        phone.includes(normalizedQuery)
      );
    });

    setFilteredCustomers(filtered);
    setIsDropdownOpen(filtered.length > 0 || query.trim() !== '');
  };

  // Get customers for modal (with search)
  const getModalCustomers = () => {
    const validCustomers = customers.filter(c =>
      typeof c.id === 'number' || (typeof c.id === 'string' && !c.id.startsWith('google-'))
    );

    const normalizedQuery = normalizeSearchText(modalSearchQuery);
    if (!normalizedQuery) {
      return validCustomers;
    }

    return validCustomers.filter(customer => {
      const name = normalizeSearchText(customer.name);
      const code = normalizeSearchText(customer.code);
      const address = normalizeSearchText(customer.address);
      const phone = normalizeSearchText(customer.phone);

      return (
        name.includes(normalizedQuery) ||
        code.includes(normalizedQuery) ||
        address.includes(normalizedQuery) ||
        phone.includes(normalizedQuery)
      );
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer: Customer) => {
    if (typeof customer.id === 'string' && customer.id.startsWith('google-')) {
      alert('⚠️ Bu müşteri henüz veritabanına kaydedilmemiş. Lütfen önce Müşteriler sayfasından ekleyin.');
      return;
    }

    if (onSelect) {
      onSelect(customer);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleToggleMultiSelect = (customerId: string) => {
    const newSelection = new Set(multiSelectList);
    
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    
    setMultiSelectList(newSelection);
  };

  const handleSelectAll = () => {
    const modalCustomers = getModalCustomers();
    const availableIds = new Set(
      modalCustomers
        .filter(c => !isSelected(c.id.toString()))
        .map(c => c.id.toString())
    );
    setMultiSelectList(availableIds);
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
      setModalSearchQuery('');
      setShowMultiSelectModal(false);
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

  const validCustomersCount = customers.filter(c =>
    typeof c.id === 'number' || (typeof c.id === 'string' && !c.id.startsWith('google-'))
  ).length;

  const modalCustomers = getModalCustomers();
  const availableCustomersCount = modalCustomers.filter(c => 
    !isSelected(c.id.toString())
  ).length;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Search Input with Buttons */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setIsDropdownOpen(true)}
              placeholder="Kayıtlı müşteri ara (isim, kod, adres veya telefon)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {validCustomersCount > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {validCustomersCount} müşteri
              </span>
            )}
          </div>

          {/* Toplu Seçim Butonu */}
          <button
            type="button"
            onClick={() => setShowMultiSelectModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center whitespace-nowrap"
          >
            <Users className="w-4 h-4 mr-2" />
            Toplu Seçim
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

        {/* Single Select Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[500px] overflow-y-auto">
            {filteredCustomers.length > 0 ? (
              <>
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Kayıtlı Müşteriler ({filteredCustomers.length})
                  </h3>
                </div>
                {filteredCustomers.map(customer => {
                  const selected = isSelected(customer.id.toString());

                  return (
                    <div
                      key={customer.id}
                      onClick={() => !selected && handleSelectCustomer(customer)}
                      className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                        selected ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between">
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
                            {selected && (
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
                          </div>
                        </div>

                        {!selected && (
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
              <div className="p-6 text-center">
                {searchQuery ? (
                  <>
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">
                      "{searchQuery}" için sonuç bulunamadı
                    </p>
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

      {/* Multi-Select Modal */}
      {showMultiSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
            {/* Modal Header */}
            <div className="bg-purple-600 text-white p-4 flex items-center justify-between rounded-t-lg">
              <div>
                <h2 className="text-xl font-semibold">Toplu Müşteri Seçimi</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {multiSelectList.size} müşteri seçili / {availableCustomersCount} müşteri mevcut
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMultiSelectModal(false);
                  setMultiSelectList(new Set());
                  setModalSearchQuery('');
                }}
                className="p-2 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Müşteri ara..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tümünü Seç
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Temizle
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {modalCustomers.length > 0 ? (
                modalCustomers.map(customer => {
                  const alreadySelected = isSelected(customer.id.toString());
                  const inMultiSelectList = isInMultiSelectList(customer.id.toString());

                  return (
                    <div
                      key={customer.id}
                      onClick={() => {
                        // Sadece daha önce eklenmemiş olanlar seçilebilir
                        if (!alreadySelected) {
                          handleToggleMultiSelect(customer.id.toString());
                        }
                      }}
                      className={`p-4 border-b border-gray-100 transition-colors ${
                        alreadySelected 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : inMultiSelectList 
                            ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer' 
                            : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="mr-4 mt-1">
                          {alreadySelected ? (
                            <div className="w-5 h-5 bg-gray-300 rounded flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          ) : inMultiSelectList ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h3 className={`font-medium ${alreadySelected ? 'text-gray-500' : 'text-gray-900'}`}>
                              {customer.name}
                            </h3>
                            {customer.code && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({customer.code})
                              </span>
                            )}
                            {alreadySelected && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                Rotada Mevcut
                              </span>
                            )}
                          </div>

                          <div className={`flex items-start text-sm ${alreadySelected ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{customer.address}</span>
                          </div>

                          {(customer.phone || customer.estimatedServiceTime) && (
                            <div className="flex items-center space-x-4 text-sm mt-1">
                              {customer.phone && (
                                <div className={`flex items-center ${alreadySelected ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Phone className="w-4 h-4 mr-1" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                              {customer.estimatedServiceTime && (
                                <div className={`flex items-center ${alreadySelected ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>{customer.estimatedServiceTime} dk</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    {modalSearchQuery 
                      ? `"${modalSearchQuery}" için sonuç bulunamadı`
                      : 'Henüz kayıtlı müşteri yok'}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setShowMultiSelectModal(false);
                  setMultiSelectList(new Set());
                  setModalSearchQuery('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddSelected}
                disabled={multiSelectList.size === 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Seçilenleri Ekle ({multiSelectList.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerSelector;
