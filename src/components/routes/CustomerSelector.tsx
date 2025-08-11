import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Clock,
  Star,
  Check
} from 'lucide-react';
import { Customer } from '@/types';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomers: Customer[];
  onSelect: (customer: Customer) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomers,
  onSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter customers based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.code.toLowerCase().includes(query) ||
        customer.address.toLowerCase().includes(query) ||
        customer.phone.includes(query)
      );
      setFilteredCustomers(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredCustomers([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery, customers]);

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

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const isSelected = (customerId: string) => {
    return selectedCustomers.some(c => c.id === customerId);
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setIsDropdownOpen(true)}
          placeholder="Müşteri ara (isim, kod, adres, telefon)..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredCustomers.map(customer => {
            const selected = isSelected(customer.id);
            
            return (
              <div
                key={customer.id}
                onClick={() => !selected && handleSelect(customer)}
                className={`p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                  selected ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Customer Name and Code */}
                    <div className="flex items-center mb-1">
                      <h3 className="font-medium text-gray-900">
                        {customer.name}
                      </h3>
                      <span className="ml-2 text-xs text-gray-500">
                        ({customer.code})
                      </span>
                      {selected && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Eklendi
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-start text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{customer.address}</span>
                    </div>

                    {/* Phone and Time Window */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-gray-500">
                        <Phone className="w-4 h-4 mr-1" />
                        <span>{customer.phone}</span>
                      </div>
                      
                      {customer.timeWindow && (
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            {customer.timeWindow.start} - {customer.timeWindow.end}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags and Priority */}
                    <div className="flex items-center mt-2 space-x-2">
                      {/* Priority */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                        <Star className="w-3 h-3 mr-1" />
                        {getPriorityText(customer.priority)}
                      </span>

                      {/* Tags */}
                      {customer.tags?.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Notes */}
                    {customer.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        <strong>Not:</strong> {customer.notes}
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
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
        </div>
      )}

      {/* No Results */}
      {isDropdownOpen && searchQuery && filteredCustomers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="text-center text-gray-500">
            Müşteri bulunamadı
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;